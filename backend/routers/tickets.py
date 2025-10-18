# backend/routers/tickets.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Date
from typing import List

from sqlalchemy import cast, Date


from ..database import get_db

# router = APIRouter(
#     prefix="/api/tickets",
#     tags=["Tickets"]
# )

# @router.get("/for-supervisor", response_model=List[schemas.TicketSummary])
# def get_tickets_for_supervisor(
#     db: Session = Depends(get_db),
#     foreman_id: int = Query(...),
#     date: str = Query(...)
# ):
#     """
#     Returns tickets for a specific foreman on a specific date
#     (filtered by created_at date since Ticket.date is null).
#     """
#     try:
#         target_date = date_type.fromisoformat(date)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

#     tickets = db.query(models.Ticket).filter(
#         models.Ticket.foreman_id == foreman_id,
#         models.Ticket.created_at.cast(Date) == target_date  # Filter by created_at date
#     ).all()

#     if not tickets:
#         raise HTTPException(status_code=404, detail="No tickets found for this foreman on this date.")

#     return [schemas.TicketSummary.from_orm(t) for t in tickets]
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as date_type

from .. import models, schemas
router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)

@router.get("/for-supervisor", response_model=List[schemas.TicketSummary])
def get_tickets_for_supervisor(
    db: Session = Depends(get_db),
    foreman_id: int = Query(..., description="Foreman user ID"),
    date: str = Query(..., description="Date to filter tickets in YYYY-MM-DD format")
):
    try:
        target_date = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    tickets = db.query(models.Ticket).filter(
        models.Ticket.foreman_id == foreman_id,
        cast(models.Ticket.created_at, Date) == target_date
    ).all()

    return [schemas.TicketSummary.from_orm(t) for t in tickets]
from pydantic import BaseModel
from fastapi import Path, Query

class TicketUpdatePhaseCode(BaseModel):
    phase_code: str

@router.patch("/{ticket_id}", response_model=schemas.TicketSummary)
def update_ticket_phase_code(
    update: TicketUpdatePhaseCode,
    ticket_id: int = Path(..., description="ID of the ticket to update"),
    db: Session = Depends(get_db)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.phase_code = update.phase_code
    db.commit()
    db.refresh(ticket)
    return ticket






# for project engineer
@router.get("", response_model=List[schemas.TicketSummary])
def get_tickets_for_project_engineer(
    db: Session = Depends(get_db),
    supervisor_id: int = Query(...),
    date: str = Query(...)
):
    target_date = date_type.fromisoformat(date)

    # Find foremen with submissions approved by this supervisor on this date
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
            models.Ticket.sent == True,
        )
        .all()
    )

    return [schemas.TicketSummary.from_orm(t) for t in tickets]
