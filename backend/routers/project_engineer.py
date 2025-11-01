from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exists, func
from datetime import date
from .. import models, database

router = APIRouter(prefix="/api/project-engineer", tags=["Project Engineer"])

@router.get("/dashboard")
def get_project_engineer_dashboard(project_engineer_id: int, db: Session = Depends(database.get_db)):
    print(f"🧩 project_engineer_id = {project_engineer_id}")

    try:
        # ✅ Timesheets: include foreman full name and job code
        timesheets = (
            db.query(
                models.Timesheet.id,
                models.Timesheet.date,
                models.Timesheet.foreman_id,
                func.concat_ws(
                    ' ',
                    models.User.first_name,
                    models.User.middle_name,
                    models.User.last_name
                ).label("foreman_name"),
                models.JobPhase.job_code,
                models.Timesheet.status,
            )
            .join(models.JobPhase, models.Timesheet.job_phase_id == models.JobPhase.id)
            .join(models.User, models.Timesheet.foreman_id == models.User.id)
            .filter(
                models.JobPhase.project_engineer_id == project_engineer_id,
                models.Timesheet.status == "SUBMITTED",
                exists().where(
                    (models.SupervisorSubmission.date == models.Timesheet.date)
                    & (models.SupervisorSubmission.status == "SubmittedToEngineer")
                ),
            )
            .all()
        )

        print(f"✅ Timesheets fetched: {len(timesheets)}")

        # ✅ Tickets: include foreman full name, job code, and proper date
        tickets = (
            db.query(
                models.Ticket.id,
                models.Ticket.foreman_id,
                func.concat_ws(
                    ' ',
                    models.User.first_name,
                    models.User.middle_name,
                    models.User.last_name
                ).label("foreman_name"),
                models.JobPhase.job_code,
                models.Ticket.image_path,
                models.Ticket.status,
                models.Timesheet.date.label("ts_date"),
                models.Ticket.created_at,
            )
            .join(models.JobPhase, models.Ticket.job_phase_id == models.JobPhase.id)
            .join(models.User, models.Ticket.foreman_id == models.User.id)
            .outerjoin(models.Timesheet, models.Ticket.timesheet_id == models.Timesheet.id)
            .filter(models.JobPhase.project_engineer_id == project_engineer_id)
            .filter(models.Timesheet.status == "SUBMITTED")
            .all()
        )

        # ✅ Format tickets properly
        tickets_data = []
        for tk in tickets:
            ticket_date = tk.ts_date or (tk.created_at.date() if tk.created_at else None)
            tickets_data.append({
                "id": tk.id,
                "foreman_id": tk.foreman_id,
                "foreman_name": tk.foreman_name.strip() if tk.foreman_name else "",
                "job_code": tk.job_code,
                "image_path": tk.image_path,
                "status": tk.status,
                "date": str(ticket_date) if ticket_date else "Invalid Date",
            })

        # ✅ Format timesheets properly
        timesheet_data = [
            {
                "id": ts.id,
                "date": str(ts.date),
                "foreman_id": ts.foreman_id,
                "foreman_name": ts.foreman_name.strip() if ts.foreman_name else "",
                "job_code": ts.job_code,
                "status": ts.status,
            }
            for ts in timesheets
        ]

        print(f"✅ Tickets fetched: {len(tickets_data)}")

        return {
            "timesheets": timesheet_data,
            "tickets": tickets_data,
        }

    except Exception as e:
        print(f"🔥 ERROR in /dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pe/timesheets")
def get_timesheet_for_pe_review(
    foreman_id: int,
    date: date,
    db: Session = Depends(database.get_db),
):
    timesheet = (
        db.query(models.Timesheet)
        .filter(
            models.Timesheet.foreman_id == foreman_id,
            models.Timesheet.date == date,
        )
        .first()
    )

    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    return timesheet
