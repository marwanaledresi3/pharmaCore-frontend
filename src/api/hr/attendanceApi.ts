// api/hr/attendanceApi.ts
import { request, normalizeList } from '../client';
import { AttendanceRecord } from '../../types/hr';
import { PaginatedResult } from '../../types';

export interface AttendanceListParams {
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CheckInOutPayload {
  employee_id: string;
  work_date: string;
  notes?: string;
}

export interface UpsertAttendancePayload {
  employee_id: string;
  work_date: string;
  check_in?: string | null;
  check_out?: string | null;
  status?: string;
  notes?: string;
}

export const attendanceApi = {
  list: async (params?: AttendanceListParams): Promise<PaginatedResult<AttendanceRecord>> => {
    const res = await request('/attendance', { params });
    return normalizeList<AttendanceRecord>(res);
  },

  getOne: async (id: string): Promise<AttendanceRecord> => {
    return request<AttendanceRecord>(`/attendance/${id}`);
  },

  checkIn: async (payload: CheckInOutPayload): Promise<AttendanceRecord> => {
    return request<AttendanceRecord>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  checkOut: async (payload: CheckInOutPayload): Promise<AttendanceRecord> => {
    return request<AttendanceRecord>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  upsert: async (payload: UpsertAttendancePayload): Promise<AttendanceRecord> => {
    return request<AttendanceRecord>('/attendance', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/attendance/${id}`, { method: 'DELETE' });
  },
};