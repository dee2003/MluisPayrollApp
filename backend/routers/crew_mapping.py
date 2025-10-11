# # In routers/crew_mapping.py

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from .. import schemas, crud
# from ..database import get_db

# router = APIRouter(
#     prefix="/api/crew-mapping",
#     tags=["Crew Mapping"],
# )

# @router.get("/{foreman_id}", response_model=schemas.CrewMappingResponse)
# def get_crew_mapping_details(foreman_id: int, db: Session = Depends(get_db)):
#     """
#     Retrieves the crew mapping for a foreman based on their ID.
#     """
#     mapping = crud.get_crew_mapping(db, foreman_id=foreman_id)

#     # --- MODIFIED ERROR CHECK ---
#     # Check if the mapping exists in the database.
#     # The crud function returns a dictionary; we can check if it's empty or lacks data.
#     if not mapping or not mapping.get("employees"):
#         # This custom detail will now appear in your browser's developer tools.
#         raise HTTPException(
#             status_code=404, 
#             detail=f"DATABASE_LOOKUP_FAILED: No crew mapping found for foreman with ID {foreman_id}."
#         )

#     return mapping
