import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ClockOutRequest,
  ClockInResponse,
  ClockOutResponse,
  ShiftsResponse,
  ActiveShiftResponse,
  ShiftsWithUserInfoResponse,
  ReportResponse,
  ApiError,
  EmployeesResponse,
  UpdateScheduleRequest,
  AssignShiftRequest,
  UpdateShiftRequest,
  WeekShiftsResponse,
  ShiftFilters,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiService {
  private client: AxiosInstance;

  // Helper function to convert ShiftFilters to query parameters
  private buildFilterParams(filters?: ShiftFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.userIds && filters.userIds.length > 0) {
      params.user_ids = filters.userIds.join(',');
    }
    if (filters.roles && filters.roles.length > 0) {
      params.roles = filters.roles.join(',');
    }
    if (filters.statuses && filters.statuses.length > 0) {
      params.statuses = filters.statuses.join(',');
    }
    if (filters.notesSearch) {
      params.notes_search = filters.notesSearch;
    }
    if (filters.clockInFrom) {
      params.clock_in_from = filters.clockInFrom;
    }
    if (filters.clockInTo) {
      params.clock_in_to = filters.clockInTo;
    }
    if (filters.clockOutFrom) {
      params.clock_out_from = filters.clockOutFrom;
    }
    if (filters.clockOutTo) {
      params.clock_out_to = filters.clockOutTo;
    }
    if (filters.durationMinHours !== undefined) {
      params.duration_min_hours = filters.durationMinHours;
    }
    if (filters.durationMinMins !== undefined) {
      params.duration_min_mins = filters.durationMinMins;
    }
    if (filters.durationMaxHours !== undefined) {
      params.duration_max_hours = filters.durationMaxHours;
    }
    if (filters.durationMaxMins !== undefined) {
      params.duration_max_mins = filters.durationMaxMins;
    }

    return params;
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  }

  // Attendance - Employee endpoints
  async clockIn(): Promise<ClockInResponse> {
    const response = await this.client.post<ClockInResponse>('/api/attendance/clock-in');
    return response.data;
  }

  async clockOut(data: ClockOutRequest): Promise<ClockOutResponse> {
    const response = await this.client.post<ClockOutResponse>('/api/attendance/clock-out', data);
    return response.data;
  }

  async getMyShifts(limit = 50, offset = 0, filters?: ShiftFilters): Promise<ShiftsResponse> {
    const filterParams = this.buildFilterParams(filters);
    const response = await this.client.get<ShiftsResponse>('/api/attendance/my-shifts', {
      params: { limit, offset, ...filterParams },
    });
    return response.data;
  }

  async getActiveShift(): Promise<ActiveShiftResponse> {
    const response = await this.client.get<ActiveShiftResponse>('/api/attendance/active-shift');
    return response.data;
  }

  // Attendance - Manager/Admin endpoints
  async getAllShifts(
    startDate?: string,
    endDate?: string,
    limit = 100,
    offset = 0,
    filters?: ShiftFilters
  ): Promise<ShiftsWithUserInfoResponse> {
    const filterParams = this.buildFilterParams(filters);
    const response = await this.client.get<ShiftsWithUserInfoResponse>('/api/attendance/shifts', {
      params: { start_date: startDate, end_date: endDate, limit, offset, ...filterParams },
    });
    return response.data;
  }

  async getReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const response = await this.client.get<ReportResponse>('/api/attendance/report', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  // Employee Management - Manager/Admin endpoints
  async getEmployees(): Promise<EmployeesResponse> {
    const response = await this.client.get<EmployeesResponse>('/api/attendance/employees');
    return response.data;
  }

  async updateEmployeeSchedule(employeeId: number, data: UpdateScheduleRequest): Promise<void> {
    await this.client.put(`/api/attendance/employees/schedule?id=${employeeId}`, data);
  }

  // Calendar - Week shifts
  async getWeekShifts(weekStart: string): Promise<WeekShiftsResponse> {
    const response = await this.client.get<WeekShiftsResponse>('/api/attendance/shifts/week', {
      params: { week_start: weekStart },
    });
    return response.data;
  }

  async assignShift(data: AssignShiftRequest): Promise<void> {
    await this.client.post('/api/attendance/shifts/assign', data);
  }

  async updateShift(shiftId: number, data: UpdateShiftRequest): Promise<void> {
    await this.client.put(`/api/attendance/shifts/update?id=${shiftId}`, data);
  }

  async deleteShift(shiftId: number): Promise<void> {
    await this.client.delete(`/api/attendance/shifts/delete?id=${shiftId}`);
  }

  // Error helper
  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      return axiosError.response?.data?.error || 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  }
}

export const api = new ApiService();
