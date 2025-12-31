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
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiService {
  private client: AxiosInstance;

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

  async getMyShifts(limit = 50, offset = 0): Promise<ShiftsResponse> {
    const response = await this.client.get<ShiftsResponse>('/api/attendance/my-shifts', {
      params: { limit, offset },
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
    offset = 0
  ): Promise<ShiftsWithUserInfoResponse> {
    const response = await this.client.get<ShiftsWithUserInfoResponse>('/api/attendance/shifts', {
      params: { start_date: startDate, end_date: endDate, limit, offset },
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
