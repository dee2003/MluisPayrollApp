export interface User {
  id: number;
  username: string;
  role: 'foreman' | 'supervisor' | 'project_engineer' | 'admin';
  token: string;
}

export type EmployeeWorkLog = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  hours_per_phase?: Record<string, number>;
  class_1?: string;   // Add this
  class_2?: string;   // Add this
  selected_class?: string; // Add this for dropdown selection
};


export interface EquipmentWorkLog {
  id: string; // Equipment ID
  name: string;
  hours_per_phase?: Record<string, number>;
}

// New interfaces for materials and vendors
export interface MaterialWorkLog {
  id: string; // Material ID
  name: string;
  hours_per_phase?: Record<string, number>;
}

export interface VendorWorkLog {
  id: string; // Vendor ID
  name: string;
  hours_per_phase?: Record<string, number>;
}

interface JobData {
  job_code: string;
  phase_codes: string[];
}

interface TimesheetData {
  job_name: string;
  job: JobData;
  project_engineer: string;
  location: string;
  time_of_day?: string;
  weather?: string;
  temperature?: string;
  shift?: string;
day?:string;
  employees: EmployeeWorkLog[];
  equipment: EquipmentWorkLog[];
  materials: MaterialWorkLog[];
  vendors: VendorWorkLog[];
}

export interface Timesheet {
  id: number;
  foreman_id: number;
  foreman_name: string;
  date: string;
  data: TimesheetData;
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected'; 
}
