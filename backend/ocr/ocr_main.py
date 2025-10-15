
import sys
import os
import shutil
import json
import uuid
import traceback
from datetime import datetime
from typing import Dict
from fastapi import Form



from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw
import cv2
import numpy as np
import torch
from tqdm import tqdm

# Add backend folder to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .. import models, database

# --- AI Model Setup ---
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from ultralytics import YOLO



# --- AI Model & Processor Setup ---
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from ultralytics import YOLO

# Path to your custom YOLOv8 model
YOLO_MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")

# --- File Storage Setup ---
TICKETS_DIR = r"C:\admin_webpage\backend\storage\Tickets"
TEMP_LINES_DIR = r"C:\admin_webpage\backend\storage\temp_lines"
DEBUG_DIR = r"C:\admin_webpage\backend\storage\debug_output"
os.makedirs(TICKETS_DIR, exist_ok=True)
os.makedirs(TEMP_LINES_DIR, exist_ok=True)
os.makedirs(DEBUG_DIR, exist_ok=True)

# Router setup
router = APIRouter(prefix="/api/ocr", tags=["OCR"])

# --- AI Model Loading ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

print("Loading Hugging Face TrOCR model...")
processor = TrOCRProcessor.from_pretrained('microsoft/trocr-large-handwritten')
model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-large-handwritten').to(device)
print("✅ TrOCR model loaded successfully.")

print("Loading custom YOLOv8 model for table cell detection...")
if not os.path.exists(YOLO_MODEL_PATH):
    print(f"❌ CRITICAL ERROR: YOLO model not found at '{YOLO_MODEL_PATH}'")
    yolo_model = None
else:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    print("✅ Custom YOLOv8 model loaded successfully.")

# ------------------------------------------------------------------- #
# --- TABLE DETECTION & EXTRACTION --- #
# ------------------------------------------------------------------- #
def enhance_cell_image(cell_cv_image):
    if cell_cv_image.shape[0] < 10 or cell_cv_image.shape[1] < 10:
        return None

    gray = cv2.cvtColor(cell_cv_image, cv2.COLOR_BGR2GRAY)
    target_height = 64
    aspect_ratio = target_height / gray.shape[0]
    new_width = int(gray.shape[1] * aspect_ratio)
    resized = cv2.resize(gray, (new_width, target_height), interpolation=cv2.INTER_CUBIC)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    contrasted = clahe.apply(resized)

    _, final_image = cv2.threshold(contrasted, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    final_image_rgb = cv2.cvtColor(final_image, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(final_image_rgb)

def recognize_cell_text(cell_image: Image.Image):
    if cell_image is None or cell_image.width < 5 or cell_image.height < 5:
        return ""
    try:
        pixel_values = processor(images=cell_image, return_tensors="pt").pixel_values.to(device)
        generated_ids = model.generate(pixel_values, max_length=300)
        return processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
    except Exception:
        return ""

def extract_table_data_yolo(image: Image.Image, debug_dir_path: str):
    print("Running table extraction...")
    if yolo_model is None:
        print("⚠️ YOLO model not loaded.")
        return None

    original_image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(original_image_cv, cv2.COLOR_BGR2GRAY)
    processed_for_detection = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    processed_for_detection_bgr = cv2.cvtColor(processed_for_detection, cv2.COLOR_GRAY2BGR)
    cv2.imwrite(os.path.join(debug_dir_path, "1_preprocessed.png"), processed_for_detection_bgr)

    results = yolo_model.predict(processed_for_detection_bgr, conf=0.2, verbose=False)
    if not results or results[0].boxes is None or results[0].boxes.xyxy is None:
        return None

    cell_boxes = sorted(results[0].boxes.cpu().numpy().xyxy.astype(int).tolist(), key=lambda b: (b[1], b[0]))
    if not cell_boxes:
        return None

    rows, current_row = [], []
    ref_y = cell_boxes[0][1]
    cell_height = cell_boxes[0][3] - cell_boxes[0][1]
    for box in cell_boxes:
        if box[1] > ref_y + cell_height * 0.8:
            rows.append(sorted(current_row, key=lambda b: b[0]))
            current_row = [box]
            ref_y = box[1]
        else:
            current_row.append(box)
    rows.append(sorted(current_row, key=lambda b: b[0]))

    table_data = []
    draw_img = image.copy()
    draw = ImageDraw.Draw(draw_img)

    for i, row_boxes in enumerate(tqdm(rows, desc="Reading Rows")):
        row_text = []
        for j, box in enumerate(row_boxes):
            x1, y1, x2, y2 = box
            cell_image_cv = original_image_cv[y1:y2, x1:x2]
            enhanced_cell_pil = enhance_cell_image(cell_image_cv)
            if enhanced_cell_pil:
                enhanced_cell_pil.save(os.path.join(debug_dir_path, f"cell_{i:02d}_{j:02d}.png"))
            draw.rectangle([x1, y1, x2, y2], outline="red", width=1)
            text = recognize_cell_text(enhanced_cell_pil)
            row_text.append(text)
        table_data.append(row_text)

    draw_img.save(os.path.join(debug_dir_path, "2_detected_cells.png"))
    return {"extracted_table": table_data, "debug_output_path": debug_dir_path}


# ------------------------------------------------------------------- #
# --- LINE SEGMENTATION FUNCTIONS --- #
# ------------------------------------------------------------------- #
def extract_lines_data(image_path: str, unique_filename: str):
    scan_temp_dir = os.path.join(TEMP_LINES_DIR, unique_filename)
    os.makedirs(scan_temp_dir, exist_ok=True)
    try:
        line_image_paths = segment_lines(image_path, scan_temp_dir)
        if not line_image_paths:
            return None
        full_text = [recognize_line(p) for p in line_image_paths]
        return {"extracted_text": "\n".join(full_text)}
    finally:
        if os.path.exists(scan_temp_dir): shutil.rmtree(scan_temp_dir)

def segment_lines(image_path, output_dir):
    image = cv2.imread(image_path)
    if image is None: return []
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours: return []
    bounding_boxes = sorted([cv2.boundingRect(c) for c in contours], key=lambda b: b[1])
    heights = [h for _, _, _, h in bounding_boxes if h > 5]
    if not heights: return []
    avg_height, lines = np.mean(heights), []
    current_line = [bounding_boxes[0]]
    for box in bounding_boxes[1:]:
        if abs((box[1]+box[3]/2)-(current_line[-1][1]+current_line[-1][3]/2)) < avg_height:
            current_line.append(box)
        else:
            lines.append(current_line); current_line = [box]
    lines.append(current_line)
    return crop_and_save_lines(image, lines, output_dir)

def crop_and_save_lines(image, lines, output_dir):
    cropped_paths = []
    for i, line_boxes in enumerate(lines):
        if not line_boxes: continue
        x_min, y_min = min(b[0] for b in line_boxes), min(b[1] for b in line_boxes)
        x_max, y_max = max(b[0]+b[2] for b in line_boxes), max(b[1]+b[3] for b in line_boxes)
        line_img = image[y_min:y_max, x_min:x_max]
        path = os.path.join(output_dir, f"line_{i:03d}.png")
        if cv2.imwrite(path, line_img): cropped_paths.append(path)
    return cropped_paths

def recognize_line(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        pixel_values = processor(images=image, return_tensors="pt").pixel_values.to(device)
        generated_ids = model.generate(pixel_values)
        return processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
    except Exception:
        return ""


# ------------------------------------------------------------------- #
# --- ROUTES --- # shivani code
# ------------------------------------------------------------------- #
# @router.post("/scan")
# async def scan_ticket(
#     file: UploadFile = File(...),
#     db: Session = Depends(database.get_db)
# ):
#     if not file.content_type.startswith("image/"):
#         raise HTTPException(status_code=400, detail="File must be an image.")

#     unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{os.path.basename(file.filename)}"
#     saved_image_path = os.path.join(TICKETS_DIR, unique_filename)
#     debug_scan_dir = os.path.join(DEBUG_DIR, unique_filename)
#     os.makedirs(debug_scan_dir, exist_ok=True)

#     try:
#         with open(saved_image_path, "wb") as f:
#             f.write(await file.read())
#         image_pil = Image.open(saved_image_path).convert("RGB")
#         table_result = extract_table_data_yolo(image_pil, debug_scan_dir)

#         if table_result:
#             print("✅ Table found! Processing as a table.")
#             db_text = json.dumps(table_result["extracted_table"])
#             response_data = table_result
#         else:
#             print("⚠️ No table found. Falling back to line-by-line segmentation.")
#             line_result = extract_lines_data(saved_image_path, unique_filename)
#             if not line_result:
#                 raise HTTPException(status_code=400, detail="Could not detect any text in the image.")
#             print("✅ Lines processed successfully.")
#             db_text = line_result["extracted_text"]
#             response_data = line_result

#         new_ticket = models.Ticket(
#             extracted_text=db_text,
#             image_path=saved_image_path
#         )
#         db.add(new_ticket)
#         db.commit()
#         db.refresh(new_ticket)
#         print(f"Saving image to absolute path: {os.path.abspath(saved_image_path)}")
#         return {"filename": file.filename, "saved_path": saved_image_path, **response_data}
        
#     except Exception as e:
#         if isinstance(e, HTTPException):
#             raise e
#         print(f"An unexpected error occurred: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
#     finally:
#         if os.path.exists(debug_scan_dir):
#             shutil.rmtree(debug_scan_dir)



# working code 14/10/2025 evening
# @router.post("/scan")
# async def scan_ticket(
#     file: UploadFile = File(...),
#     db: Session = Depends(database.get_db)
# ):
#     if not file.content_type.startswith("image/"):
#         raise HTTPException(status_code=400, detail="File must be an image.")

#     unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{os.path.basename(file.filename)}"
#     saved_image_path = os.path.join(TICKETS_DIR, unique_filename)
#     debug_scan_dir = os.path.join(DEBUG_DIR, unique_filename)
#     os.makedirs(debug_scan_dir, exist_ok=True)

#     try:
#         with open(saved_image_path, "wb") as f:
#             f.write(await file.read())

#         image_pil = Image.open(saved_image_path).convert("RGB")
#         table_result = extract_table_data_yolo(image_pil, debug_scan_dir)

#         db_text = json.dumps(table_result["extracted_table"]) if table_result else ""

#         filename_only = os.path.basename(saved_image_path)
#         relative_url_path = f"/media/tickets/{filename_only}"

#         new_ticket = models.Ticket(
#             extracted_text=db_text,
#             image_path=relative_url_path
#         )
#         db.add(new_ticket)
#         db.commit()
#         db.refresh(new_ticket)

#         return {
#             "filename": file.filename,
#             "saved_path": relative_url_path,
#             "message": "Scanning successful"
#         }

#     except Exception as e:
#         if isinstance(e, HTTPException):
#             raise e
#         print(f"An unexpected error occurred: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
#     finally:
#         if os.path.exists(debug_scan_dir):
#             shutil.rmtree(debug_scan_dir)
@router.post("/scan")
async def scan_ticket(
    file: UploadFile = File(...),
    foreman_id: int = Form(...),     # Get foreman_id from request
    db: Session = Depends(database.get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Unique filename including foreman_id
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{foreman_id}_{os.path.basename(file.filename)}"
    saved_image_path = os.path.join(TICKETS_DIR, unique_filename)
    debug_scan_dir = os.path.join(DEBUG_DIR, unique_filename)
    os.makedirs(debug_scan_dir, exist_ok=True)

    try:
        # Save the uploaded file
        with open(saved_image_path, "wb") as f:
            f.write(await file.read())

        image_pil = Image.open(saved_image_path).convert("RGB")
        table_result = extract_table_data_yolo(image_pil, debug_scan_dir)

        # Convert extracted table data to JSON if present
        db_text = json.dumps(table_result["extracted_table"]) if table_result else ""

        relative_url_path = f"/media/tickets/{unique_filename}"

        # Create new Ticket without job_phase_id
        new_ticket = models.Ticket(
            foreman_id=foreman_id,
            extracted_text=db_text,
            image_path=relative_url_path
        )
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)

        return {
            "filename": file.filename,
            "saved_path": relative_url_path,
            "foreman_id": foreman_id,
            "message": "Scanning successful"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
    finally:
        if os.path.exists(debug_scan_dir):
            shutil.rmtree(debug_scan_dir)


# @router.get("/tickets")
# def list_tickets(db: Session = Depends(database.get_db)):
#     tickets = db.query(models.Ticket).all()
#     return {"tickets": [
#         {
#             "id": t.id,
#             "extracted_text": t.extracted_text,
#             "extracted_table": getattr(t, "extracted_table", None),  # or customize based on your schema
#             "image_path": t.image_path
#         }
#         for t in tickets
#     ]}
from collections import defaultdict

# working code
# @router.get("/images-by-date")
# def list_images_by_date(db: Session = Depends(database.get_db)):
#     from datetime import datetime
#     from collections import defaultdict
    
#     tickets = db.query(models.Ticket).all()

#     grouped = defaultdict(list)
#     for t in tickets:
#         # Replace 'created_at' with your actual timestamp field name
#         timestamp = getattr(t, 'created_at', None)
#         if timestamp:
#             date_str = timestamp.strftime("%Y-%m-%d")
#         else:
#             # If no timestamp, fallback to today's date
#             date_str = datetime.today().strftime("%Y-%m-%d")

#         grouped[date_str].append({
#             "id": t.id,
#             "image_url": t.image_path
#         })

#     images_by_date = [{"date": date, "images": imgs} for date, imgs in grouped.items()]

#     return {"imagesByDate": images_by_date}


@router.get("/images-by-date/{foreman_id}")
def list_images_by_date(foreman_id: int, db: Session = Depends(database.get_db)):
    from datetime import datetime
    from collections import defaultdict
    tickets = db.query(models.Ticket).filter(models.Ticket.foreman_id == foreman_id).all()
    grouped = defaultdict(list)
    for t in tickets:
        date_str = t.created_at.strftime("%Y-%m-%d") if t.created_at else datetime.today().strftime("%Y-%m-%d")
        grouped[date_str].append({
            "id": t.id,
            "image_url": t.image_path
        })
    return {"imagesByDate": [{"date": date, "images": imgs} for date, imgs in grouped.items()]}


@router.get("/")
async def root():
    return {"message": "OCR API is running successfully!"}
@router.get("/by-foreman/{foreman_id}")
def get_tickets_by_foreman(foreman_id: int, db: Session = Depends(database.get_db)):
    """
    Returns all tickets uploaded by a specific foreman.
    """
    tickets = db.query(models.Ticket).filter(models.Ticket.foreman_id == foreman_id).all()
    return tickets