# /app/routes/equipment.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Equipment

router = APIRouter(
    prefix="/api/equipment",
    tags=["Equipment"]
)

@router.get("/")
def get_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).filter(Equipment.status == "Active").all()
