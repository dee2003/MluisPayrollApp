from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from .. import models, schemas, database
from ..database import get_db

# -------------------------------
# Job & Phase Management Router
# -------------------------------
router = APIRouter(prefix="/api/job-phases", tags=["Job Phases"])

# ✅ Create Job Phase
@router.post("/", response_model=schemas.JobPhase)
def create_job_phase(job_phase: schemas.JobPhaseCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_phase.job_code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Job with code '{job_phase.job_code}' already exists.")

    new_job_phase = models.JobPhase(
        job_code=job_phase.job_code,
        contract_no=job_phase.contract_no,
        job_description=job_phase.job_description,
        project_engineer=job_phase.project_engineer,
        jurisdiction=job_phase.jurisdiction,
        status=job_phase.status
    )

    # ✅ Attach Phase Codes
    if job_phase.phase_codes:
        for code_str in job_phase.phase_codes:
            new_phase = models.PhaseCode(
                code=code_str,
                description=f"Phase {code_str}",
                unit="unit",
            )
            new_job_phase.phase_codes.append(new_phase)

    db.add(new_job_phase)
    db.commit()
    db.refresh(new_job_phase)
    return new_job_phase


# ✅ Update Job Phase
@router.put("/{job_code}", response_model=schemas.JobPhase)
def update_job_phase(job_code: str, job_update: schemas.JobPhaseUpdate, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).options(
        selectinload(models.JobPhase.phase_codes)
    ).filter(models.JobPhase.job_code == job_code).first()

    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = job_update.dict(exclude_unset=True)

    if "phase_codes" in update_data:
        new_phase_code_strings = update_data.pop("phase_codes")
        db_job.phase_codes.clear()
        for code_str in new_phase_code_strings:
            new_phase = models.PhaseCode(
                code=code_str,
                description=f"Phase {code_str}",
                unit="unit"
            )
            db_job.phase_codes.append(new_phase)

    for key, value in update_data.items():
        setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/phase-codes", response_model=List[schemas.PhaseCode])
def get_all_phase_codes(db: Session = Depends(get_db)):
    """
    Returns a list of all phase codes across all job phases.
    Used for dropdowns or lookups in the frontend.
    """
    phase_codes = db.query(models.PhaseCode).all()
    return phase_codes


# ✅ Get all job phases
@router.get("/", response_model=List[schemas.JobPhase])
def get_all_job_phases(db: Session = Depends(database.get_db)):
    return db.query(models.JobPhase).options(
        selectinload(models.JobPhase.phase_codes)
    ).all()


# ✅ Get a single job phase
@router.get("/{job_code}", response_model=schemas.JobPhase)
def get_job_phases(job_code: str, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job


# ✅ Delete job phase
@router.delete("/{job_code}", status_code=status.HTTP_200_OK)
def delete_job(job_code: str, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return {"ok": True, "detail": f"Job '{job_code}' and all its phases deleted"}



