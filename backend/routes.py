from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import crud, schemas
from .database import get_db
# from .crud import get_timesheets
# from .schemas import TimesheetResponse
# from typing import List
router = APIRouter(prefix="/api/timesheets", tags=["Timesheets"])
@router.post("/", response_model=schemas.TimesheetResponse)
def create_timesheet(ts: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    # Save timesheet
    db_ts = crud.create_timesheet(db, ts)
    # TODO: send to foreman app (via WebSocket / API call)
    # Example: push_timesheet_to_foreman(foreman_id=db_ts.foreman_id, data=db_ts.data)
    return {
        "id": db_ts.id,
        "job_name": db_ts.timesheet_name,
        "date": db_ts.date,
        "foreman_id": db_ts.foreman_id,
        "foreman_name": db_ts.foreman.first_name + " " + db_ts.foreman.last_name,
        "data": db_ts.data,
        "sent": db_ts.sent
    }
@router.get("/", response_model=list[schemas.TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db)):
    return crud.get_timesheets(db)