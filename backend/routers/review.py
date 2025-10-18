from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, cast, Date
from typing import List
from ..database import get_db
from .. import models, schemas
from datetime import date as date_type
from ..models import DailySubmission, Timesheet, Ticket, SubmissionStatus
router = APIRouter(prefix="/api/review", tags=["Supervisor Review"])

# @router.get("/notifications", response_model=List[schemas.Notification])
# def get_notifications_for_supervisor(db: Session = Depends(get_db)):
#     sent_timesheets_query = (
#         db.query(models.Timesheet.date, models.Timesheet.foreman_id)
#         .filter(models.Timesheet.sent == True)
#         .distinct()
#     )
#     notifications = []
#     for sent_date, foreman_id in sent_timesheets_query.all():
#         foreman = db.query(models.User).filter(models.User.id == foreman_id).first()
#         if not foreman:
#             continue

#         timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
#             models.Timesheet.foreman_id == foreman_id,
#             models.Timesheet.date == sent_date,
#             models.Timesheet.sent == True
#         ).scalar() or 0

#         # Find the first timesheet for this foreman/date and get its job_phase_id
#         timesheet = db.query(models.Timesheet).filter(
#             models.Timesheet.foreman_id == foreman_id,
#             models.Timesheet.date == sent_date,
#             models.Timesheet.sent == True
#         ).first()

#         job_code = None
#         if timesheet and timesheet.job_phase_id:
#             job_phase = db.query(models.JobPhase).filter(models.JobPhase.id == timesheet.job_phase_id).first()
#             job_code = job_phase.job_code if job_phase else None

#         ticket_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == foreman_id,
#             cast(models.Ticket.created_at, Date) == sent_date
#         ).scalar() or 0

#         notification_id = int(f"{foreman_id}{sent_date.strftime('%Y%m%d')}")
#         notifications.append(schemas.Notification(
#             id=notification_id,
#             foreman_id=foreman.id,
#             foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
#             foreman_email=foreman.email,
#             date=sent_date,
#             timesheet_count=timesheet_count,
#             ticket_count=ticket_count,
#             job_code=job_code  # <-- Add job_code here
#         ))
#     return notifications



# @router.get("/notifications", response_model=List[schemas.Notification])
# def get_notifications_for_supervisor(db: Session = Depends(get_db)):
#     # collect all dates/foremen from sent timesheets and from tickets
#     ts_data = (
#         db.query(models.Timesheet.date, models.Timesheet.foreman_id)
#         .filter(models.Timesheet.sent == True)
#         .distinct()
#     )
#     tk_data = (
#         db.query(cast(models.Ticket.created_at, Date).label("date"), models.Ticket.foreman_id)
#         .distinct()
#     )

#     combined = set()
#     for d, f in ts_data.all():
#         combined.add((d, f))
#     for d, f in tk_data.all():
#         combined.add((d, f))

#     notifications = []
#     for sent_date, foreman_id in combined:
#         foreman = db.query(models.User).filter(models.User.id == foreman_id).first()
#         if not foreman:
#             continue

#         timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
#             models.Timesheet.foreman_id == foreman_id,
#             models.Timesheet.date == sent_date,
#             models.Timesheet.sent == True
#         ).scalar() or 0

#         ticket_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == foreman_id,
#             cast(models.Ticket.created_at, Date) == sent_date
#         ).scalar() or 0

#         # derive job_code from any timesheet
#         job_code = None
#         ts = db.query(models.Timesheet).filter(
#             models.Timesheet.foreman_id == foreman_id,
#             models.Timesheet.date == sent_date,
#             models.Timesheet.sent == True
#         ).first()
#         if ts and ts.job_phase_id:
#             jp = db.query(models.JobPhase).filter(models.JobPhase.id == ts.job_phase_id).first()
#             job_code = jp.job_code if jp else None

#         notifications.append(schemas.Notification(
#             id=int(f"{foreman_id}{sent_date.strftime('%Y%m%d')}"),
#             foreman_id=foreman.id,
#             foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
#             foreman_email=foreman.email,
#             date=sent_date,
#             timesheet_count=timesheet_count,
#             ticket_count=ticket_count,
#             job_code=job_code
#         ))
#     return notifications

@router.get("/notifications", response_model=List[schemas.Notification])
def get_notifications_for_supervisor(db: Session = Depends(get_db)):
    # Only consider foremen who have submitted their data
    submissions = db.query(DailySubmission).filter(
    DailySubmission.status.in_([SubmissionStatus.PENDING_REVIEW, SubmissionStatus.APPROVED])
    ).all()

    notifications = []

    for submission in submissions:
        foreman = db.query(models.User).filter(models.User.id == submission.foreman_id).first()
        if not foreman:
            continue

        timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
            models.Timesheet.foreman_id == submission.foreman_id,
            models.Timesheet.date == submission.date,
            models.Timesheet.sent == True
        ).scalar() or 0

        ticket_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.foreman_id == submission.foreman_id,
            cast(models.Ticket.created_at, Date) == submission.date
        ).scalar() or 0

        # derive job_code from any timesheet
        job_code = None
        ts = db.query(models.Timesheet).filter(
            models.Timesheet.foreman_id == submission.foreman_id,
            models.Timesheet.date == submission.date,
            models.Timesheet.sent == True
        ).first()
        if ts and ts.job_phase_id:
            jp = db.query(models.JobPhase).filter(models.JobPhase.id == ts.job_phase_id).first()
            job_code = jp.job_code if jp else None

        notifications.append(schemas.Notification(
            id=int(f"{submission.foreman_id}{submission.date.strftime('%Y%m%d')}"),
            foreman_id=foreman.id,
            foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
            foreman_email=foreman.email,
            date=submission.date,
            timesheet_count=timesheet_count,
            ticket_count=ticket_count,
            job_code=job_code
        ))

    return notifications

@router.get("/submitted-dates", response_model=List[str])
def get_submitted_dates(db: Session = Depends(get_db)):
    """
    Returns all dates that have been submitted by any supervisor.
    """
    submitted = db.query(DailySubmission.date).filter(
    DailySubmission.status == SubmissionStatus.APPROVED  # use the correct enum member
    ).distinct().all()
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

        # ✅ Skip checking unreviewed timesheets
        unreviewed_ts_count = 0

        # ✅ Keep only ticket check
        incomplete_tk_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.foreman_id == foreman.id,
            cast(models.Ticket.created_at, Date) == target_date,
            or_(
                models.Ticket.phase_code == None,
                models.Ticket.phase_code == ''
            )
        ).scalar()

        if incomplete_tk_count > 0:
            incomplete_tickets.append(
                schemas.UnreviewedItem(foreman_name=foreman_name, count=incomplete_tk_count)
            )

    # ✅ Only check tickets now
    can_submit = not incomplete_tickets

    return schemas.ValidationResponse(
        can_submit=can_submit,
        unreviewed_timesheets=[],  # always empty now
        incomplete_tickets=incomplete_tickets
    )



# @router.get("/status-for-date", response_model=schemas.ValidationResponse)
# def get_status_for_date(date: str = Query(...), supervisor_id: int = Query(...), db: Session = Depends(get_db)):
#     target_date = date_type.fromisoformat(date)
#     foremen_query = db.query(models.User).join(models.Timesheet).filter(
#         models.Timesheet.date == target_date,
#         models.Timesheet.sent == True
#     ).distinct()
#     unreviewed_timesheets, incomplete_tickets = [], []
#     for foreman in foremen_query.all():
#         foreman_name = f"{foreman.first_name} {foreman.last_name}".strip()
#         unreviewed_ts_count = db.query(func.count(models.Timesheet.id)).filter(
#             models.Timesheet.date == target_date,
#             models.Timesheet.foreman_id == foreman.id,
#             models.Timesheet.sent == True,
#             models.Timesheet.reviewed_by_supervisor == False
#         ).scalar()
#         if unreviewed_ts_count > 0:
#             unreviewed_timesheets.append(schemas.UnreviewedItem(foreman_name=foreman_name, count=unreviewed_ts_count))

#         # Fix: cast created_at to Date
#         incomplete_tk_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == foreman.id,
#             cast(models.Ticket.created_at, Date) == target_date,
#             or_(
#                 models.Ticket.phase_code == None,
#                 models.Ticket.phase_code == ''
#             )


#         ).scalar()
#         if incomplete_tk_count > 0:
#             incomplete_tickets.append(schemas.UnreviewedItem(foreman_name=foreman_name, count=incomplete_tk_count))

#     can_submit = not unreviewed_timesheets and not incomplete_tickets
#     return schemas.ValidationResponse(
#         can_submit=can_submit,
#         unreviewed_timesheets=unreviewed_timesheets,
#         incomplete_tickets=incomplete_tickets
#     )

# @router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
# def submit_all_for_date(payload: dict, db: Session = Depends(get_db)):
#     """
#     Supervisor submits all tickets and timesheets for a given date.
#     This marks items as reviewed and creates a submission entry if not exists.
#     Submission status is global for all supervisors.
#     """
#     date_str = payload.get("date")
#     supervisor_id = payload.get("supervisor_id")  # optional, just for audit/logging
#     target_date = date_type.fromisoformat(date_str)

#     # Mark all related timesheets as reviewed
#     db.query(Timesheet).filter(
#         Timesheet.date == target_date,
#         Timesheet.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )

#     # Mark all related tickets as reviewed
#     db.query(Ticket).filter(
#         cast(Ticket.created_at, Date) == target_date,
#         Ticket.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )

#     # Create or update DailySubmission for this date (global for all supervisors)
#     existing_submission = db.query(DailySubmission).filter_by(date=target_date).first()
#     if not existing_submission:
#         new_submission = DailySubmission(
#             date=target_date,
#             foreman_id=None,  # optional, set None to indicate global submission
#             status="SUBMITTED"
#         )
#         db.add(new_submission)
#     else:
#         existing_submission.status = "SUBMITTED"

#     db.commit()

#     return {"message": "All items for the date have been submitted successfully."}


# @router.post("/submit-all-for-dates", status_code=status.HTTP_200_OK)
# def submit_all_for_all_dates(db: Session = Depends(get_db)):
#     """
#     Supervisor submits all approved tickets and timesheets for all dates present in the DB.
#     Marks them reviewed and creates/updates DailySubmissions for all foremen by date.
#     job_code is fetched from foremen's timesheets for each date.
#     """

#     # 1. Fetch all distinct dates from timesheets and tickets (where sent=True)
#     ts_dates = db.query(models.Timesheet.date.distinct()).filter(models.Timesheet.sent == True).all()
#     tk_dates = db.query(cast(models.Ticket.created_at, Date).distinct()).filter(models.Ticket.sent == True).all()

#     all_dates = set(d[0] for d in ts_dates) | set(d[0] for d in tk_dates)
#     if not all_dates:
#         raise HTTPException(status_code=400, detail="No data found for any date.")

#     for current_date in all_dates:
#         # Mark all timesheets reviewed for this date
#         db.query(models.Timesheet).filter(
#             models.Timesheet.date == current_date,
#             models.Timesheet.sent == True
#         ).update(
#             {"reviewed_by_supervisor": True, "status": "reviewed"},
#             synchronize_session=False
#         )

#         # Mark all tickets reviewed for this date
#         db.query(models.Ticket).filter(
#             cast(models.Ticket.created_at, Date) == current_date,
#             models.Ticket.sent == True
#         ).update(
#             {"reviewed_by_supervisor": True, "status": "reviewed"},
#             synchronize_session=False
#         )

#         # Get distinct foremen who sent timesheets or tickets for this date
#         timesheet_foremen = db.query(models.Timesheet.foreman_id).filter(
#             models.Timesheet.date == current_date,
#             models.Timesheet.sent == True
#         ).distinct()

#         ticket_foremen = db.query(models.Ticket.foreman_id).filter(
#             cast(models.Ticket.created_at, Date) == current_date,
#             models.Ticket.sent == True
#         ).distinct()

#         foremen_ids = set(fid for (fid,) in timesheet_foremen.union(ticket_foremen).all())
#         if not foremen_ids:
#             continue  # no foremen for this date, skip

#         for fid in foremen_ids:
#             # Get job_code from the foreman's timesheet for current_date if available
#             timesheet = db.query(models.Timesheet).filter(
#                 models.Timesheet.foreman_id == fid,
#                 models.Timesheet.date == current_date,
#                 models.Timesheet.sent == True
#             ).first()

#             job_code = None
#             if timesheet and timesheet.job_phase_id:
#                 job_phase = db.query(models.JobPhase).filter(models.JobPhase.id == timesheet.job_phase_id).first()
#                 job_code = job_phase.job_code if job_phase else None

#             submission = db.query(models.DailySubmission).filter_by(date=current_date, foreman_id=fid).first()
#             if submission:
#                 submission.status = "APPROVED"
#                 submission.job_code = job_code
#             else:
#                 new_sub = models.DailySubmission(
#                     date=current_date,
#                     foreman_id=fid,
#                     job_code=job_code,
#                     status="APPROVED"
#                 )
#                 db.add(new_sub)

#     db.commit()

#     return {"message": f"All items for dates {', '.join(str(d) for d in sorted(all_dates))} have been submitted successfully."}





# working code 16/10/2025
# @router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
# def submit_all_for_date(payload: dict, db: Session = Depends(get_db)):
#     """
#     Supervisor submits all tickets and timesheets for a given date.
#     Marks items as reviewed and creates/updates DailySubmission for all foremen who sent data.
#     """
#     date_str = payload.get("date")
#     if not date_str:
#         raise HTTPException(status_code=400, detail="Date is required")
#     target_date = date_type.fromisoformat(date_str)

#     # 1️⃣ Mark all related timesheets as reviewed
#     db.query(models.Timesheet).filter(
#         models.Timesheet.date == target_date,
#         models.Timesheet.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )

#     # 2️⃣ Mark all related tickets as reviewed
#     db.query(models.Ticket).filter(
#         cast(models.Ticket.created_at, Date) == target_date,
#         models.Ticket.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )

#     # 3️⃣ Get all foremen who sent timesheets or tickets for this date
#     timesheet_foremen = db.query(models.Timesheet.foreman_id).filter(
#         models.Timesheet.date == target_date,
#         models.Timesheet.sent == True
#     ).distinct()

#     ticket_foremen = db.query(models.Ticket.foreman_id).filter(
#         cast(models.Ticket.created_at, Date) == target_date
#     ).distinct()

#     foremen_ids = set(fid for (fid,) in timesheet_foremen.union(ticket_foremen).all())

#     if not foremen_ids:
#         raise HTTPException(status_code=400, detail="No foreman data found for this date")

#     # 4️⃣ Update or create DailySubmission for all foremen
#     for fid in foremen_ids:
#         submission = db.query(models.DailySubmission).filter_by(date=target_date, foreman_id=fid).first()
#         if submission:
#             submission.status = "APPROVED"  # ✅ Valid ENUM
#         else:
#             new_sub = models.DailySubmission(
#                 date=target_date,
#                 foreman_id=fid,
#                 status="APPROVED"
#             )
#             db.add(new_sub)

#     db.commit()

#     return {"message": f"All items for {target_date} have been submitted successfully."}



@router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
def submit_all_for_date(payload: dict, db: Session = Depends(get_db)):
    """
    Supervisor submits all tickets and timesheets for a given date.
    Marks items as reviewed and creates/updates DailySubmission for all foremen who sent data.
    """
    date_str = payload.get("date")
    if not date_str:
        raise HTTPException(status_code=400, detail="Date is required")
    target_date = date_type.fromisoformat(date_str)

    # 1️⃣ Mark all related timesheets as reviewed
    db.query(models.Timesheet).filter(
        models.Timesheet.date == target_date,
        models.Timesheet.sent == True
    ).update(
        {"reviewed_by_supervisor": True, "status": "reviewed"},
        synchronize_session=False
    )

    # 2️⃣ Mark all related tickets as reviewed
    db.query(models.Ticket).filter(
        cast(models.Ticket.created_at, Date) == target_date,
        models.Ticket.sent == True
    ).update(
        {"reviewed_by_supervisor": True, "status": "reviewed"},
        synchronize_session=False
    )

    # 3️⃣ Get all foremen who sent timesheets or tickets for this date
    timesheet_foremen = db.query(models.Timesheet.foreman_id).filter(
        models.Timesheet.date == target_date,
        models.Timesheet.sent == True
    ).distinct()

    ticket_foremen = db.query(models.Ticket.foreman_id).filter(
        cast(models.Ticket.created_at, Date) == target_date
    ).distinct()

    foremen_ids = set(fid for (fid,) in timesheet_foremen.union(ticket_foremen).all())

    if not foremen_ids:
        raise HTTPException(status_code=400, detail="No foreman data found for this date")

    # 4️⃣ Update or create DailySubmission for all foremen
    for fid in foremen_ids:
        # Get job_code from the foreman's timesheet (first found) on the date
        timesheet = db.query(models.Timesheet).filter(
            models.Timesheet.foreman_id == fid,
            models.Timesheet.date == target_date,
            models.Timesheet.sent == True
        ).first()

        job_code = None
        if timesheet and timesheet.job_phase_id:
            job_phase = db.query(models.JobPhase).filter(models.JobPhase.id == timesheet.job_phase_id).first()
            job_code = job_phase.job_code if job_phase else None

        submission = db.query(models.DailySubmission).filter_by(date=target_date, foreman_id=fid).first()
        if submission:
            submission.status = "APPROVED"  # ✅ Valid ENUM
            submission.job_code = job_code  # update job_code
        else:
            new_sub = models.DailySubmission(
                date=target_date,
                foreman_id=fid,
                job_code=job_code,  # save job_code here
                status="APPROVED"
            )
            db.add(new_sub)

    db.commit()

    return {"message": f"All items for {target_date} have been submitted successfully."}