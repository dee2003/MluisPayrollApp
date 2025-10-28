

# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session, joinedload
# from typing import List,Optional
# from .. import models, schemas
# from ..database import get_db
# import os
# import pandas as pd
# import json
# from datetime import datetime

# router = APIRouter(
#     prefix="/api/timesheets",
#     tags=["Timesheets"]
# )

# # -------------------------------
# # CREATE a new timesheet
# # -------------------------------
# @router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
# def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
#     """
#     Creates a new timesheet record; timesheet_name is derived from data.
#     """
#     data_to_store = timesheet.data or {}
#     job_name = (
#         data_to_store.get("job_name")
#         or data_to_store.get("job", {}).get("job_description")
#         or data_to_store.get("job", {}).get("job_name")
#         or data_to_store.get("job", {}).get("job_code")
#         or "Untitled Timesheet"
#     )
#     db_timesheet = models.Timesheet(
#         foreman_id=timesheet.foreman_id,
#         date=timesheet.date,
#         timesheet_name=job_name,
#         data=data_to_store,
#         sent=False,
#         status=timesheet.status,
#         job_phase_id=timesheet.job_phase_id,
#     )
#     db.add(db_timesheet)
#     db.commit()
#     db.refresh(db_timesheet)
#     return db_timesheet


# # -------------------------------
# # GET all timesheets for a foreman
# # -------------------------------
# @router.get("/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
# def get_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
#     """
#     Returns all timesheets for a given foreman.
#     Uses joinedload to eagerly load files to avoid 422 validation issues.
#     """
#     timesheets = (
#         db.query(models.Timesheet)
#         .options(joinedload(models.Timesheet.files))
#         .filter(models.Timesheet.foreman_id == foreman_id)
#         .all()
#     )
#     return timesheets


# # -------------------------------
# # GET timesheets for supervisor
# # -------------------------------
# from datetime import date as date_type
# from sqlalchemy import cast, Date
# @router.get("/for-supervisor", response_model=List[schemas.Timesheet])
# def get_timesheets_for_supervisor(
#     db: Session = Depends(get_db),
#     foreman_id: Optional[int] = Query(None),
#     date: Optional[str] = Query(None)
# ):
#     """
#     Returns all sent timesheets for supervisors.
#     Filters by work performed date (`timesheet.date`) and optionally by foreman.
#     Supports multiple timesheets per work date.
#     """
#     query = db.query(models.Timesheet).options(joinedload(models.Timesheet.files)).filter(models.Timesheet.sent == True)
#     if foreman_id is not None:
#         query = query.filter(models.Timesheet.foreman_id == foreman_id)
#     if date:
#         try:
#             target_date = date_type.fromisoformat(date)
#             query = query.filter(cast(models.Timesheet.date, Date) == target_date)
#         except ValueError:
#             raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

#     timesheets = query.order_by(models.Timesheet.sent_date.desc()).all()  # optional: latest sent first
#     return timesheets






# # -------------------------------
# # GET a single timesheet by ID
# # -------------------------------
# @router.get("/{timesheet_id}", response_model=schemas.Timesheet)
# def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     """
#     Returns a single timesheet, merging the foreman-saved JSON with static employee info.
#     Files are eagerly loaded.
#     """
#     timesheet = (
#         db.query(models.Timesheet)
#         .options(joinedload(models.Timesheet.files))
#         .filter(models.Timesheet.id == timesheet_id)
#         .first()
#     )
#     if not timesheet:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     # Foreman-saved JSON
#     saved_data = timesheet.data
#     if isinstance(saved_data, str):
#         try:
#             saved_data = json.loads(saved_data)
#         except json.JSONDecodeError:
#             raise HTTPException(status_code=500, detail="Invalid timesheet JSON data")

#     # Enrich employees with DB details, but keep foreman-entered values
#     saved_employees = saved_data.get("employees", [])
#     if saved_employees:
#         saved_map = {e.get("id"): e for e in saved_employees if e.get("id") is not None}
#         ids = list(saved_map.keys())
#         if ids:
#             db_emps = db.query(models.Employee).filter(models.Employee.id.in_(ids)).all()
#             enriched = []
#             for emp in db_emps:
#                 submitted = saved_map.get(emp.id, {})
#                 enriched.append({
#                     "id": emp.id,
#                     "first_name": emp.first_name,
#                     "middle_name": emp.middle_name,
#                     "last_name": emp.last_name,
#                     "class_1": emp.class_1,
#                     "class_2": emp.class_2,
#                     # Source of truth from foreman
#                     "selected_class": submitted.get("selected_class"),
#                     "hours_per_phase": submitted.get("hours_per_phase", {}),
#                 })
#             saved_data = {**saved_data, "employees": enriched}

#     timesheet.data = saved_data
#     return timesheet


# # -------------------------------
# # UPDATE a timesheet + save Excel file
# # -------------------------------
# @router.put("/{timesheet_id}", response_model=schemas.Timesheet)
# def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
#     """
#     Updates timesheet.data and optionally status, then generates a versioned Excel file.
#     """
#     NGROK_BASE_URL = "https://coated-nonattributive-babara.ngrok-free.dev"

#     ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not ts:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     payload = timesheet_update.dict(exclude_unset=True)
#     if "data" in payload:
#         ts.data = payload["data"]
#     if "status" in payload:
#         ts.status = payload["status"]

#     db.commit()
#     db.refresh(ts)

#     # Generate Excel using the now-committed data
#     try:
#         BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#         storage_dir = os.path.join(BASE_DIR, "storage")
#         os.makedirs(storage_dir, exist_ok=True)

#         ts_date_str = ts.date.strftime("%Y-%m-%d") if hasattr(ts.date, "strftime") else str(ts.date)
#         date_folder = os.path.join(storage_dir, ts_date_str)
#         os.makedirs(date_folder, exist_ok=True)

#         existing = [f for f in os.listdir(date_folder) if f.startswith(f"timesheet_{ts.id}_")]
#         version = len(existing) + 1
#         file_name = f"timesheet_{ts.id}_{ts_date_str}_v{version}.xlsx"
#         file_path_local = os.path.join(date_folder, file_name)

#         data = ts.data if isinstance(ts.data, dict) else json.loads(ts.data)
#         job_phases = data.get("job", {}).get("phase_codes", [])

#         def create_df(entities, name_key="name"):
#             rows = []
#             for ent in entities:
#                 name = ent.get(name_key) or ent.get("first_name", "") or ""
#                 if "last_name" in ent:
#                     name = f"{name} {ent.get('last_name', '')}".strip()
#                 row = {"ID": ent.get("id", ""), "Name": name}
#                 for phase in job_phases:
#                     row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
#                 rows.append(row)
#             return pd.DataFrame(rows)

#         with pd.ExcelWriter(file_path_local, engine="openpyxl") as writer:
#             df_emp = create_df(data.get("employees", []), name_key="first_name")
#             df_emp.to_excel(writer, index=False, sheet_name="Employees")

#             df_eq = create_df(data.get("equipment", []))
#             df_eq.to_excel(writer, index=False, sheet_name="Equipment")

#             df_mat = create_df(data.get("materials", []))
#             df_mat.to_excel(writer, index=False, sheet_name="Materials")

#             df_vend = create_df(data.get("vendors", []))
#             df_vend.to_excel(writer, index=False, sheet_name="Vendors")

#         file_url = f"{NGROK_BASE_URL}/storage/{ts_date_str}/{file_name}"

#         new_file = models.TimesheetFile(
#             timesheet_id=ts.id,
#             file_path=file_url,
#             foreman_id=ts.foreman_id,
#         )
#         db.add(new_file)

#         # Update sent/status if this update represents a send action on save
#         # ts.sent = True
#         # ts.status = "sent"

#         db.commit()

#     except Exception as e:
#         print(f"❌ Excel generation/recording failed: {e}")

#     return ts


# # -------------------------------
# # SEND a timesheet
# # -------------------------------
# from datetime import datetime

# @router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
# def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not ts:
#         raise HTTPException(status_code=404, detail="Timesheet not found")

#     ts.sent = True
#     ts.sent_date = datetime.utcnow()  # mark the foreman send time
#     ts.status = "sent"

#     # Add workflow entry
#     workflow = models.TimesheetWorkflow(
#         timesheet_id=ts.id,
#         foreman_id=ts.foreman_id,
#         supervisor_id=None,
#         action="sent",
#         timestamp=datetime.utcnow()
#     )
#     db.add(workflow)
#     db.commit()
#     db.refresh(ts)
#     return ts



# # -------------------------------
# # DELETE a timesheet
# # -------------------------------
# @router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
#     ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
#     if not ts:
#         raise HTTPException(status_code=404, detail="Timesheet not found")
#     db.delete(ts)
#     db.commit()
#     return
# # In your routers/timesheet.py

# @router.get("/", response_model=List[schemas.TimesheetResponse])
# def list_timesheets(db: Session = Depends(get_db)):
#     """
#     Returns a list of all timesheets with foreman names and job names included.
#     This is optimized for the admin dashboard view.
#     """
#     timesheets = db.query(models.Timesheet).options(joinedload(models.Timesheet.foreman)).all()
    
#     response = []
#     for ts in timesheets:
#         foreman_name = f"{ts.foreman.first_name} {ts.foreman.last_name}" if ts.foreman else "N/A"
        
#         # Create the response object, ensuring all required fields are present
#         response.append(schemas.TimesheetResponse(
#             id=ts.id,
#             date=ts.date,
#             foreman_id=ts.foreman_id,
#             foreman_name=foreman_name,
#             job_name=ts.timesheet_name,  # <-- The FIX: Populate the required 'job_name' field
#             data=ts.data,
#             sent=ts.sent,
#             status=ts.status
#         ))
        
#     return response
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List,Optional
from .. import models, schemas
from ..database import get_db
import os
import pandas as pd
import json
from datetime import datetime


router = APIRouter(
    prefix="/api/timesheets",
    tags=["Timesheets"]
)


# -------------------------------
# CREATE a new timesheet
# -------------------------------
# In your timesheet router file
from datetime import datetime

@router.post("/", response_model=schemas.Timesheet, status_code=status.HTTP_201_CREATED)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """
    Creates a new timesheet record.
    """
    data_to_store = timesheet.data or {}
    
    job_name = (
        data_to_store.get("job_name")
        or data_to_store.get("job", {}).get("job_description")
        or data_to_store.get("job", {}).get("job_name")
        or data_to_store.get("job", {}).get("job_code")
        or "Untitled Timesheet"
    )
    status_to_save = (timesheet.status or "draft").title()
    if status_to_save.lower() == 'draft':
        status_to_save = 'draft'


    db_timesheet = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        date=timesheet.date,
        timesheet_name=job_name,
        
        # --- CORRECTED PART ---
        # The 'data' field now maps to the JSONB column in the model
        data=data_to_store,
        
        # The 'sent' boolean is gone. The status and sent_date handle this.
        status=status_to_save, 
        
        job_phase_id=timesheet.job_phase_id,
        
        # Optionally set sent_date if the timesheet is submitted immediately
        # sent_date=datetime.utcnow() if timesheet.status == "Submitted" else None
    )

    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet




# -------------------------------
# GET all timesheets for a foreman
# -------------------------------
@router.get("/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
def get_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
    """
    Returns all timesheets for a given foreman.
    Uses joinedload to eagerly load files to avoid 422 validation issues.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.foreman_id == foreman_id)
        .all()
    )
    return timesheets



# -------------------------------
# GET timesheets for supervisor
# -------------------------------
from datetime import date as date_type
from sqlalchemy import cast, Date
@router.get("/for-supervisor", response_model=List[schemas.Timesheet])
def get_timesheets_for_supervisor(
    db: Session = Depends(get_db),
    foreman_id: Optional[int] = Query(None),
    date: Optional[str] = Query(None)
):
    """
    Returns all sent timesheets for supervisors.
    Filters by work performed date (`timesheet.date`) and optionally by foreman.
    Supports multiple timesheets per work date.
    """
    query = db.query(models.Timesheet).options(joinedload(models.Timesheet.files)).filter(models.Timesheet.sent == True)
    if foreman_id is not None:
        query = query.filter(models.Timesheet.foreman_id == foreman_id)
    if date:
        try:
            target_date = date_type.fromisoformat(date)
            query = query.filter(cast(models.Timesheet.date, Date) == target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")


    timesheets = query.order_by(models.Timesheet.sent_date.desc()).all()  # optional: latest sent first
    return timesheets






# In your routers/timesheet.py

# -------------------------------
# GET a single timesheet by ID
# -------------------------------
@router.get("/{timesheet_id}", response_model=schemas.Timesheet)
def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    """
    Returns a single timesheet, safely enriching the foreman-saved JSON with static info
    from the database for all entities (employees, equipment, materials, vendors, and dumping sites).
    This is non-destructive and ensures all saved data is returned.
    """
    timesheet = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.id == timesheet_id)
        .first()
    )
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    saved_data = timesheet.data or {}
    if isinstance(saved_data, str):
        try:
            saved_data = json.loads(saved_data)
        except json.JSONDecodeError:
            saved_data = {} # Default to an empty dictionary on error

    # --- Safe, Non-Destructive Enrichment Logic ---
    def enrich_entities_in_place(entity_key: str, model, name_fields: list):
        # Get the list of entities (e.g., employees, dumping_sites) from the saved data
        saved_entities = saved_data.get(entity_key, [])
        if not saved_entities:
            return # Nothing to do if the key doesn't exist or the list is empty

        # Get the IDs to look up in the database
        entity_ids = [e.get("id") for e in saved_entities if e.get("id") is not None]
        if not entity_ids:
            return # No IDs to look up

        # Fetch the corresponding records from the database in one query
        db_entities = db.query(model).filter(model.id.in_(entity_ids)).all()
        db_map = {db_e.id: db_e for db_e in db_entities}

        # Loop through the entities saved by the foreman and add the name
        for entity in saved_entities:
            entity_id = entity.get("id")
            db_record = db_map.get(entity_id)
            
            # If we found a matching record in the DB, add its name
            if db_record:
                name_parts = [getattr(db_record, field, "") for field in name_fields]
                full_name = " ".join(filter(None, name_parts)).strip()
                entity["name"] = full_name
    
    # --- End of Logic ---

    # Call the enrichment function for EVERY entity type.
    # This will modify the 'saved_data' dictionary directly.
    enrich_entities_in_place("employees", models.Employee, ["first_name", "last_name"])
    enrich_entities_in_place("equipment", models.Equipment, ["name"])
    enrich_entities_in_place("materials", models.Material, ["name"])
    enrich_entities_in_place("vendors", models.Vendor, ["name"])
    enrich_entities_in_place("dumping_sites", models.DumpingSite, ["name"]) # The crucial addition

    # Return the timesheet with the fully enriched data object
    timesheet.data = saved_data
    return timesheet




# -------------------------------
# UPDATE a timesheet + save Excel file
# -------------------------------
# In your routers/timesheet.py

# -------------------------------
# UPDATE a timesheet + save Excel file
# -------------------------------
@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
def update_timesheet(timesheet_id: int, timesheet_update: schemas.TimesheetUpdate, db: Session = Depends(get_db)):
    """
    Updates timesheet.data and optionally status, then generates a versioned Excel file
    with specialized handling for dumping sites.
    """
    NGROK_BASE_URL = " https://541ce71740ad.ngrok-free.app"
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    payload = timesheet_update.dict(exclude_unset=True)
    if "data" in payload:
        ts.data = payload["data"]
    if "status" in payload:
        ts.status = payload["status"]

    db.commit()
    db.refresh(ts)

    # Generate Excel using the now-committed data
    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        storage_dir = os.path.join(BASE_DIR, "storage")
        os.makedirs(storage_dir, exist_ok=True)

        ts_date_str = ts.date.strftime("%Y-%m-%d") if hasattr(ts.date, "strftime") else str(ts.date)
        date_folder = os.path.join(storage_dir, ts_date_str)
        os.makedirs(date_folder, exist_ok=True)

        existing = [f for f in os.listdir(date_folder) if f.startswith(f"timesheet_{ts.id}_")]
        version = len(existing) + 1
        file_name = f"timesheet_{ts.id}_{ts_date_str}_v{version}.xlsx"
        file_path_local = os.path.join(date_folder, file_name)

        data = ts.data if isinstance(ts.data, dict) else json.loads(ts.data)
        job_phases = data.get("job", {}).get("phase_codes", [])

        # --- Generic DataFrame creator for Employees, Equipment, etc. ---
        def create_df(entities, name_key="name"):
            rows = []
            for ent in entities:
                name = ent.get(name_key) or ent.get("first_name", "") or ""
                if "last_name" in ent:
                    name = f"{name} {ent.get('last_name', '')}".strip()
                row = {"ID": ent.get("id", ""), "Name": name}
                for phase in job_phases:
                    row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)

        # --- START: Specialized DataFrame creator for Dumping Sites ---
        def create_dumping_site_df(entities):
            rows = []
            for ent in entities:
                row = {"ID": ent.get("id", ""), "Name": ent.get("name", "")}
                for phase in job_phases:
                    # Create separate columns for loads and quantity
                    row[f"{phase} (# of Loads)"] = ent.get("hoursperphase", {}).get(phase, 0)
                    row[f"{phase} (Qty)"] = ent.get("ticketsperphase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)
        # --- END: Specialized DataFrame creator ---

        with pd.ExcelWriter(file_path_local, engine="openpyxl") as writer:
            df_emp = create_df(data.get("employees", []), name_key="first_name")
            df_emp.to_excel(writer, index=False, sheet_name="Employees")

            df_eq = create_df(data.get("equipment", []))
            df_eq.to_excel(writer, index=False, sheet_name="Equipment")

            df_mat = create_df(data.get("materials", []))
            df_mat.to_excel(writer, index=False, sheet_name="Materials")

            df_vend = create_df(data.get("vendors", []))
            df_vend.to_excel(writer, index=False, sheet_name="Vendors")
            
            # --- THE FIX: Use the new specialized function for dumping sites ---
            df_dump = create_dumping_site_df(data.get("dumping_sites", []))
            df_dump.to_excel(writer, index=False, sheet_name="DumpingSites")

        file_url = f"{NGROK_BASE_URL}/storage/{ts_date_str}/{file_name}"

        new_file = models.TimesheetFile(
            timesheet_id=ts.id,
            file_path=file_url,
            foreman_id=ts.foreman_id,
        )
        db.add(new_file)
        db.commit()

    except Exception as e:
        print(f"❌ Excel generation/recording failed: {e}")

    return ts





# -------------------------------
# SEND a timesheet
# -------------------------------
from datetime import datetime


@router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")


    ts.sent = True
    ts.sent_date = datetime.utcnow()  # mark the foreman send time
    ts.status = "sent"


    # Add workflow entry
    workflow = models.TimesheetWorkflow(
        timesheet_id=ts.id,
        foreman_id=ts.foreman_id,
        supervisor_id=None,
        action="sent",
        timestamp=datetime.utcnow()
    )
    db.add(workflow)
    db.commit()
    db.refresh(ts)
    return ts




# -------------------------------
# DELETE a timesheet
# -------------------------------
@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    db.delete(ts)
    db.commit()
    return
# In your routers/timesheet.py


@router.get("/", response_model=List[schemas.TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db)):
    """
    Returns a list of all timesheets with foreman names and job names included.
    This is optimized for the admin dashboard view.
    """
    timesheets = db.query(models.Timesheet).options(joinedload(models.Timesheet.foreman)).all()
    
    response = []
    for ts in timesheets:
        foreman_name = f"{ts.foreman.first_name} {ts.foreman.last_name}" if ts.foreman else "N/A"
        
        # Create the response object, ensuring all required fields are present
        response.append(schemas.TimesheetResponse(
            id=ts.id,
            date=ts.date,
            foreman_id=ts.foreman_id,
            foreman_name=foreman_name,
            job_name=ts.timesheet_name,  # <-- The FIX: Populate the required 'job_name' field
            data=ts.data,
            status=ts.status
        ))
        
    return response
from sqlalchemy import or_

@router.get("/drafts/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
def get_draft_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
    """
    Returns all draft/pending timesheets for a given foreman.
    This is used by the new ReviewTimesheetScreen.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.foreman_id == foreman_id)
        .filter(or_(models.Timesheet.status == 'Pending', models.Timesheet.status == 'draft'))
        .order_by(models.Timesheet.date.desc())
        .all()
    )
    return timesheets
@router.post("/timesheets/save-draft/")
def save_draft(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """
    Save a timesheet draft. Each save creates a new row.
    """
    new_ts = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        job_name=timesheet.job_name,
        date=datetime.utcnow(),
        status="draft",
        data=json.dumps(timesheet.data)  # store JSON as string
    )
    db.add(new_ts)
    db.commit()
    db.refresh(new_ts)
    return {"message": "Draft saved", "timesheet_id": new_ts.id}
@router.get("/timesheets/drafts/by-foreman/{foreman_id}")
def get_drafts(foreman_id: int, db: Session = Depends(get_db)):
    """
    Fetch all draft timesheets for a foreman
    """
    drafts = (
        db.query(models.Timesheet)
        .filter(models.Timesheet.foreman_id == foreman_id)
        .filter(models.Timesheet.status == "draft")
        .order_by(models.Timesheet.date.desc())
        .all()
    )
    # Convert JSON string to dict
    return [
        {**{"id": t.id, "job_name": t.job_name, "date": t.date}, **json.loads(t.data)}
        for t in drafts
    ]
