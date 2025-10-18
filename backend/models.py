from sqlalchemy import Column, Integer, String, Identity, ForeignKey, Boolean, Date,DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base
from datetime import date
from datetime import datetime
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import (
    Column, Integer, String, Identity, ForeignKey, Boolean, Date, DateTime, Float, Enum as SQLAlchemyEnum, JSON
)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    tickets = relationship("Ticket", back_populates="foreman", cascade="all, delete-orphan")
    # ✅ Cascade delete: delete all timesheets & crew mappings when user is deleted
    timesheets = relationship(
        "Timesheet",
        back_populates="foreman",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    crew_mappings = relationship(
        "CrewMapping",
        back_populates="foreman",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    assigned_jobs = relationship("ForemanJob", back_populates="foreman", cascade="all, delete-orphan")
class Ticket(Base):
    """SQLAlchemy model for the Ticket table."""
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    extracted_text = Column(String, index=True, nullable=False)
    # This line is the crucial addition
    image_path = Column(String, nullable=True)  # Path to the saved image file
    #owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    #owner = relationship("User", back_populates="tickets")
    foreman_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # date = Column(Date, nullable=False)
    sent = Column(Boolean, default=False) 
    reviewed_by_supervisor = Column(Boolean, default=False)
    status = Column(String, default="pending") 
    phase_code = Column(String, nullable=True)
    # Relationships
    foreman = relationship("User", back_populates="tickets")
    job_phase_id = Column(Integer, ForeignKey("job_phases.id"), nullable=True)
    job_phase = relationship("JobPhase")
class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, index=True)
    first_name = Column(String)
    middle_name = Column(String, nullable=True)
    last_name = Column(String)
    class_1 = Column(String)   # Class code field 1
    class_2 = Column(String)   # Class code field 2
    status = Column(String, default="Active")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    status = Column(String, default="Active")
    department = Column(String)
    # These are not defined as database columns
    category_number = Column(String, nullable=True)
    vin_number = Column(String, nullable=True)

# models.py (SQLAlchemy Model for PostgreSQL)
class JobPhase(Base):
    __tablename__ = "job_phases"

    id = Column(Integer, primary_key=True, index=True)
    job_code = Column(String, unique=True, index=True, nullable=False)
    contract_no = Column(String, nullable=False)
    job_description = Column(String, nullable=True)
    project_engineer = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    status = Column(String, default="Active")  # or use an Enum type
    phase_codes = Column(JSONB, nullable=False)

    assigned_foremen = relationship("ForemanJob", back_populates="job_phase", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, Identity(start=1, increment=1), primary_key=True)
    name = Column(String)
    status = Column(String, default="Active")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, Identity(start=1, increment=1), primary_key=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    status = Column(String, nullable=False)


class CrewMapping(Base):
    __tablename__ = "crew_mapping"

    id = Column(Integer, primary_key=True, index=True)
    foreman_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    employee_ids = Column(String)
    equipment_ids = Column(String)
    material_ids = Column(String)
    vendor_ids = Column(String)

    foreman = relationship("User", back_populates="crew_mappings")

from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, JSON

class Timesheet(Base):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    foreman_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timesheet_name = Column(String, nullable=True) 
    date = Column(Date, default=date.today)
    data = Column(JSON, nullable=True)
    sent = Column(Boolean, default=False)
    status = Column(String, default="pending")
    submission_id = Column(Integer, ForeignKey("daily_submissions.id"), nullable=True)
    reviewed_by_supervisor = Column(Boolean, default=False)
    sent_date = Column(DateTime, nullable=True)  # NEW

    # Relationships
    foreman = relationship("User", back_populates="timesheets")
    files = relationship("TimesheetFile", back_populates="timesheet", cascade="all, delete-orphan")
    workflow_entries = relationship("TimesheetWorkflow", back_populates="timesheet", cascade="all, delete-orphan")
    submission = relationship("DailySubmission", back_populates="timesheets")  # NEW

    job_phase_id = Column(Integer, ForeignKey("job_phases.id"), nullable=True)  # link directly
    job_phase = relationship("JobPhase")
class TimesheetFile(Base):
    __tablename__ = "timesheet_files"

    id = Column(Integer, primary_key=True, index=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id"), nullable=False)
    foreman_id = Column(Integer, nullable=False)  # Add this field
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    timesheet = relationship("Timesheet", back_populates="files")
class TimesheetWorkflow(Base):
    __tablename__ = "timesheet_workflow"

    id = Column(Integer, primary_key=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"))
    foreman_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    action = Column(String)   # 'sent', 'reviewed', 'approved', etc.
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    timesheet = relationship("Timesheet", back_populates="workflow_entries")
    foreman = relationship("User", foreign_keys=[foreman_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])

class SubmissionStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
class DailySubmission(Base):
    __tablename__ = "daily_submissions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    foreman_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # job_phase_id = Column(Integer, ForeignKey("job_phases.id"), nullable=False)

    # job_phase_id = Column(Integer, ForeignKey("job_phases.id"), nullable=True)  # <- Add this
    job_code = Column(String, nullable=True)


    # total_hours = Column(Float, default=0.0)
    ticket_count = Column(Integer, default=0)
    status = Column(SQLAlchemyEnum(SubmissionStatus), default=SubmissionStatus.PENDING_REVIEW, nullable=False)

    # Relationships
    foreman = relationship("User", foreign_keys=[foreman_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    # job_phase = relationship("JobPhase")
    timesheets = relationship("Timesheet", back_populates="submission")






class ForemanJob(Base):
    __tablename__ = "foreman_jobs"

    id = Column(Integer, primary_key=True, index=True)
    foreman_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    job_phase_id = Column(Integer, ForeignKey("job_phases.id", ondelete="CASCADE"))

    # Relationships
    foreman = relationship("User", back_populates="assigned_jobs")
    job_phase = relationship("JobPhase", back_populates="assigned_foremen")


# from sqlalchemy import Column, Integer, ForeignKey, Date, Float, Enum as SQLAlchemyEnum
# from sqlalchemy.orm import relationship
# import enum

# class SubmissionStatus(str, enum.Enum):
#     PENDING_REVIEW = "PENDING_REVIEW"
#     APPROVED = "APPROVED"
#     CHANGES_REQUESTED = "CHANGES_REQUESTED"

# class DailySubmission(Base):
#     __tablename__ = "daily_submissions"

#     id = Column(Integer, primary_key=True, index=True)
#     date = Column(Date, nullable=False, index=True)
#     foreman_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     job_phase_id = Column(Integer, ForeignKey("job_phases.id"), nullable=False)

    
#     ticket_count = Column(Integer, default=0)  # Optional: count of tickets
#     status = Column(SQLAlchemyEnum(SubmissionStatus), default=SubmissionStatus.PENDING_REVIEW, nullable=False)

#     # Relationships to easily access linked objects
#     foreman = relationship("User")
#     job_phase = relationship("JobPhase")
#     timesheets = relationship("Timesheet", back_populates="submission")
   
