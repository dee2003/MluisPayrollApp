from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import Optional, List, Any, Dict
from datetime import date
from datetime import date, datetime

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

class EquipmentCreate(EquipmentBase): 
    pass

class Equipment(EquipmentBase):
    model_config = model_config

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

# ===============================
#         CREW MAPPING
# ===============================
class CrewMappingCreate(BaseModel):
    foreman_id: int
    employee_ids: List[str]
    equipment_ids: List[str]
    material_ids: Optional[List[int]] = []
    vendor_ids: Optional[List[int]] = []

class CrewMapping(BaseModel):
    id: int
    foreman_id: Optional[int] = None
    employee_ids: List[str]
    equipment_ids: List[str]
    material_ids: List[int]
    vendor_ids: List[int]
    model_config = model_config

    @field_validator('employee_ids', 'equipment_ids', 'material_ids', 'vendor_ids', mode='before')
    @classmethod
    def split_string_to_list(cls, v: Any, info) -> List[Any]:
        if not isinstance(v, str):
            return v
        is_int_field = info.field_name in ['material_ids', 'vendor_ids']
        items = []
        for item in v.split(','):
            item = item.strip()
            if not item:
                continue
            try:
                items.append(int(item) if is_int_field else item)
            except (ValueError, TypeError):
                continue
        return items

class CrewMappingResponse(BaseModel):
    foreman_id: Optional[int] = None
    employees: List[Employee]
    equipment: List[Equipment]
    materials: List[Material]
    vendors: List[Vendor]
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
class Timesheet(BaseModel):
    id: int
    foreman_id: int
    date: date
    timesheet_name: Optional[str]
    data: Dict[str, Any]
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
