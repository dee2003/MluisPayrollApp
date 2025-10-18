# # backend/routers/project_engineer.py
# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import cast, Date, func
# from typing import List
# from datetime import date as date_type

# from .. import models, schemas
# from ..database import get_db

# router = APIRouter(
#     prefix="/api/project-engineer",
#     tags=["ProjectEngineer"]
# )

# # Response schema for PE dashboard
# class SupervisorSubmissionSummary(schemas.BaseModel):
#     supervisor_id: int
#     supervisor_name: str
#     timesheet_count: int
#     ticket_count: int

# class SubmissionByDate(schemas.BaseModel):
#     date: str
#     submissions: List[SupervisorSubmissionSummary]

# @router.get("/submissions", response_model=List[SubmissionByDate])
# def get_submissions_for_pe(
#     db: Session = Depends(get_db),
# ):
#     """
#     Returns all submitted data grouped by date.
#     Each date contains a list of supervisors who submitted data and counts of tickets/timesheets.
#     Only approved submissions are considered.
#     """
#     submissions = db.query(models.DailySubmission).filter(
#         models.DailySubmission.status == "APPROVED"
#     ).order_by(models.DailySubmission.date.desc()).all()

#     result = {}
#     for sub in submissions:
#         # Skip if no foreman_id (global submission)
#         if not sub.foreman_id:
#             continue

#         supervisor = db.query(models.User).filter(models.User.id == sub.foreman_id).first()
#         if not supervisor:
#             continue

#         # Count timesheets
#         timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
#             models.Timesheet.foreman_id == sub.foreman_id,
#             models.Timesheet.date == sub.date,
#             models.Timesheet.sent == True
#         ).scalar() or 0

#         # Count tickets
#         ticket_count = db.query(func.count(models.Ticket.id)).filter(
#             models.Ticket.foreman_id == sub.foreman_id,
#             cast(models.Ticket.created_at, Date) == sub.date
#         ).scalar() or 0

#         summary = SupervisorSubmissionSummary(
#             supervisor_id=supervisor.id,
#             supervisor_name=f"{supervisor.first_name} {supervisor.last_name}".strip(),
#             timesheet_count=timesheet_count,
#             ticket_count=ticket_count
#         )

#         date_str = sub.date.isoformat()
#         if date_str not in result:
#             result[date_str] = []

#         result[date_str].append(summary)

#     # Convert to list
#     return [SubmissionByDate(date=k, submissions=v) for k, v in result.items()]


# # from fastapi import Depends, APIRouter, HTTPException, Query
# # from sqlalchemy.orm import Session
# # from sqlalchemy import Date, cast, func
# # from datetime import date as date_type
# # from .. import models, schemas
# # from ..database import get_db
# # # from app.database import get_db
# # # from app.dependencies import get_current_user  # assuming you have this
# # from typing import Optional
# # from .. dependencies import get_current_user
# # # from .. import JobPhase, DailySubmission, Timesheet, Ticket, User
# # from ..models import DailySubmission, Timesheet, Ticket, SubmissionStatus, JobPhase, User
# # router = APIRouter(prefix="/api/project-engineer", tags=["Project Engineer"])

# # def get_current_user(db: Session = Depends(get_db)):
# #     # simulate a logged-in project engineer
# #     user = db.query(models.User).filter(models.User.role == "Project Engineer").first()
# #     return user

# # @router.get("/submissions", response_model=schemas.SubmissionDataResponse)

# # from datetime import date as date_type
# # from typing import List, Dict, Any

# # # adjust these relative imports to match your package layout


# # @router.get("/submissions", response_model=List[schemas.PENotification])
# # def get_notifications_for_pe(
# #     db: Session = Depends(get_db),
# #     pe_name: str = Query(..., description="Project Engineer username")
# # ):
# #     """
# #     Returns all supervisor submissions for a PE's assigned job codes.
# #     Includes job code, supervisor name, timesheet count, ticket count, and date.
# #     """

# #     # 1️⃣ Get job codes under this PE
# #     job_codes = db.query(models.JobPhase.job_code).filter(models.JobPhase.project_engineer == pe_name).all()
# #     job_code_list = [jc[0] for jc in job_codes]
# #     if not job_code_list:
# #         raise HTTPException(status_code=404, detail="No job codes found for this Project Engineer")

# #     # 2️⃣ Get all DailySubmissions for these job codes
# #     submissions = db.query(models.DailySubmission).filter(
# #         models.DailySubmission.job_code.in_(job_code_list)
# #     ).all()

# #     notifications = []

# #     for sub in submissions:
# #         supervisor = db.query(models.User).filter(models.User.id == sub.supervisor_id).first()
# #         if not supervisor:
# #             continue

# #         # Count timesheets for this submission
# #         timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
# #             models.Timesheet.submission_id == sub.id
# #         ).scalar() or 0

# #         # Count tickets for this submission
# #         ticket_count = db.query(func.count(models.Ticket.id)).filter(
# #             models.Ticket.submission_id == sub.id
# #         ).scalar() or 0

# #         notifications.append(schemas.PENotification(
# #             id=int(f"{sub.supervisor_id}{sub.date.strftime('%Y%m%d')}"),
# #             supervisor_id=sub.supervisor_id,
# #             supervisor_name=f"{supervisor.first_name} {supervisor.last_name}".strip(),
# #             date=sub.date,
# #             job_code=sub.job_code,
# #             timesheet_count=timesheet_count,
# #             ticket_count=ticket_count
# #         ))

# #     return notifications



















from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date as date_type

from .. import models, schemas
from .. database import get_db

router = APIRouter(prefix="/api/project-engineer", tags=["Project Engineer"])

@router.get("/submissions", response_model=List[schemas.PENotification])
def get_pe_submissions(db: Session = Depends(get_db)):
    """
    Returns all supervisor submissions (date wise) with counts for timesheets and tickets.
    """

    submissions = db.query(models.DailySubmission).all()

    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions found")

    notifications = []
    for sub in submissions:
        supervisor = db.query(models.User).filter(models.User.id == sub.supervisor_id).first()
        if not supervisor:
            continue

        timesheet_count = db.query(func.count(models.Timesheet.id)).filter(
            models.Timesheet.submission_id == sub.id
        ).scalar() or 0

        ticket_count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.submission_id == sub.id
        ).scalar() or 0

        notifications.append(schemas.PENotification(
            id=int(f"{sub.supervisor_id}{sub.date.strftime('%Y%m%d')}"),
            supervisor_id=sub.supervisor_id,
            supervisor_name=f"{supervisor.first_name} {supervisor.last_name}".strip(),
            date=sub.date,
            job_code=sub.job_code,
            timesheet_count=timesheet_count,
            ticket_count=ticket_count
        ))

    return notifications
