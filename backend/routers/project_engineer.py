from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, exists
from .. import models, database
from datetime import date

router = APIRouter(prefix="/api/project-engineer", tags=["Project Engineer"])

@router.get("/dashboard")
def get_project_engineer_dashboard(project_engineer_id: int, db: Session = Depends(database.get_db)):
    print(f"🧩 project_engineer_id = {project_engineer_id}")

    try:
        # ✅ Only get timesheets from job phases under this PE
        # AND where supervisor has submitted for that same date
        timesheets = (
            db.query(models.Timesheet)
            .join(models.JobPhase, models.Timesheet.job_phase_id == models.JobPhase.id)
            .filter(
                models.JobPhase.project_engineer_id == project_engineer_id,
                models.Timesheet.status == "SUBMITTED",
                db.query(models.SupervisorSubmission)
                .filter(
                    models.SupervisorSubmission.date == models.Timesheet.date,
                    models.SupervisorSubmission.status == "SubmittedToEngineer"
                )
                .exists()
            )
            .all()
        )

        print(f"✅ Timesheets fetched: {len(timesheets)}")

# ✅ Corrected ticket query in /project-engineer/dashboard
        tickets = (
            db.query(models.Ticket)
            .join(models.Timesheet, models.Ticket.timesheet_id == models.Timesheet.id)
            .join(models.JobPhase, models.Ticket.job_phase_id == models.JobPhase.id)
            .filter(models.JobPhase.project_engineer_id == project_engineer_id)
            .filter(models.Timesheet.status == "SUBMITTED")
            .all()
            )

        print(f"✅ Tickets fetched: {len(tickets)}")

        return {
            "timesheets": timesheets,
            "tickets": tickets,
        }

    except Exception as e:
        print(f"🔥 ERROR in /dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/pe/timesheets")
def get_timesheet_for_pe_review(
    foreman_id: int,
    date: date,
    db: Session = Depends(database.get_db)
):
    timesheet = db.query(models.Timesheet).filter(
        models.Timesheet.foreman_id == foreman_id,
        models.Timesheet.date == date
    ).first()

    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    return timesheet
