

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List,Optional
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
        job_phase_id=timesheet.job_phase_id,
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
from datetime import date as date_type
from sqlalchemy import cast, Date
@router.get("/for-supervisor", response_model=List[schemas.Timesheet])
def get_timesheets_for_supervisor(
    db: Session = Depends(get_db),
    foreman_id: Optional[int] = Query(None),
    date: Optional[str] = Query(None)
):
    """
    Returns all sent timesheets for supervisors.
    Filters by work performed date (`timesheet.date`) and optionally by foreman.
    Supports multiple timesheets per work date.
    """
    query = db.query(models.Timesheet).options(joinedload(models.Timesheet.files)).filter(models.Timesheet.sent == True)
    if foreman_id is not None:
        query = query.filter(models.Timesheet.foreman_id == foreman_id)
    if date:
        try:
            target_date = date_type.fromisoformat(date)
            query = query.filter(cast(models.Timesheet.date, Date) == target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    timesheets = query.order_by(models.Timesheet.sent_date.desc()).all()  # optional: latest sent first
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
    NGROK_BASE_URL = "https://coated-nonattributive-babara.ngrok-free.dev"

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
from datetime import datetime

@router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    ts.sent = True
    ts.sent_date = datetime.utcnow()  # mark the foreman send time
    ts.status = "sent"

    # Add workflow entry
    workflow = models.TimesheetWorkflow(
        timesheet_id=ts.id,
        foreman_id=ts.foreman_id,
        supervisor_id=None,
        action="sent",
        timestamp=datetime.utcnow()
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
# In your routers/timesheet.py

@router.get("/", response_model=List[schemas.TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db)):
    """
    Returns a list of all timesheets with foreman names and job names included.
    This is optimized for the admin dashboard view.
    """
    timesheets = db.query(models.Timesheet).options(joinedload(models.Timesheet.foreman)).all()
    
    response = []
    for ts in timesheets:
        foreman_name = f"{ts.foreman.first_name} {ts.foreman.last_name}" if ts.foreman else "N/A"
        
        # Create the response object, ensuring all required fields are present
        response.append(schemas.TimesheetResponse(
            id=ts.id,
            date=ts.date,
            foreman_id=ts.foreman_id,
            foreman_name=foreman_name,
            job_name=ts.timesheet_name,  # <-- The FIX: Populate the required 'job_name' field
            data=ts.data,
            sent=ts.sent,
            status=ts.status
        ))
        
    return response
