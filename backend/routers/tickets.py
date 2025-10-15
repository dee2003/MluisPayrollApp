# backend/routers/tickets.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Date
from typing import List
from datetime import date as date_type

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)

@router.get("/for-supervisor", response_model=List[schemas.TicketSummary])
def get_tickets_for_supervisor(
    db: Session = Depends(get_db),
    foreman_id: int = Query(...),
    date: str = Query(...)
):
    """
    Returns tickets for a specific foreman on a specific date
    (filtered by created_at date since Ticket.date is null).
    """
    try:
        target_date = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    tickets = db.query(models.Ticket).filter(
        models.Ticket.foreman_id == foreman_id,
        models.Ticket.created_at.cast(Date) == target_date  # Filter by created_at date
    ).all()

    if not tickets:
        raise HTTPException(status_code=404, detail="No tickets found for this foreman on this date.")

    return [schemas.TicketSummary.from_orm(t) for t in tickets]
