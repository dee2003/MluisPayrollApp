# backend/crud.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Type, TypeVar, List
from fastapi.encoders import jsonable_encoder

from . import models, schemas, utils
from .database import get_db

# =======================================================================
# 1. Generic CRUD Router Factory
# =======================================================================

# --- Generic Type Variables ---
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
    A factory that creates a set of CRUD endpoints for a given SQLAlchemy model.
    It now includes a check to prevent creating items with duplicate primary keys.
    """
    router = APIRouter(prefix=prefix, tags=tags)

    # --- Automatically determine the primary key name and type ---
    pk_column = model.__mapper__.primary_key[0]
    pk_name = pk_column.name
    pk_type = pk_column.type.python_type

    # --- CREATE ---
    @router.post("/", response_model=response_schema, status_code=status.HTTP_201_CREATED)
    def create_item(item: create_schema, db: Session = Depends(get_db)):
        item_data = item.dict()

        # --- THE FIX: CHECK FOR DUPLICATE PRIMARY KEY ---
        pk_value = item_data.get(pk_name)
        if pk_value is not None:
            existing_item = db.query(model).filter(pk_column == pk_value).first()
            if existing_item:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"{model.__name__} with {pk_name} '{pk_value}' already exists."
                )
        # --- END OF FIX ---

        # Automatically hash passwords for the User model
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

# =======================================================================
# 2. Specific CRUD Functions (For Custom Routers)
# =======================================================================

def create_timesheet(db: Session, ts: schemas.TimesheetCreate):
    """Creates a new timesheet, extracting job_name for easier querying."""
    data_to_store = jsonable_encoder(ts.data)
    job_description = ts.data.get("job_name")

    db_ts = models.Timesheet(
        foreman_id=ts.foreman_id,
        date=ts.date,
        timesheet_name=job_description,
        data=data_to_store,
        sent=False
    )
    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts

def get_timesheets(db: Session):
    """Retrieves all timesheets and includes foreman's full name."""
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
            "job_name": ts.timesheet_name,
            "data": ts.data,
            "sent": ts.sent
        })
    return timesheets

def get_crew_mapping(db: Session, foreman_id: int):
    """Retrieves all resources for a foreman's crew mapping."""
    mapping = db.query(models.CrewMapping).filter(models.CrewMapping.foreman_id == foreman_id).first()

    if not mapping:
        return None

    employee_ids_str = mapping.employee_ids or ''
    equipment_ids_str = mapping.equipment_ids or ''
    material_ids_str = mapping.material_ids or ''
    vendor_ids_str = mapping.vendor_ids or ''
    dumping_site_ids_str = mapping.dumping_site_ids or ''

    employee_ids = [eid.strip() for eid in employee_ids_str.split(',') if eid.strip()]
    equipment_ids = [eqid.strip() for eqid in equipment_ids_str.split(',') if eqid.strip()]
    material_ids = [int(mid.strip()) for mid in material_ids_str.split(',') if mid.strip()]
    vendor_ids = [int(vid.strip()) for vid in vendor_ids_str.split(',') if vid.strip()]
    dumping_site_ids = [dsid.strip() for dsid in dumping_site_ids_str.split(',') if dsid.strip()]

    employees = db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).all() if employee_ids else []
    equipment = db.query(models.Equipment).filter(models.Equipment.id.in_(equipment_ids)).all() if equipment_ids else []
    materials = db.query(models.Material).filter(models.Material.id.in_(material_ids)).all() if material_ids else []
    vendors = db.query(models.Vendor).filter(models.Vendor.id.in_(vendor_ids)).all() if vendor_ids else []
    dumping_sites = db.query(models.DumpingSite).filter(models.DumpingSite.id.in_(dumping_site_ids)).all() if dumping_site_ids else []

    return {
        "foreman_id": foreman_id,
        "employees": employees,
        "equipment": equipment,
        "materials": materials,
        "vendors": vendors,
        "dumping_sites": dumping_sites,

    }
