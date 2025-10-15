from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..database import get_db
from ..models import DailySubmission, Ticket, User, Timesheet

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

class SubmissionPayload(BaseModel):
    date: str
    foreman_id: int
    ticket_ids: List[int]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_submission(payload: SubmissionPayload, db: Session = Depends(get_db)):
    # Validate foreman
    foreman = db.query(User).filter(User.id == payload.foreman_id).first()
    if not foreman:
        raise HTTPException(status_code=404, detail="Foreman not found")

    # Check if submission exists for this date + foreman
    submission = db.query(DailySubmission).filter_by(
        foreman_id=payload.foreman_id,
        date=payload.date
    ).first()

    if submission is None:
        submission = DailySubmission(
            foreman_id=payload.foreman_id,
            date=payload.date,
            ticket_count=len(payload.ticket_ids),
            status="PENDING_REVIEW"
        )
        db.add(submission)
    else:
        submission.ticket_count = len(payload.ticket_ids)

    db.commit()
    db.refresh(submission)

    # Mark all related timesheets as submitted (sent=True)
    db.query(Timesheet).filter(
        Timesheet.foreman_id == payload.foreman_id,
        Timesheet.date == payload.date
    ).update(
        {"sent": True, "submission_id": submission.id, "status": "submitted"},
        synchronize_session=False
    )

    db.commit()

    return {"message": "Submission created successfully", "submission_id": submission.id}