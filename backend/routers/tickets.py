from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from datetime import date as date_type
from collections import defaultdict
from typing import List

from .. import models, schemas, database

router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)


# ==========================================================
# 🔹 1️⃣ Foreman View: All Tickets (Submitted + Unsubmitted)
# ==========================================================
@router.get("/images-by-date/{foreman_id}")
def list_images_by_date(foreman_id: int, db: Session = Depends(database.get_db)):
    """
    Returns all tickets grouped by date for the foreman (including unsubmitted ones).
    """
    all_tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.foreman_id == foreman_id)
        .all()
    )

    all_submissions = (
        db.query(models.DailySubmission)
        .filter(models.DailySubmission.foreman_id == foreman_id)
        .all()
    )

    # Collect all submitted ticket IDs from related timesheets
    submitted_ticket_ids = set()
    for sub in all_submissions:
        if sub.timesheets:
            for ts in sub.timesheets:
                if ts.ticket_id:
                    submitted_ticket_ids.add(ts.ticket_id)

    grouped_tickets = defaultdict(list)
    for t in all_tickets:
        date_str = t.created_at.strftime("%Y-%m-%d")
        grouped_tickets[date_str].append({
            "id": t.id,
            "image_url": t.image_path,
            "submitted": t.id in submitted_ticket_ids
        })

    images_by_date = []
    for date, imgs in grouped_tickets.items():
        submission_for_date = next(
            (s for s in all_submissions if s.date.strftime("%Y-%m-%d") == date),
            None
        )
        images_by_date.append({
            "date": date,
            "images": imgs,
            "status": submission_for_date.status if submission_for_date else None,
            "submission_id": submission_for_date.id if submission_for_date else None,
            "ticket_count": len(imgs),
        })

    return {"imagesByDate": images_by_date}



# ==========================================================
# 🔹 2️⃣ Supervisor View: Only Submitted Tickets
# ==========================================================
@router.get("/for-supervisor", response_model=List[schemas.TicketSummary])
def get_tickets_for_supervisor(
    db: Session = Depends(database.get_db),
    foreman_id: int = Query(..., description="Foreman user ID"),
    date: str = Query(..., description="Date to filter tickets (YYYY-MM-DD)")
):
    """
    Supervisors should ONLY see tickets that are already submitted (sent=True).
    """
    try:
        target_date = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    tickets = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.foreman_id == foreman_id,
            cast(models.Ticket.created_at, Date) == target_date,
            models.Ticket.sent == True  # 👈 Only submitted tickets
        )
        .all()
    )

    return [schemas.TicketSummary.from_orm(t) for t in tickets]



# ==========================================================
# 🔹 3️⃣ Project Engineer View: Approved Tickets
# ==========================================================
@router.get("/for-project-engineer", response_model=List[schemas.TicketSummary])
def get_tickets_for_project_engineer(
    db: Session = Depends(database.get_db),
    supervisor_id: int = Query(...),
    date: str = Query(...),
):
    """
    Project Engineers see tickets only from APPROVED submissions.
    """
    target_date = date_type.fromisoformat(date)

    # Get foremen who had approved submissions by this supervisor
    foremen = (
        db.query(models.DailySubmission.foreman_id)
        .filter(
            models.DailySubmission.supervisor_id == supervisor_id,
            models.DailySubmission.date == target_date,
            models.DailySubmission.status == "APPROVED",
        )
        .distinct()
        .subquery()
    )

    tickets = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.foreman_id.in_(foremen),
            cast(models.Ticket.created_at, Date) == target_date,
            models.Ticket.sent == True
        )
        .all()
    )

    return [schemas.TicketSummary.from_orm(t) for t in tickets]



# ==========================================================
# 🔹 4️⃣ Ticket Update Endpoint
# ==========================================================
from pydantic import BaseModel

class TicketUpdatePhaseCode(BaseModel):
    phase_code: str

@router.patch("/{ticket_id}", response_model=schemas.TicketSummary)
def update_ticket_phase_code(
    update: TicketUpdatePhaseCode,
    ticket_id: int = Path(..., description="ID of the ticket to update"),
    db: Session = Depends(database.get_db)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.phase_code = update.phase_code
    db.commit()
    db.refresh(ticket)
    return ticket



# ==========================================================
# 🔹 5️⃣ Health Check Endpoint
# ==========================================================
@router.get("/")
async def root():
    return {"message": "OCR API is running successfully!"}
