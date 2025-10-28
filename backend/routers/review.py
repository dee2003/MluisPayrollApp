# from fastapi import APIRouter, Depends, HTTPException, Query, status
# from sqlalchemy.orm import Session
# from sqlalchemy import func, and_, or_, cast, Date
# from typing import List
# from ..database import get_db
# from .. import models, schemas
# from datetime import date as date_type
# from ..models import DailySubmission, Timesheet, Ticket, SubmissionStatus
# router = APIRouter(prefix="/api/review", tags=["Supervisor Review"])



# @router.get("/notifications", response_model=List[schemas.Notification])
# def get_notifications_for_supervisor(db: Session = Depends(get_db)):
#     # Only consider foremen who have submitted their data
#     submissions = db.query(DailySubmission).filter(
#         DailySubmission.status.in_([SubmissionStatus.PENDING_REVIEW, SubmissionStatus.APPROVED])
#     ).all()

#     notifications = []

#     for submission in submissions:
#         foreman = db.query(models.User).filter(models.User.id == submission.foreman_id).first()
#         if not foreman:
#             continue

#         # ✅ Only count SENT (submitted) timesheets
#         timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
#             models.Timesheet.foreman_id == submission.foreman_id,
#             models.Timesheet.date == submission.date,
#             models.Timesheet.sent == True
#         ).scalar() or 0

#         # ✅ FIX: Only count SENT (submitted) tickets
#         ticket_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == submission.foreman_id,
#             cast(models.Ticket.created_at, Date) == submission.date,
#             models.Ticket.sent == True
#         ).scalar() or 0

#         # derive job_code from any timesheet
#         job_code = None
#         ts = db.query(models.Timesheet).filter(
#             models.Timesheet.foreman_id == submission.foreman_id,
#             models.Timesheet.date == submission.date,
#             models.Timesheet.sent == True
#         ).first()
#         if ts and ts.job_phase_id:
#             jp = db.query(models.JobPhase).filter(models.JobPhase.id == ts.job_phase_id).first()
#             job_code = jp.job_code if jp else None

#         notifications.append(schemas.Notification(
#             id=int(f"{submission.foreman_id}{submission.date.strftime('%Y%m%d')}"),
#             foreman_id=foreman.id,
#             foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
#             foreman_email=foreman.email,
#             date=submission.date,
#             timesheet_count=timesheet_count,
#             ticket_count=ticket_count,  # ✅ now accurate
#             job_code=job_code
#         ))

#     return notifications

# @router.get("/submitted-dates", response_model=List[str])
# def get_submitted_dates(db: Session = Depends(get_db)):
#     """
#     Returns all dates that have been submitted by any supervisor.
#     """
#     submitted = db.query(DailySubmission.date).filter(
#     DailySubmission.status == SubmissionStatus.APPROVED  # use the correct enum member
#     ).distinct().all()
#     return [s.date.isoformat() for s in submitted]

# @router.get("/status-for-date", response_model=schemas.ValidationResponse)
# def get_status_for_date(
#     date: str = Query(...),
#     supervisor_id: int = Query(...),
#     db: Session = Depends(get_db)
# ):
#     target_date = date_type.fromisoformat(date)

#     # Only include foremen who submitted timesheets (as before)
#     foremen_query = db.query(models.User).join(models.Timesheet).filter(
#         models.Timesheet.date == target_date,
#         models.Timesheet.sent == True
#     ).distinct()

#     incomplete_tickets = []

#     for foreman in foremen_query.all():
#         foreman_name = f"{foreman.first_name} {foreman.last_name}".strip()

#         # ✅ Only check submitted tickets with missing phase_code
#         incomplete_tk_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == foreman.id,
#             cast(models.Ticket.created_at, Date) == target_date,
#             models.Ticket.sent == True,  # ✅ Ignore unsubmitted tickets
#             or_(
#                 models.Ticket.phase_code == None,
#                 models.Ticket.phase_code == ''
#             )
#         ).scalar()

#         if incomplete_tk_count > 0:
#             incomplete_tickets.append(
#                 schemas.UnreviewedItem(foreman_name=foreman_name, count=incomplete_tk_count)
#             )

#     # ✅ Only block submission if submitted tickets are incomplete
#     can_submit = not incomplete_tickets

#     return schemas.ValidationResponse(
#         can_submit=can_submit,
#         unreviewed_timesheets=[],
#         incomplete_tickets=incomplete_tickets
#     )







# from pydantic import BaseModel
# class SubmitDatePayload(BaseModel):
#     date: str
#     supervisor_id: int
# @router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
# def submit_all_for_date(payload: SubmitDatePayload, db: Session = Depends(get_db)):
#     """
#     Supervisor submits all tickets and timesheets for a given date.
#     Marks items as reviewed and creates/updates DailySubmission for all foremen who sent data.
#     """
#     date_str = payload.date           # <-- use attribute, not .get()
#     supervisor_id = payload.supervisor_id   # <-- use attribute, not .get()
#     if not date_str or not supervisor_id:
#         raise HTTPException(status_code=400, detail="Date and supervisor_id are required")
#     target_date = date_type.fromisoformat(date_str)
#     # :one: Mark all related timesheets as reviewed
#     db.query(models.Timesheet).filter(
#         models.Timesheet.date == target_date,
#         models.Timesheet.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )
#     # :two: Mark all related tickets as reviewed
#     db.query(models.Ticket).filter(
#         cast(models.Ticket.created_at, Date) == target_date,
#         models.Ticket.sent == True
#     ).update(
#         {"reviewed_by_supervisor": True, "status": "reviewed"},
#         synchronize_session=False
#     )
#     # :three: Get all foremen who sent timesheets or tickets for this date
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
#     # :four: Update or create DailySubmission for all foremen
#     for fid in foremen_ids:
#         timesheet = db.query(models.Timesheet).filter(
#             models.Timesheet.foreman_id == fid,
#             models.Timesheet.date == target_date,
#             models.Timesheet.sent == True
#         ).first()
#         job_code = None
#         if timesheet and timesheet.job_phase_id:
#             job_phase = db.query(models.JobPhase).filter(models.JobPhase.id == timesheet.job_phase_id).first()
#             job_code = job_phase.job_code if job_phase else None
#         submission = db.query(models.DailySubmission).filter_by(date=target_date, foreman_id=fid).first()
#         if submission:
#             submission.status = "APPROVED"
#             submission.job_code = job_code
#             submission.supervisor_id = supervisor_id   # <-- works now
#         else:
#             new_sub = models.DailySubmission(
#                 date=target_date,
#                 foreman_id=fid,
#                 job_code=job_code,
#                 status="APPROVED",
#                 supervisor_id=supervisor_id            # <-- works now
#             )
#             db.add(new_sub)
#     db.commit()
#     return {"message": f"All items for {target_date} have been submitted successfully."}
# @router.get("/pe/dashboard", status_code=200)
# def get_pe_dashboard(db: Session = Depends(get_db)):
#     """
#     Returns all daily submissions that have been 'APPROVED' by the Supervisor
#     and are now pending final review by the Project Engineer.
#     """
#     submissions = (
#         db.query(models.DailySubmission)
#         # Assuming APPROVED means supervisor has reviewed and it's ready for PE
#         .filter(models.DailySubmission.status == "APPROVED")
#         .order_by(models.DailySubmission.date.desc())
#         .all()
#     )
#     result = []
#     for sub in submissions:
#         # 1. Fetch Supervisor's Name
#         supervisor = (
#             db.query(models.User)
#             .filter(models.User.id == sub.supervisor_id)
#             .first()
#         )
#         supervisor_name = f"{supervisor.first_name} {supervisor.last_name}" if supervisor else "Unknown Supervisor"
#         # :sparkles: 2. Fetch Foreman's Name (REQUIRED by frontend ItemType)
#         foreman = (
#             db.query(models.User)
#             .filter(models.User.id == sub.foreman_id)
#             .first()
#         )
#         foreman_name = f"{foreman.first_name} {foreman.last_name}" if foreman else "Unknown Foreman"
#         # 3. Get Timesheet Counts (No change needed here)
#         timesheets = (
#             db.query(models.Timesheet)
#             .filter(
#                 models.Timesheet.foreman_id == sub.foreman_id,
#                 models.Timesheet.date == sub.date,
#                 models.Timesheet.reviewed_by_supervisor == True
#             )
#             .all()
#         )
#         # 4. Get Ticket Counts (No change needed here)
#         tickets = (
#             db.query(models.Ticket)
#             .filter(
#                 cast(models.Ticket.created_at, Date) == sub.date,
#                 models.Ticket.foreman_id == sub.foreman_id,
#                 models.Ticket.reviewed_by_supervisor == True
#             )
#             .all()
#         )
#         # 5. Build Result Dictionary - Ensure all keys match frontend ItemType
#         result.append({
#             "date": sub.date.strftime("%Y-%m-%d"), # Ensure date is a string format expected by JS
#             "foreman_id": sub.foreman_id,
#             "foreman_name": supervisor_name,       # :sparkles: Add Foreman Name
#             "supervisor_name": supervisor_name, # Use Supervisor Name
#             "job_code": sub.job_code,
#             "timesheet_count": len(timesheets),
#             "ticket_count": len(tickets),
#         })
#     return result

# @router.get("/pe/timesheets")
# def get_pe_timesheets(foreman_id: int, date: str, db: Session = Depends(get_db)):
#     target_date = date_type.fromisoformat(date)
#     timesheets = (
#         db.query(models.Timesheet)
#         .filter(models.Timesheet.foreman_id == foreman_id, models.Timesheet.date == target_date)
#         .all()
#     )
#     return [
#         {
#             "id": t.id,
#             "job_code": t.job_phase.job_code if t.job_phase else None,
#             # "hours_worked": t.hours,
#             "submitted_at": t.sent_date.isoformat() if t.sent_date else None,
#             "timesheet_name": t.timesheet_name,
#         }
#         for t in timesheets
#     ]
# # ---------------- PE Tickets ----------------
# @router.get("/pe/tickets")
# def get_pe_tickets(foreman_id: int, date: str, db: Session = Depends(get_db)):
#     target_date = date_type.fromisoformat(date)

#     tickets = (
#         db.query(models.Ticket)
#         .filter(
#             models.Ticket.foreman_id == foreman_id,
#             cast(models.Ticket.created_at, Date) == target_date,
#             models.Ticket.sent == True  # ✅ Only include submitted tickets
#         )
#         .all()
#     )

#     return [
#         {
#             "id": t.id,
#             "phase_code": t.job_phase.job_code if t.job_phase else t.phase_code,
#             "image_path": t.image_path,
#         }
#         for t in tickets
#     ]






from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, or_
from typing import List
from ..database import get_db
from .. import models, schemas
from datetime import date as date_type

router = APIRouter(prefix="/api/review", tags=["Supervisor Review"])

# ---------------- Notifications ----------------
@router.get("/notifications", response_model=List[schemas.Notification])
def get_notifications_for_supervisor(db: Session = Depends(get_db)):
    """
    Show all foremen who have submitted Timesheets or Tickets.
    """
    # Get all foremen with submitted Timesheets
    submitted_timesheets = db.query(models.Timesheet.foreman_id, models.Timesheet.date).filter(
        models.Timesheet.sent == True
    ).distinct().all()

    notifications = []
    for foreman_id, ts_date in submitted_timesheets:
        foreman = db.query(models.User).filter(models.User.id == foreman_id).first()
        if not foreman:
            continue

        timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
            models.Timesheet.foreman_id == foreman_id,
            models.Timesheet.date == ts_date,
            models.Timesheet.sent == True
        ).scalar() or 0

        ticket_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.foreman_id == foreman_id,
            cast(models.Ticket.created_at, Date) == ts_date,
            models.Ticket.sent == True
        ).scalar() or 0

        notifications.append(
            schemas.Notification(
                id=int(f"{foreman_id}{ts_date.strftime('%Y%m%d')}"),
                foreman_id=foreman.id,
                foreman_name=f"{foreman.first_name} {foreman.last_name}".strip(),
                foreman_email=foreman.email,
                date=ts_date,
                timesheet_count=timesheet_count,
                ticket_count=ticket_count,
                job_code=None  # Optional: derive from any Timesheet.job_phase.job_code
            )
        )
    return notifications

# ---------------- Submit all for date ----------------
from pydantic import BaseModel
class SubmitDatePayload(BaseModel):
    date: str
    supervisor_id: int

@router.post("/submit-all-for-date", status_code=status.HTTP_200_OK)
def submit_all_for_date(payload: SubmitDatePayload, db: Session = Depends(get_db)):
    target_date = date_type.fromisoformat(payload.date)

    # Mark Timesheets as reviewed
    db.query(models.Timesheet).filter(
        models.Timesheet.date == target_date,
        models.Timesheet.sent == True
    ).update({"reviewed_by_supervisor": True}, synchronize_session=False)

    # Mark Tickets as reviewed
    db.query(models.Ticket).filter(
        cast(models.Ticket.created_at, Date) == target_date,
        models.Ticket.sent == True
    ).update({"reviewed_by_supervisor": True}, synchronize_session=False)

    db.commit()
    return {"message": f"All Timesheets and Tickets for {target_date} marked as reviewed by supervisor."}
