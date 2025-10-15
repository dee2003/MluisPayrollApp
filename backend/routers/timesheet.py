# # /app/routes/timesheets.py
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import List
# from .. import models, schemas
# from ..database import get_db
# import os
# import pandas as pd
# import json
# from ..models import User  # assuming your foreman/user model is in models.py
# from datetime import datetime
# import time
# from sqlalchemy.orm import Session, joinedload

# router = APIRouter(
#     prefix="/api/timesheets",
#     tags=["Timesheets"]
# )

# # -------------------------------
# # CREATE a new timesheet
# # -------------------------------
# @router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
# @router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
# def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
#     """
#     Creates a new timesheet record and correctly stores 'timesheet_name'.
#     """
#     data_to_store = timesheet.data or {}

#     # Extract job_name from the nested data
#     job_name = data_to_store.get("job_name")
#     if not job_name:
#         job = data_to_store.get("job", {})
#         job_name = job.get("job_description") or job.get("job_name") or job.get("job_code") or "Untitled Timesheet"

#     db_timesheet = models.Timesheet(
#         foreman_id=timesheet.foreman_id,
#         date=timesheet.date,
#         timesheet_name=job_name,  # ✅ now it will be stored correctly
#         data=data_to_store,
#         sent=False,
#         status=timesheet.status
#     )
#     db.add(db_timesheet)
#     db.commit()
#     db.refresh(db_timesheet)
#     return db_timesheet

# # -------------------------------
# # GET all timesheets for a foreman
# # -------------------------------
# @router.get("/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
# def get_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
#     """
#     Returns all timesheets for a given foreman.
#     Returns an empty list if none exist.
#     """
#     timesheets = db.query(models.Timesheet).filter(models.Timesheet.foreman_id == foreman_id).all()
#     return timesheets

# @router.get("/for-supervisor", response_model=List[schemas.Timesheet])
# def get_timesheets_for_supervisor(db: Session = Depends(get_db)):
#     """
#     Returns all timesheets marked as 'sent', with files eagerly loaded.
#     """
#     timesheets = (
#         db.query(models.Timesheet)
#         .options(joinedload(models.Timesheet.files)) # <-- Correct eager loading
#         .filter(models.Timesheet.sent == True)
#         .all()
#     )
#     return timesheets


# # -------------------------------
# # GET a single timesheet by ID
# # -------------------------------
# @router.get("/{timesheet_id}", response_model=schemas.Timesheet)
# def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not timesheet:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     # Deserialize timesheet.data if stored as string
#     data = timesheet.data
#     if isinstance(data, str):
#         data = json.loads(data)

#     # Query employee details separately (or join if preferred)
#     employee_ids = [e.get("id") for e in data.get("employees", [])]
#     employees = db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all()

#     # Map employees to dict with class fields exposed as class_1, class_2
#     employee_dicts = []
#     for emp in employees:
#         employee_dicts.append({
#             "id": emp.id,
#             "first_name": emp.first_name,
#             "middle_name": emp.middle_name,
#             "last_name": emp.last_name,
#             "class_1": emp.class_1,          # expose DB field here
#             "class_2": emp.class_2,
#             "status": emp.status,
#             # Add other employee fields as needed
#         })

#     # Replace employees field in timesheet.data with enriched employee data
#     data["employees"] = employee_dicts

#     # Attach modified data back to timesheet response
#     timesheet.data = data

#     return timesheet



# # -------------------------------
# # UPDATE a timesheet + save Excel file
# # -------------------------------
# from ..models import TimesheetFile

# @router.put("/{timesheet_id}", response_model=schemas.Timesheet)
# def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
#     """
#     Updates a timesheet, generates an Excel file, and stores it in a date-wise folder.
#     Keeps all previous versions of the timesheet.
#     """
#     NGROK_BASE_URL = "https://5b785fe4e786.ngrok-free.app"

#     timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not timesheet:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     # Update fields from the request payload
#     update_data = timesheet_update.dict(exclude_unset=True)
#     for key, value in update_data.items():
#         setattr(timesheet, key, value)
#     db.commit()
#     db.refresh(timesheet)

#     try:
#         BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#         storage_dir = os.path.join(BASE_DIR, "storage")
#         os.makedirs(storage_dir, exist_ok=True)

#         # Format date string for filename
#         ts_date_str = timesheet.date.strftime("%Y-%m-%d") if hasattr(timesheet.date, "strftime") else str(timesheet.date)

#         # Create date-wise folder inside storage
#         date_folder = os.path.join(storage_dir, ts_date_str)
#         os.makedirs(date_folder, exist_ok=True)

#         # Count existing files for this timesheet to avoid overwriting
#         existing_files = [f for f in os.listdir(date_folder) if f.startswith(f"timesheet_{timesheet_id}_")]
#         version_number = len(existing_files) + 1
#         file_name = f"timesheet_{timesheet_id}_{ts_date_str}_v{version_number}.xlsx"
#         file_path_local = os.path.join(date_folder, file_name)

#         # Load timesheet data
#         data = timesheet.data if isinstance(timesheet.data, dict) else json.loads(timesheet.data)
#         job_phases = data.get("job", {}).get("phase_codes", [])

#         # Helper to safely create DataFrame
#         def create_df(entities, name_key="name"):
#             rows = []
#             for ent in entities:
#                 # fallback to empty string if key doesn't exist
#                 name_value = ent.get(name_key) or ent.get("first_name") or ent.get("last_name") or ""
#                 row = {"ID": ent.get("id", ""), "Name": name_value}
#                 for phase in job_phases:
#                     row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
#                 rows.append(row)
#             return pd.DataFrame(rows)

#         # Generate Excel sheets
#         df_emp = create_df(data.get("employees", []), name_key="first_name")
#         df_emp["Name"] = df_emp["Name"] + " " + pd.Series([e.get("last_name", "") or "" for e in data.get("employees", [])])

#         df_eq = create_df(data.get("equipment", []))
#         df_mat = create_df(data.get("materials", []))
#         df_vend = create_df(data.get("vendors", []))

#         with pd.ExcelWriter(file_path_local, engine="openpyxl") as writer:
#             df_emp.to_excel(writer, index=False, sheet_name="Employees")
#             df_eq.to_excel(writer, index=False, sheet_name="Equipment")
#             df_mat.to_excel(writer, index=False, sheet_name="Materials")
#             df_vend.to_excel(writer, index=False, sheet_name="Vendors")

#         # Public URL
#         file_url = f"{NGROK_BASE_URL}/storage/{ts_date_str}/{file_name}"

#         # Save file info in database
#         new_file = models.TimesheetFile(
#             timesheet_id=timesheet.id,
#             file_path=file_url,
#             foreman_id=timesheet.foreman_id
#         )
#         db.add(new_file)
#         db.commit()

#         print(f"✅ Excel saved successfully and URL recorded: {file_url}")

#         # Update timesheet status
#         timesheet.sent = True
#         timesheet.status = "sent"
#         db.commit()

#     except Exception as e:
#         print(f"❌ Excel generation/recording failed: {e}")

#     return timesheet




# # -------------------------------
# # DELETE a timesheet
# # -------------------------------
# @router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     """
#     Deletes a timesheet by ID.
#     """
#     timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not timesheet:
#         raise HTTPException(status_code=404, detail="Timesheet not found")
#     db.delete(timesheet)
#     db.commit()
#     return
# from fastapi import Query

# @router.get("/", response_model=List[schemas.Timesheet])
# def get_all_timesheets(db: Session = Depends(get_db)):
#     timesheets = db.query(models.Timesheet).all()
#     result = []
#     for ts in timesheets:
#         ts_data = ts.__dict__.copy()
#         # Attach foreman name
#         foreman = db.query(User).filter(User.id == ts.foreman_id).first()
#         ts_data["foreman_name"] = f"{foreman.first_name} {foreman.last_name}" if foreman else "N/A"
#         # Parse JSON string if needed
#         if isinstance(ts_data["data"], str):
#             ts_data["data"] = json.loads(ts_data["data"])
#         result.append(ts_data)
#     return result

# @router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
# def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not ts:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     # Mark as sent
#     ts.sent = True
#     ts.status = "sent"

#     # Optional: create workflow entry
#     workflow = models.TimesheetWorkflow(
#         timesheet_id=ts.id,
#         foreman_id=ts.foreman_id,
#         supervisor_id=None,  # assign if known
#         action="sent"
#     )
#     db.add(workflow)
#     db.commit()
#     db.refresh(ts)

#     return ts
# @router.get("/{timesheet_id}/view", response_model=schemas.Timesheet)
# def view_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     """
#     Returns the timesheet data as JSON for display purposes.
#     This endpoint is used by supervisors to view the timesheet in-app.
#     """
#     ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not ts:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     # Deserialize JSON if stored as string
#     data = ts.data
#     if isinstance(data, str):
#         data = json.loads(data)

#     # Enrich employees with class info
#     employee_ids = [e.get("id") for e in data.get("employees", [])]
#     employees = db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all()

#     enriched_employees = []
#     for emp in employees:
#         enriched_employees.append({
#             "id": emp.id,
#             "first_name": emp.first_name,
#             "middle_name": emp.middle_name,
#             "last_name": emp.last_name,
#             "class_1": emp.class_1,
#             "class_2": emp.class_2,
#             "selected_class": next((e.get("selected_class") for e in data.get("employees", []) if e.get("id") == emp.id), None),
#             "hours_per_phase": next((e.get("hours_per_phase") for e in data.get("employees", []) if e.get("id") == emp.id), {}),
#         })
#     data["employees"] = enriched_employees

#     # Similar logic for equipment, materials, vendors
#     for key in ["equipment", "materials", "vendors"]:
#         entities = data.get(key, [])
#         for ent in entities:
#             ent["hours_per_phase"] = ent.get("hours_per_phase", {})

#     ts.data = data
#     return ts




from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db
import os
import pandas as pd
import json
from datetime import datetime

router = APIRouter(
    prefix="/api/timesheets",
    tags=["Timesheets"]
)

# -------------------------------
# CREATE a new timesheet
# -------------------------------
@router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """
    Creates a new timesheet record; timesheet_name is derived from data.
    """
    data_to_store = timesheet.data or {}
    job_name = (
        data_to_store.get("job_name")
        or data_to_store.get("job", {}).get("job_description")
        or data_to_store.get("job", {}).get("job_name")
        or data_to_store.get("job", {}).get("job_code")
        or "Untitled Timesheet"
    )

    db_timesheet = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        date=timesheet.date,
        timesheet_name=job_name,
        data=data_to_store,
        sent=False,
        status=timesheet.status,
    )
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet


# -------------------------------
# GET all timesheets for a foreman
# -------------------------------
@router.get("/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
def get_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
    """
    Returns all timesheets for a given foreman.
    Uses joinedload to eagerly load files to avoid 422 validation issues.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.foreman_id == foreman_id)
        .all()
    )
    return timesheets


# -------------------------------
# GET timesheets for supervisor
# -------------------------------
@router.get("/for-supervisor", response_model=List[schemas.Timesheet])
def get_timesheets_for_supervisor(db: Session = Depends(get_db)):
    """
    Returns timesheets marked as sent.
    Uses joinedload to eagerly load files to avoid 422 validation issues.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.sent == True)
        .all()
    )
    return timesheets


# -------------------------------
# GET a single timesheet by ID
# -------------------------------
@router.get("/{timesheet_id}", response_model=schemas.Timesheet)
def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    """
    Returns a single timesheet, merging the foreman-saved JSON with static employee info.
    Files are eagerly loaded.
    """
    timesheet = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.id == timesheet_id)
        .first()
    )
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    # Foreman-saved JSON
    saved_data = timesheet.data
    if isinstance(saved_data, str):
        try:
            saved_data = json.loads(saved_data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Invalid timesheet JSON data")

    # Enrich employees with DB details, but keep foreman-entered values
    saved_employees = saved_data.get("employees", [])
    if saved_employees:
        saved_map = {e.get("id"): e for e in saved_employees if e.get("id") is not None}
        ids = list(saved_map.keys())
        if ids:
            db_emps = db.query(models.Employee).filter(models.Employee.id.in_(ids)).all()
            enriched = []
            for emp in db_emps:
                submitted = saved_map.get(emp.id, {})
                enriched.append({
                    "id": emp.id,
                    "first_name": emp.first_name,
                    "middle_name": emp.middle_name,
                    "last_name": emp.last_name,
                    "class_1": emp.class_1,
                    "class_2": emp.class_2,
                    # Source of truth from foreman
                    "selected_class": submitted.get("selected_class"),
                    "hours_per_phase": submitted.get("hours_per_phase", {}),
                })
            saved_data = {**saved_data, "employees": enriched}

    timesheet.data = saved_data
    return timesheet


# -------------------------------
# UPDATE a timesheet + save Excel file
# -------------------------------
@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
    """
    Updates timesheet.data and optionally status, then generates a versioned Excel file.
    """
    NGROK_BASE_URL = "https://5b785fe4e786.ngrok-free.app"  # move to config/env

    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    payload = timesheet_update.dict(exclude_unset=True)
    if "data" in payload:
        ts.data = payload["data"]
    if "status" in payload:
        ts.status = payload["status"]

    db.commit()
    db.refresh(ts)

    # Generate Excel using the now-committed data
    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        storage_dir = os.path.join(BASE_DIR, "storage")
        os.makedirs(storage_dir, exist_ok=True)

        ts_date_str = ts.date.strftime("%Y-%m-%d") if hasattr(ts.date, "strftime") else str(ts.date)
        date_folder = os.path.join(storage_dir, ts_date_str)
        os.makedirs(date_folder, exist_ok=True)

        existing = [f for f in os.listdir(date_folder) if f.startswith(f"timesheet_{ts.id}_")]
        version = len(existing) + 1
        file_name = f"timesheet_{ts.id}_{ts_date_str}_v{version}.xlsx"
        file_path_local = os.path.join(date_folder, file_name)

        data = ts.data if isinstance(ts.data, dict) else json.loads(ts.data)
        job_phases = data.get("job", {}).get("phase_codes", [])

        def create_df(entities, name_key="name"):
            rows = []
            for ent in entities:
                name = ent.get(name_key) or ent.get("first_name", "") or ""
                if "last_name" in ent:
                    name = f"{name} {ent.get('last_name', '')}".strip()
                row = {"ID": ent.get("id", ""), "Name": name}
                for phase in job_phases:
                    row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)

        with pd.ExcelWriter(file_path_local, engine="openpyxl") as writer:
            df_emp = create_df(data.get("employees", []), name_key="first_name")
            df_emp.to_excel(writer, index=False, sheet_name="Employees")

            df_eq = create_df(data.get("equipment", []))
            df_eq.to_excel(writer, index=False, sheet_name="Equipment")

            df_mat = create_df(data.get("materials", []))
            df_mat.to_excel(writer, index=False, sheet_name="Materials")

            df_vend = create_df(data.get("vendors", []))
            df_vend.to_excel(writer, index=False, sheet_name="Vendors")

        file_url = f"{NGROK_BASE_URL}/storage/{ts_date_str}/{file_name}"

        new_file = models.TimesheetFile(
            timesheet_id=ts.id,
            file_path=file_url,
            foreman_id=ts.foreman_id,
        )
        db.add(new_file)

        # Update sent/status if this update represents a send action on save
        # ts.sent = True
        # ts.status = "sent"

        db.commit()

    except Exception as e:
        print(f"❌ Excel generation/recording failed: {e}")

    return ts


# -------------------------------
# SEND a timesheet
# -------------------------------
@router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    ts.sent = True
    ts.status = "sent"

    # Optional workflow entry
    workflow = models.TimesheetWorkflow(
        timesheet_id=ts.id,
        foreman_id=ts.foreman_id,
        supervisor_id=None,
        action="sent",
        timestamp=datetime.utcnow(),
    )
    db.add(workflow)
    db.commit()
    db.refresh(ts)
    return ts


# -------------------------------
# DELETE a timesheet
# -------------------------------
@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    db.delete(ts)
    db.commit()
    return
@router.get("/", response_model=List[schemas.Timesheet])
def list_timesheets(db: Session = Depends(get_db)):
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .all()
    )
    return timesheets
                                                                       