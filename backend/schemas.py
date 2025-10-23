from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import Optional, List, Any, Dict
from datetime import date
from datetime import date, datetime
from .models import SubmissionStatus

# --- Shared Pydantic v2 config ---
model_config = ConfigDict(from_attributes=True)

# ===============================
#         GENERIC
# ===============================
class DeleteResponse(BaseModel):
    ok: bool

# ===============================
#         USERS
# ===============================
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = model_config

# ===============================
#         EMPLOYEES
# ===============================
class EmployeeBase(BaseModel):
    id: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    class_1: Optional[str] = None   # Must match ORM and API
    class_2: Optional[str] = None
    status: str


class EmployeeCreate(EmployeeBase): 
    pass

class Employee(EmployeeBase):
    model_config = model_config

# ===============================
#         EQUIPMENT
# ===============================
class EquipmentBase(BaseModel):
    id: str
    name: str
    type: str
    status: str
    department: Optional[str] = None
    category_number: Optional[str] = None
    vin_number: Optional[str] = None

class EquipmentCreate(EquipmentBase): 
    pass

class Equipment(EquipmentBase):
    model_config = model_config
class EquipmentUpdate(EquipmentBase):
    pass
class EquipmentInDB(EquipmentBase):
    class Config:
        orm_mode = True
# ===============================
#         MATERIALS
# ===============================
class MaterialBase(BaseModel):
    name: str
    status: Optional[str] = "Active"

class MaterialCreate(MaterialBase): 
    pass

class Material(MaterialBase):
    id: int
    model_config = model_config

# ===============================
#         VENDORS
# ===============================
class VendorBase(BaseModel):
    name: str
    unit: str
    status: str

class VendorCreate(VendorBase): 
    pass

class Vendor(VendorBase):
    id: int
    model_config = model_config

# ===============================
#         JOB PHASES
# ===============================
class JobPhaseBase(BaseModel):
    job_code: str
    contract_no: Optional[str] = None
    job_description: Optional[str] = None
    project_engineer: Optional[str] = None
    jurisdiction: Optional[str] = None
    status: str = "Active"
    phase_codes: List[str] = []

class JobPhaseCreate(JobPhaseBase):
    pass

class JobPhaseUpdate(BaseModel):
    contract_no: Optional[str] = None
    job_description: Optional[str] = None
    project_engineer: Optional[str] = None
    jurisdiction: Optional[str] = None
    status: Optional[str] = None
    phase_codes: Optional[List[str]] = None

class JobPhase(JobPhaseBase):
    id: int
    model_config = model_config
class DumpingSiteBase(BaseModel):
    id: str
    name: str
    status: str = "Active"

class DumpingSiteCreate(DumpingSiteBase):
    pass

class DumpingSiteUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class DumpingSite(DumpingSiteBase):
    class Config:
        orm_mode = True
# ===============================
#         CREW MAPPING
# ===============================
class CrewMappingCreate(BaseModel):
    foreman_id: int
    employee_ids: List[str]
    equipment_ids: List[str]
    material_ids: Optional[List[int]] = []
    vendor_ids: Optional[List[int]] = []
    dumping_site_ids: Optional[List[int]] = []  # ✅ ADD THIS LINE

class CrewMapping(BaseModel):
    id: int
    foreman_id: Optional[int] = None
    employee_ids: List[str]
    equipment_ids: List[str]
    material_ids: List[int]
    vendor_ids: List[int]
    dumping_site_ids: List[str] = []

    model_config = model_config


    @field_validator(
        'employee_ids', 'equipment_ids', 'material_ids', 'vendor_ids', 'dumping_site_ids',
        mode='before'
    )
    @classmethod
    def ensure_list(cls, v, info) -> List[Any]:
        if v is None:
            return []
        int_fields = ['material_ids', 'vendor_ids']
        is_int_field = info.field_name in int_fields

        # If already a list, cast items
        if isinstance(v, list):
            return [int(item) if is_int_field else str(item) for item in v]

        # If string (CSV), split into list
        if isinstance(v, str):
            items = []
            for item in v.split(','):
                item = item.strip()
                if not item:
                    continue
                try:
                    items.append(int(item) if is_int_field else str(item))
                except (ValueError, TypeError):
                    continue
            return items

        # If single int or str, wrap in list
        return [int(v)] if is_int_field else [str(v)]
        
class CrewMappingResponse(BaseModel):
    foreman_id: Optional[int] = None
    employees: List[Employee]
    equipment: List[Equipment]
    materials: List[Material]
    vendors: List[Vendor]
    dumping_sites: List[DumpingSite] = []

    model_config = model_config

# ===============================
#         TIMESHEETS
# ===============================
class TimesheetJobData(BaseModel):
    job_code: str
    phase_codes: List[str]

class CrewData(BaseModel):
    employees: Optional[List[Any]] = []
    equipment: Optional[List[Any]] = []
    materials: Optional[List[Any]] = []
    vendors: Optional[List[Any]] = []

class TimesheetNestedData(BaseModel):
    job: TimesheetJobData
    employees: Optional[List[Any]] = []
    equipment: Optional[List[Any]] = []
    materials: Optional[List[Any]] = []
    vendors: Optional[List[Any]] = []

class TimesheetBase(BaseModel):
    foreman_id: int
    date: date
    data: Dict[str, Any]

class TimesheetCreate(TimesheetBase):
    status: str = "Pending"
    job_phase_id: Optional[int] = None



class TimesheetUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
class TimesheetFileBase(BaseModel):
    file_path: str
class TimesheetFile(BaseModel):
    id: int
    timesheet_id: int
    foreman_id: int
    file_path: str
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
# In schemas.py

# In schemas.py

class Timesheet(BaseModel):
    id: int
    foreman_id: int
    date: date
    timesheet_name: Optional[str]
    data: Dict[str, Any]
    sent: bool                  # <-- ADD THIS FIELD
    status: str                 # <-- ADD THIS FIELD
    files: List[TimesheetFile] = []
    
    model_config = ConfigDict(from_attributes=True)




class TimesheetResponse(BaseModel):
    id: int
    date: date
    foreman_id: int
    foreman_name: str
    data: Dict[str, Any]
    sent: bool
    job_name: str
    model_config = model_config


# ===============================
#         APP DATA
# ===============================
class AppData(BaseModel):
    users: List[User]
    employees: List[Employee]
    equipment: List[Equipment]
    job_phases: List[JobPhase]
    materials: List[Material]
    vendors: List[Vendor]

class LoginRequest(BaseModel):
    username: str
    password: str
class DailySubmissionBase(BaseModel):
    date: date
    foreman_id: int
    job_code: Optional[str] = None
    total_hours: float
    ticket_count: int
    status: SubmissionStatus
class DailySubmission(DailySubmissionBase):
    id: int
    
    # Denormalized read-only fields for the supervisor dashboard
    foreman_name: str
    job_name: Optional[str] = None  # optional convenience if you resolve job name server-side

    class Config:
        from_attributes = True  # pydantic v2; use orm_mode=True for pydantic v1
class DailySubmissionCreate(BaseModel):
    date: date
    timesheet_ids: List[int]
    ticket_ids: List[int] = []      # if you have tickets
    job_code: Optional[str] = None  # optional


# For supervisor requesting changes
class RequestChanges(BaseModel):
    note: str
# C:\admin_webpage\backend\schemas.py

# ... (keep all your existing imports and schemas)
from datetime import date
from typing import List, Optional

# ===============================
#     	SUPERVISOR REVIEW
# ===============================

class Notification(BaseModel):
    """Data for each foreman card on the supervisor dashboard."""
    id: int
    foreman_id: int
    foreman_name: str
    foreman_email: str
    date: date
    ticket_count: int
    timesheet_count: int
    job_code: Optional[str] = None

class UnreviewedItem(BaseModel):
    """Details of items blocking submission."""
    foreman_name: str
    count: int

class ValidationResponse(BaseModel):
    """Response for the pre-submission status check."""
    can_submit: bool
    unreviewed_timesheets: List[UnreviewedItem] = []
    incomplete_tickets: List[UnreviewedItem] = []

# class TicketSummary(BaseModel):
#     """Schema for listing tickets."""
#     id: int
#     ticket_number: Optional[str] = None
#     job_name: Optional[str] = None

#     class Config:
#         from_attributes = True
class TicketSummary(BaseModel):
    id: int
    image_path: str | None = None
    job_code: Optional[str] = None
    phase_code: str | None = None
    

    class Config:
        from_attributes = True


class TimesheetSummary(BaseModel):
    id: int
    foreman_id: int
    date: str
    

    class Config:
        orm_mode = True

class SubmissionDataResponse(BaseModel):
    tickets: List[TicketSummary]
    timesheets: List[TimesheetSummary]


from datetime import date
from typing import Optional

class PENotification(BaseModel):
    id: int
    supervisor_id: int
    supervisor_name: str
    date: date
    job_code: Optional[str]
    timesheet_count: int
    ticket_count: int
from datetime import date
from typing import Optional
class PENotification(BaseModel):
    id: int
    supervisor_id: int
    supervisor_name: str
    date: date
    job_code: Optional[str]
    timesheet_count: int
    ticket_count: int
