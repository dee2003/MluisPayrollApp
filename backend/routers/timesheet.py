# /app/routes/timesheets.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

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
    Creates a new timesheet record.
    """
    db_timesheet = models.Timesheet(**timesheet.dict())
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
    """
    Returns a single timesheet by its ID.
    Raises 404 if not found.
    """
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return timesheet

# -------------------------------
# UPDATE a timesheet
# -------------------------------
@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
    """
    Updates a timesheet.
    Only updates fields provided in the request.
    """
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    update_data = timesheet_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(timesheet, key, value)

    db.commit()
    db.refresh(timesheet)
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
