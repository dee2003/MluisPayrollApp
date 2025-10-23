from fastapi import FastAPI, Depends, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database, crud
from .crud import create_crud_router
from .routers.timesheet import router as timesheet_router
import logging
import sys
from .routers.equipment import router as equipment_router
from fastapi.staticfiles import StaticFiles
from .routers import timesheet
from .routers import tickets
from .routers import review
# Create all database tables if they don't exist
models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")


# 2. Get the Uvicorn access logger
access_logger = logging.getLogger("uvicorn.access")

# 3. Clear any existing handlers that might be broken or redirecting output.
access_logger.handlers.clear()

# 4. Add a new StreamHandler to ensure logs go to the console (stdout/stderr).
access_uvicorn_handler = logging.StreamHandler()
access_logger.addHandler(access_uvicorn_handler)

# 5. Set propagation to False to prevent duplicate logging if the root logger is also configured.
access_logger.propagate = False
access_logger.setLevel(logging.INFO)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =======================================================================
# 1. Job & Phase Management Router (REVISED)
# =======================================================================
job_phase_router = APIRouter(prefix="/api/job-phases", tags=["Job Phases"])

# --- REVISED: POST endpoint for CREATING a new job ---
# This now handles all the new fields on creation.
@job_phase_router.post("/", response_model=schemas.JobPhase, status_code=status.HTTP_201_CREATED)
def create_job_phase(job_phase: schemas.JobPhaseCreate, db: Session = Depends(database.get_db)):
    # Check if a job with this code already exists
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_phase.job_code).first()
    if db_job:
        raise HTTPException(status_code=409, detail=f"Job with code '{job_phase.job_code}' already exists.")
    
    # Create a new JobPhase object from the payload
    new_job_phase = models.JobPhase(**job_phase.dict())
    
    db.add(new_job_phase)
    db.commit()
    db.refresh(new_job_phase)
    return new_job_phase

# --- REVISED: PUT endpoint for UPDATING an existing job ---
# This is the correct method for updates.
@job_phase_router.put("/{job_code}", response_model=schemas.JobPhase)
def update_job_phase(job_code: str, job_update: schemas.JobPhaseUpdate, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get the data from the Pydantic model
    update_data = job_update.dict(exclude_unset=True)

    # Update the fields in the database model
    for key, value in update_data.items():
        setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job

# --- CORRECTED: GET endpoint to list all jobs ---
# Uses the correct response_model `JobPhaseInDB`
@job_phase_router.get("/", response_model=List[schemas.JobPhase])
def get_all_job_phases(db: Session = Depends(database.get_db)):
    return db.query(models.JobPhase).all()
    
# --- CORRECTED: GET endpoint for a single job ---
@job_phase_router.get("/{job_code}", response_model=schemas.JobPhase)
def get_job_phases(job_code: str, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

# main.py

@job_phase_router.delete("/{job_code}", status_code=status.HTTP_200_OK)
def delete_job(job_code: str, db: Session = Depends(database.get_db)):
    # This function expects a string `job_code`, not an integer ID.
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return {"ok": True, "detail": f"Job '{job_code}' and all its phases deleted"}



# =======================================================================
# 2. Crew Mapping Router
# =======================================================================
crew_mapping_router = APIRouter(prefix="/api/crew-mapping", tags=["Crew Mapping"])


def parse_ids(id_string: str) -> List[str]:
    if not id_string: return []
    return [item.strip() for item in id_string.split(',') if item.strip()]


def list_to_csv(id_list: List) -> str:
    return ",".join(map(str, id_list))


def find_employee_conflicts(db: Session, employee_ids: List[str], exclude_crew_id: int = None) -> set:
    employee_ids_set = set(map(str, employee_ids))
    if not employee_ids_set: return set()
    query = db.query(models.CrewMapping)
    if exclude_crew_id is not None:
        query = query.filter(models.CrewMapping.id != exclude_crew_id)
    all_mappings = query.all()
    conflicts = set()
    for mapping in all_mappings:
        assigned_ids = set(parse_ids(mapping.employee_ids))
        conflicts.update(employee_ids_set.intersection(assigned_ids))
    return conflicts


@crew_mapping_router.get("/by-foreman/{foreman_id}", response_model=schemas.CrewMappingResponse)
def get_crew_details_by_foreman(foreman_id: int, db: Session = Depends(database.get_db)):
    mapping_details = crud.get_crew_mapping(db, foreman_id=foreman_id)
    if not mapping_details:
        raise HTTPException(status_code=404, detail=f"No crew mapping found for foreman with ID {foreman_id}")
    return mapping_details


@crew_mapping_router.get("/", response_model=List[schemas.CrewMapping])
def list_crew_mappings(db: Session = Depends(database.get_db)):
    return db.query(models.CrewMapping).all()


@crew_mapping_router.get("/{crew_id}", response_model=schemas.CrewMapping)
def get_crew_mapping_by_id(crew_id: int, db: Session = Depends(database.get_db)):
    mapping = db.query(models.CrewMapping).filter(models.CrewMapping.id == crew_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail=f"Crew mapping not found for crew_id {crew_id}")
    return mapping


@crew_mapping_router.post("/", response_model=schemas.CrewMapping, status_code=201)
def create_crew_mapping(crew: schemas.CrewMappingCreate, db: Session = Depends(database.get_db)):
    # Remove conflict check entirely
    db_crew = models.CrewMapping(
        foreman_id=crew.foreman_id,
        employee_ids=list_to_csv(crew.employee_ids),
        equipment_ids=list_to_csv(crew.equipment_ids),
        material_ids=list_to_csv(crew.material_ids or []),
        vendor_ids=list_to_csv(crew.vendor_ids or []),
        dumping_site_ids=list_to_csv(crew.dumping_site_ids or [])
    )
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)
    return db_crew



@crew_mapping_router.put("/{crew_id}", response_model=schemas.CrewMapping)
def update_crew_mapping(crew_id: int, crew: schemas.CrewMappingCreate, db: Session = Depends(database.get_db)):
    db_crew = db.query(models.CrewMapping).filter(models.CrewMapping.id == crew_id).first()
    if not db_crew:
        raise HTTPException(status_code=404, detail="Crew mapping not found")
    conflicts = find_employee_conflicts(db, crew.employee_ids, exclude_crew_id=crew_id)
    if conflicts:
        raise HTTPException(status_code=409, detail=f"Employee(s) with ID(s) {', '.join(conflicts)} are already assigned.")
    db_crew.foreman_id, db_crew.employee_ids, db_crew.equipment_ids = crew.foreman_id, list_to_csv(crew.employee_ids), list_to_csv(crew.equipment_ids)
    db_crew.material_ids, db_crew.vendor_ids = list_to_csv(crew.material_ids or []), list_to_csv(crew.vendor_ids or [])
    db_crew.dumping_site_ids = list_to_csv(crew.dumping_site_ids or [])

    db.commit()
    db.refresh(db_crew)
    return db_crew


@crew_mapping_router.delete("/{crew_id}", status_code=204)
def delete_crew_mapping(crew_id: int, db: Session = Depends(database.get_db)):
    db_crew = db.query(models.CrewMapping).filter(models.CrewMapping.id == crew_id).first()
    if not db_crew:
        raise HTTPException(status_code=404, detail="Crew mapping not found")
    db.delete(db_crew)
    db.commit()
    return


# --- Router Inclusion ---
crud_models = [
    {"model": models.User, "schemas": (schemas.UserCreate, schemas.User)},
    {"model": models.Employee, "schemas": (schemas.EmployeeCreate, schemas.Employee)},
    {"model": models.Equipment, "schemas": (schemas.EquipmentCreate, schemas.Equipment)},
    {"model": models.Vendor, "schemas": (schemas.VendorCreate, schemas.Vendor)},
    {"model": models.Material, "schemas": (schemas.MaterialCreate, schemas.Material)},
    {"model": models.DumpingSite, "schemas": (schemas.DumpingSiteCreate, schemas.DumpingSite)}, 

]
for item in crud_models:
    model, (create_schema, response_schema) = item["model"], item["schemas"]
    prefix, tags = f"/api/{model.__tablename__}", [model.__tablename__.capitalize()]
    router = create_crud_router(model=model, create_schema=create_schema, response_schema=response_schema, prefix=prefix, tags=tags)
    app.include_router(router)

    
from .ocr import ocr_main
app.include_router(ocr_main.router)
from fastapi.staticfiles import StaticFiles
import os
TICKETS_DIR = r"C:\Mluis_App\mluis_app\backend\tickets"
app.mount("/media/tickets", StaticFiles(directory=os.path.abspath(TICKETS_DIR)), name="tickets")
app.include_router(job_phase_router)
app.include_router(crew_mapping_router)
app.include_router(timesheet_router)
# main.py
app.include_router(equipment_router)
from .routers import submissions
app.include_router(submissions.router)
# --- Main Data Endpoint ---
# This endpoint fetches all initial data for the admin dashboard.
@app.get("/api/data", response_model=schemas.AppData, tags=["App Data"])
def get_all_data(db: Session = Depends(database.get_db)):
    return {
        "users": db.query(models.User).all(), 
        "employees": db.query(models.Employee).all(),
        "equipment": db.query(models.Equipment).all(), 
        # This will now correctly return all job phase data
        "job_phases": db.query(models.JobPhase).all(),
        "materials": db.query(models.Material).all(), 
        "vendors": db.query(models.Vendor).all(),
        "dumping_sites": db.query(models.DumpingSite).all(),

    }
# backend/main.py or backend/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, database, schemas

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

from . import utils

@auth_router.post("/login", response_model=schemas.User)
def login(credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()

    if not user or not utils.verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    return user

app.include_router(auth_router)


from .ocr import ocr_main
app.include_router(ocr_main.router)
from fastapi.staticfiles import StaticFiles
import os

app.include_router(review.router)

from .routers import tickets
app.include_router(tickets.router)
from backend.routers import project_engineer
app.include_router(project_engineer.router)
