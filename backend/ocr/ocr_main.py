import os
import cv2
import torch
import shutil
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from datetime import datetime

# ------------------------------------------------------------------
# Create Router (instead of standalone FastAPI app)
# ------------------------------------------------------------------
router = APIRouter(prefix="/api/ocr", tags=["OCR"])

# ------------------------------------------------------------------
# Paths setup
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(__file__)

TICKETS_DIR = os.path.join(BASE_DIR, "tickets")
DEBUG_DIR = os.path.join(BASE_DIR, "debug_output")
LINES_DIR = os.path.join(BASE_DIR, "temp_lines")
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

os.makedirs(TICKETS_DIR, exist_ok=True)
os.makedirs(DEBUG_DIR, exist_ok=True)
os.makedirs(LINES_DIR, exist_ok=True)

# ------------------------------------------------------------------
# Load model once at startup
# ------------------------------------------------------------------
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Error loading YOLO model: {e}")

# ------------------------------------------------------------------
# OCR Helper functions
# ------------------------------------------------------------------
def preprocess_image(image_path):
    """Basic preprocessing before line detection."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return gray


def detect_lines(image_path, save_folder):
    """Detect and extract lines (dummy logic – replace with your own if needed)."""
    img = preprocess_image(image_path)
    height, width = img.shape
    step = max(20, height // 20)

    line_images = []
    for y in range(0, height, step):
        crop = img[y:y+step, :]
        filename = os.path.join(save_folder, f"line_{y}.jpg")
        cv2.imwrite(filename, crop)
        line_images.append(filename)

    return line_images


def run_yolo_detection(image_path):
    """Run YOLO model to detect text regions."""
    results = model(image_path)
    detections = []

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box)
            detections.append([x1, y1, x2, y2])
    return detections


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@router.get("/")
async def root():
    return {"message": "OCR API is working successfully!"}


@router.post("/scan")
async def scan_ticket(file: UploadFile = File(...)):
    """Upload and scan a ticket image."""
    try:
        # Save uploaded image
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        image_path = os.path.join(TICKETS_DIR, filename)

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Debug info
        print(f"[OCR] Image saved at: {image_path}")

        # Run YOLO detection
        detections = run_yolo_detection(image_path)

        # Line detection for reference
        line_images = detect_lines(image_path, LINES_DIR)

        response_data = {
            "filename": filename,
            "detections": detections,
            "lines_extracted": len(line_images),
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        print(f"[OCR] Error during scan: {e}")
        raise HTTPException(status_code=500, detail=f"OCR scan failed: {e}")


@router.get("/tickets")
async def list_tickets():
    """List all scanned tickets in the folder."""
    try:
        files = os.listdir(TICKETS_DIR)
        tickets = [f for f in files if f.lower().endswith((".jpg", ".png", ".jpeg"))]
        return {"tickets": tickets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
