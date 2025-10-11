from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Type, TypeVar, Generic, List, Any
from . import schemas
from .database import get_db
from . import models

# --- Generic Type Variables ---
# These allow the function to work with any SQLAlchemy model and Pydantic schema
ModelType = TypeVar("ModelType", bound=models.Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
ResponseSchemaType = TypeVar("ResponseSchemaType", bound=BaseModel)

def create_crud_router(
    *,
    model: Type[ModelType],
    create_schema: Type[CreateSchemaType],
    response_schema: Type[ResponseSchemaType],
    prefix: str,
    tags: List[str]
) -> APIRouter:
    """
    A factory function to create a standard set of CRUD endpoints for a given model.
    """
    router = APIRouter(prefix=prefix, tags=tags)

    # --- Automatically determine the primary key type (e.g., int, str) ---
    pk_column = model.__mapper__.primary_key[0]
    pk_type = pk_column.type.python_type

    # --- CREATE ---
    from . import utils  # make sure this import exists at the top

# --- CREATE ---
    @router.post("/", response_model=response_schema)
    def create_item(item: create_schema, db: Session = Depends(get_db)):
        item_data = item.dict()

    # ✅ Automatically hash passwords for User model
        if model.__name__ == "User" and "password" in item_data:
            item_data["password"] = utils.hash_password(item_data["password"])

        db_item = model(**item_data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item


    # --- READ ALL ---
    @router.get("/", response_model=List[response_schema])
    def list_items(db: Session = Depends(get_db)):
        return db.query(model).all()

    # --- READ ONE ---
    @router.get("/{item_id}", response_model=response_schema)
    def read_item(item_id: pk_type, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        return db_item

    # --- UPDATE ---
    @router.put("/{item_id}", response_model=response_schema)
    def update_item(item_id: pk_type, item: create_schema, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        
        item_data = item.dict(exclude_unset=True)
        for key, value in item_data.items():
            setattr(db_item, key, value)
            
        db.commit()
        db.refresh(db_item)
        return db_item

    # --- DELETE ---
    @router.delete("/{item_id}")
    def delete_item(item_id: pk_type, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        
        db.delete(db_item)
        db.commit()
        return {"ok": True, "deleted_id": item_id}

    return router

from .models import Timesheet, User
from .schemas import TimesheetCreate
# In crud.py
from fastapi.encoders import jsonable_encoder

def create_timesheet(db: Session, ts: schemas.TimesheetCreate):
    # Convert the entire incoming 'data' object to a JSON-compatible format
    data_to_store = jsonable_encoder(ts.data)

    # --- THE FIX: Extract the job description from the data ---
    # We safely get 'job_name' which holds the job description from the nested data.
    job_description = ts.data.get("job_name")

    db_ts = models.Timesheet(
        foreman_id=ts.foreman_id,
        date=ts.date,
        
        # Explicitly assign the extracted job description to the timesheet_name column
        timesheet_name=job_description,
        
        data=data_to_store, # Store the complete JSON object
        sent=False
    )

    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts
def get_timesheets(db: Session):
    results = db.query(models.Timesheet, models.User).join(
        models.User, models.Timesheet.foreman_id == models.User.id
    ).all()

    timesheets = []
    for ts, foreman in results:
        timesheets.append({
            "id": ts.id,
            "date": ts.date.isoformat(),
            "foreman_id": ts.foreman_id,
            "foreman_name": f"{foreman.first_name} {foreman.last_name}",
            
            # --- THE FIX ---
            # Create a 'job_name' key using the value from the 'timesheet_name' column.
            "job_name": ts.timesheet_name,
            
            "data": ts.data,
            "sent": ts.sent
        })
    return timesheets
# In crud.py

from sqlalchemy.orm import Session
from . import models

# ... (other existing crud functions)

def get_crew_mapping(db: Session, foreman_id: int):
    """
    Retrieves all resources associated with a foreman's crew mapping.
    This version is more robust and avoids issues with empty related data.
    """
    # 1. Fetch the specific crew mapping record for the foreman.
    mapping = db.query(models.CrewMapping).filter(models.CrewMapping.foreman_id == foreman_id).first()

    # If there is no mapping record at all, return None.
    if not mapping:
        return None

    # 2. Safely parse the comma-separated ID strings into lists.
    # This handles cases where the string might be empty or None.
    employee_ids_str = mapping.employee_ids or ''
    equipment_ids_str = mapping.equipment_ids or ''
    material_ids_str = mapping.material_ids or ''
    vendor_ids_str = mapping.vendor_ids or ''

    # Create clean lists of IDs, filtering out any empty strings from the split.
    employee_ids = [eid.strip() for eid in employee_ids_str.split(',') if eid.strip()]
    equipment_ids = [eqid.strip() for eqid in equipment_ids_str.split(',') if eqid.strip()]
    material_ids = [int(mid.strip()) for mid in material_ids_str.split(',') if mid.strip()]
    vendor_ids = [int(vid.strip()) for vid in vendor_ids_str.split(',') if vid.strip()]

    # 3. Fetch each resource type only if its ID list is not empty.
    employees = []
    if employee_ids:
        employees = db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all()

    equipment = []
    if equipment_ids:
        equipment = db.query(models.Equipment).filter(models.Equipment.id.in_(equipment_ids)).all()

    materials = []
    if material_ids:
        materials = db.query(models.Material).filter(models.Material.id.in_(material_ids)).all()
    
    vendors = []
    if vendor_ids:
        vendors = db.query(models.Vendor).filter(models.Vendor.id.in_(vendor_ids)).all()

    # 4. Return the complete dictionary of resources.
    return {
        "foreman_id": foreman_id,
        "employees": employees,
        "equipment": equipment,
        "materials": materials,
        "vendors": vendors,
    }

# Ensure your get_crew_mapping_by_foreman_name function (if you still use it)
# also calls this corrected get_crew_mapping function.
