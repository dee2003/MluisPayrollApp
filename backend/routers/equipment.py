# # /app/routes/equipment.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from ..database import get_db
# from ..models import Equipment

# router = APIRouter(
#     prefix="/api/equipment",
#     tags=["Equipment"]
# )

# @router.get("/")
# def get_equipment(db: Session = Depends(get_db)):
#     return db.query(Equipment).filter(Equipment.status == "Active").all()
# /app/routes/equipment.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..schemas import EquipmentCreate, EquipmentUpdate, EquipmentInDB
from ..models import Equipment
from fastapi import FastAPI, HTTPException, Depends
router = APIRouter(
    prefix="/api/equipment",
    tags=["Equipment"]
)
@router.get("/")
def get_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).filter(Equipment.status == "Active").all()
# In your FastAPI equipment router file
@router.put("/equipment/{equipment_id}", response_model=EquipmentInDB)
def update_equipment(equipment_id: str, equipment: EquipmentUpdate, db: Session = Depends(get_db)):
    db_equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    # Update the model with data from the request
    update_data = equipment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_equipment, key, value)
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    # Return the fully updated object
    return db_equipment