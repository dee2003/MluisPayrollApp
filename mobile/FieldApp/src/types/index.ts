// /src/types/index.ts

export interface User {
  id: number;
  username: string;
  role: 'foreman' | 'supervisor' | 'project_engineer' | 'admin';
}

// These interfaces now include an 'hours' field for the foreman to input
export interface EmployeeWorkLog {
  first_name: string;
  last_name: string;
  hours?: number; // Optional, as it will be added by the foreman
}

export interface EquipmentWorkLog {
  name: string;
  hours?: number; // Optional, as it will be added by the foreman
}

interface JobData {
  job_code: string;
  phase_codes: string[];
}

interface CrewData {
  employees: EmployeeWorkLog[];
  equipment: EquipmentWorkLog[];
  materials: { name: string }[];
  vendors: { name: string }[];
}

interface TimesheetData extends CrewData {
  job_name: string;
  job: JobData;
  time_of_day: string;
  weather: string;
  temperature: string;
  location: string;
  project_engineer: string;
}

export interface Timesheet {
  id: number;
  foreman_id: number;
  date: string;
  data: TimesheetData;
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected'; 
}
