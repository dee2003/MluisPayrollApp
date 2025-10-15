from sqlalchemy import Column, Integer, String, Identity, ForeignKey, Boolean, Date,DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base
from datetime import date
from datetime import datetime

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

    # Relationships
    foreman = relationship("User", back_populates="tickets")

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

    # Relationships
    foreman = relationship("User", back_populates="timesheets")
    files = relationship("TimesheetFile", back_populates="timesheet", cascade="all, delete-orphan")
    workflow_entries = relationship("TimesheetWorkflow", back_populates="timesheet", cascade="all, delete-orphan")

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

