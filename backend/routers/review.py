from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, cast, Date
from typing import List
from ..database import get_db
from .. import models, schemas
from datetime import date as date_type

router = APIRouter(prefix="/api/review", tags=["Supervisor Review"])

@router.get("/notifications", response_model=List[schemas.Notification])
def get_notifications_for_supervisor(db: Session = Depends(get_db)):
    sent_timesheets_query = (
        db.query(models.Timesheet.date, models.Timesheet.foreman_id)
        .filter(models.Timesheet.sent == True)
        .distinct()
    )
    
    notifications = []
    
    for sent_date, foreman_id in sent_timesheets_query.all():
        foreman = db.query(models.User).filter(models.User.id == foreman_id).first()
        if not foreman: 
            continue

        timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
            models.Timesheet.foreman_id == foreman_id,
            models.Timesheet.date == sent_date,
            models.Timesheet.sent == True
        ).scalar() or 0

        # Fix: use created_at cast to Date
        ticket_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.foreman_id == foreman_id,
            cast(models.Ticket.created_at, Date) == sent_date
        ).scalar() or 0

        notification_id = int(f"{foreman_id}{sent_date.strftime('%Y%m%d')}")

        notifications.append(schemas.Notification(
            id=notification_id,
            foreman_id=foreman.id,
            foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
            foreman_email=foreman.email,
            date=sent_date,
            timesheet_count=timesheet_count,
            ticket_count=ticket_count
        ))
        
    return notifications

@router.get("/submitted-dates", response_model=List[str])
def get_submitted_dates(db: Session = Depends(get_db)):
    submitted = db.query(models.DailySubmission.date).distinct().all()
    return [s.date.isoformat() for s in submitted]

@router.get("/status-for-date", response_model=schemas.ValidationResponse)
def get_status_for_date(date: str = Query(...), supervisor_id: int = Query(...), db: Session = Depends(get_db)):
    target_date = date_type.fromisoformat(date)
    foremen_query = db.query(models.User).join(models.Timesheet).filter(
        models.Timesheet.date == target_date,
        models.Timesheet.sent == True
    ).distinct()

    unreviewed_timesheets, incomplete_tickets = [], []

    for foreman in foremen_query.all():
        foreman_name = f"{foreman.first_name} {foreman.last_name}".strip()
        
        unreviewed_ts_count = db.query(func.count(models.Timesheet.id)).filter(
            models.Timesheet.date == target_date,
            models.Timesheet.foreman_id == foreman.id,
            models.Timesheet.sent == True,
            models.Timesheet.reviewed_by_supervisor == False
        ).scalar()
        if unreviewed_ts_count > 0:
            unreviewed_timesheets.append(schemas.UnreviewedItem(foreman_name=foreman_name, count=unreviewed_ts_count))

        # Fix: cast created_at to Date
        incomplete_tk_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.foreman_id == foreman.id,
            cast(models.Ticket.created_at, Date) == target_date,
            or_(models.Ticket.job_code == None, models.Ticket.job_code == '',
                models.Ticket.phase_code == None, models.Ticket.phase_code == '')
        ).scalar()
        if incomplete_tk_count > 0:
            incomplete_tickets.append(schemas.UnreviewedItem(foreman_name=foreman_name, count=incomplete_tk_count))

    can_submit = not unreviewed_timesheets and not incomplete_tickets
    return schemas.ValidationResponse(
        can_submit=can_submit,
        unreviewed_timesheets=unreviewed_timesheets,
        incomplete_tickets=incomplete_tickets
    )

@router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
def submit_all_for_date(payload: dict, db: Session = Depends(get_db)):
    supervisor_id = payload.get("supervisor_id")
    date_str = payload.get("date")
    target_date = date_type.fromisoformat(date_str)

    db.query(models.Timesheet).filter(
        models.Timesheet.date == target_date,
        models.Timesheet.sent == True
    ).update({"status": "reviewed", "reviewed_by_supervisor": True}, synchronize_session=False)

    existing_submission = db.query(models.DailySubmission).filter_by(date=target_date, foreman_id=supervisor_id).first()
    if not existing_submission:
        new_submission = models.DailySubmission(date=target_date, foreman_id=supervisor_id, status='PENDING_REVIEW')
        db.add(new_submission)

    db.commit()
    return {"message": "All items for the date have been submitted successfully."}
