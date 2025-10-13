# /app/routes/timesheets.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
import os
import pandas as pd
import json
from ..models import User  # assuming your foreman/user model is in models.py
from datetime import datetime

router = APIRouter(
    prefix="/api/timesheets",
    tags=["Timesheets"]
)

# -------------------------------
# CREATE a new timesheet
# -------------------------------
@router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """
    Creates a new timesheet record and correctly stores 'timesheet_name'.
    """
    data_to_store = timesheet.data or {}

    # Extract job_name from the nested data
    job_name = data_to_store.get("job_name")
    if not job_name:
        job = data_to_store.get("job", {})
        job_name = job.get("job_description") or job.get("job_name") or job.get("job_code") or "Untitled Timesheet"

    db_timesheet = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        date=timesheet.date,
        timesheet_name=job_name,  # ✅ now it will be stored correctly
        data=data_to_store,
        sent=False,
        status=timesheet.status
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
    Returns an empty list if none exist.
    """
    timesheets = db.query(models.Timesheet).filter(models.Timesheet.foreman_id == foreman_id).all()
    return timesheets


# -------------------------------
# GET a single timesheet by ID
# -------------------------------
@router.get("/{timesheet_id}", response_model=schemas.Timesheet)
def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    # Deserialize timesheet.data if stored as string
    data = timesheet.data
    if isinstance(data, str):
        data = json.loads(data)

    # Query employee details separately (or join if preferred)
    employee_ids = [e.get("id") for e in data.get("employees", [])]
    employees = db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all()

    # Map employees to dict with class fields exposed as class_1, class_2
    employee_dicts = []
    for emp in employees:
        employee_dicts.append({
            "id": emp.id,
            "first_name": emp.first_name,
            "middle_name": emp.middle_name,
            "last_name": emp.last_name,
            "class_1": emp.class_1,          # expose DB field here
            "class_2": emp.class_2,
            "status": emp.status,
            # Add other employee fields as needed
        })

    # Replace employees field in timesheet.data with enriched employee data
    data["employees"] = employee_dicts

    # Attach modified data back to timesheet response
    timesheet.data = data

    return timesheet



# -------------------------------
# UPDATE a timesheet + save Excel file
# -------------------------------
@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
    """
    Updates a timesheet and saves the updated data into an Excel file in the backend 'storage' folder.
    """
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    # Update fields with partial data
    update_data = timesheet_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(timesheet, key, value)

    db.commit()
    db.refresh(timesheet)

    try:
        # Absolute path to project root → storage folder
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        storage_dir = os.path.join(BASE_DIR, "storage")
        os.makedirs(storage_dir, exist_ok=True)

        # Assign date string before building file path
        ts_date_str = timesheet.date.strftime("%Y-%m-%d") if hasattr(timesheet.date, "strftime") else str(timesheet.date)
        file_path = os.path.join(storage_dir, f"timesheet_{timesheet_id}_{ts_date_str}.xlsx")

        # Parse JSON data
        data = timesheet.data if isinstance(timesheet.data, dict) else json.loads(timesheet.data)
        job_phases = data.get("job", {}).get("phase_codes", [])

        # Helper function to create DataFrame per entity type
        def create_df(entities, name_key="name"):
            rows = []
            for ent in entities:
                row = {"ID": ent.get("id"), "Name": ent.get(name_key, "")}
                for phase in job_phases:
                    row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)

        df_emp = create_df(data.get("employees", []), name_key="first_name")
        df_emp["Name"] = df_emp["Name"] + " " + pd.Series([e.get("last_name", "") for e in data.get("employees", [])])

        df_eq = create_df(data.get("equipment", []))
        df_mat = create_df(data.get("materials", []))
        df_vend = create_df(data.get("vendors", []))

        # Write all sheets to Excel file
        with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
            df_emp.to_excel(writer, index=False, sheet_name="Employees")
            df_eq.to_excel(writer, index=False, sheet_name="Equipment")
            df_mat.to_excel(writer, index=False, sheet_name="Materials")
            df_vend.to_excel(writer, index=False, sheet_name="Vendors")

        print(f"✅ Excel saved successfully: {file_path}")

    except Exception as e:
        print(f"❌ Excel generation failed: {e}")

    return timesheet

# -------------------------------
# DELETE a timesheet
# -------------------------------
@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    """
    Deletes a timesheet by ID.
    """
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    db.delete(timesheet)
    db.commit()
    return
from fastapi import Query

@router.get("/", response_model=List[schemas.Timesheet])
def get_all_timesheets(db: Session = Depends(get_db)):
    timesheets = db.query(models.Timesheet).all()
    result = []
    for ts in timesheets:
        ts_data = ts.__dict__.copy()
        # Attach foreman name
        foreman = db.query(User).filter(User.id == ts.foreman_id).first()
        ts_data["foreman_name"] = f"{foreman.first_name} {foreman.last_name}" if foreman else "N/A"
        # Parse JSON string if needed
        if isinstance(ts_data["data"], str):
            ts_data["data"] = json.loads(ts_data["data"])
        result.append(ts_data)
    return result