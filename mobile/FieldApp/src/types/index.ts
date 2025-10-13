// /src/types/index.ts

export interface User {
  id: number;
  username: string;
  role: 'foreman' | 'supervisor' | 'project_engineer' | 'admin';
  token: string;
}

export interface EmployeeWorkLog {
  first_name: string;
  last_name: string;
  hours?: number;
}

export interface EquipmentWorkLog {
  name: string;
  hours?: number;
}

interface JobData {
  job_code: string;
  phase_codes: string[];
}

// --- FIX: Add missing fields here ---
interface TimesheetData {
  job_name: string;
  job: JobData;
  project_engineer: string;
  location: string;
  
  // Environmental data
  time_of_day?: string;
  weather?: string;
  temperature?: string;
  shift?: string;

  // Crew data
  employees: EmployeeWorkLog[];
  equipment: EquipmentWorkLog[];
  materials: { name: string }[];
  vendors: { name: string }[];
}

// --- FIX: Add foreman_name here ---
export interface Timesheet {
  id: number;
  foreman_id: number;
  foreman_name: string; // Add foreman_name to the top level
  date: string;
  data: TimesheetData;
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected'; 
}
