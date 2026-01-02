// User and Authentication Types
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Seasonal' | 'Temporary' | 'On-Call';
export type ShiftType = 'First Shift' | 'Second Shift' | 'Third Shift';

export interface User {
  id: number;
  company_id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  employment_type: EmploymentType;
  shift_type: ShiftType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  company_name?: string;
  company_id?: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Shift/Attendance Types
export interface Shift {
  id: number;
  user_id: number;
  company_id: number;
  clock_in: string;
  clock_out?: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftWithUserInfo extends Shift {
  username: string;
  full_name: string;
  role: string;
}

export interface ClockOutRequest {
  notes?: string;
}

export interface ShiftReport {
  total_shifts: number;
  completed_shifts: number;
  active_shifts: number;
  total_hours: number;
  average_hours: number;
}

// API Response Types
export interface ApiError {
  error: string;
}

export interface ShiftsResponse {
  shifts: Shift[];
  count: number;
}

export interface ShiftsWithUserInfoResponse {
  shifts: ShiftWithUserInfo[];
  count: number;
  start_date: string;
  end_date: string;
}

export interface ReportResponse {
  report: ShiftReport;
  start_date: string;
  end_date: string;
}

export interface ClockInResponse {
  message: string;
  shift: Shift;
}

export interface ClockOutResponse {
  message: string;
  shift: Shift;
}

export interface ActiveShiftResponse {
  message?: string;
  shift: Shift | null;
}

// Employee Management Types
export interface EmployeeWithStats {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  employment_type: EmploymentType;
  shift_type: ShiftType;
  monthly_hours: number;
  is_active: boolean;
}

export interface EmployeesResponse {
  employees: EmployeeWithStats[];
  count: number;
}

export interface UpdateScheduleRequest {
  employment_type: EmploymentType;
  shift_type: ShiftType;
}

// Calendar Types
export interface AssignShiftRequest {
  user_id: number;
  clock_in: string;
  clock_out: string;
}

export interface UpdateShiftRequest {
  clock_in: string;
  clock_out: string;
}

export interface WeekShiftsResponse {
  shifts: ShiftWithUserInfo[];
  count: number;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
