// api/hr/leavesApi.ts
import { request, normalizeList } from '../client';
import { LeaveType, LeaveRequest, LeaveBalance } from '../../types/hr';

// ═══════════════════════════════════════════════════════════════════════════
// Leave Types
// ═══════════════════════════════════════════════════════════════════════════
export const leaveTypesApi = {
  list: async (params?: { is_active?: boolean }): Promise<LeaveType[]> => {
    const res = await request<LeaveType[]>('/leave-types', { params });
    return Array.isArray(res) ? res : [];
  },

  getOne: async (id: string): Promise<LeaveType> => {
    return request<LeaveType>(`/leave-types/${id}`);
  },

  create: async (data: Partial<LeaveType>): Promise<LeaveType> => {
    return request<LeaveType>('/leave-types', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id: string, data: Partial<LeaveType>): Promise<LeaveType> => {
    return request<LeaveType>(`/leave-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/leave-types/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Leave Requests
// ═══════════════════════════════════════════════════════════════════════════
export interface LeaveRequestListParams {
  employee_id?: string;
  leave_type_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeaveRequestPayload {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export const leaveRequestsApi = {
  list: async (params?: LeaveRequestListParams): Promise<{ items: LeaveRequest[]; pagination: any }> => {
    const res = await request('/leave-requests', { params });
    return normalizeList<LeaveRequest>(res) as any;
  },

  getOne: async (id: string): Promise<LeaveRequest> => {
    return request<LeaveRequest>(`/leave-requests/${id}`);
  },

  create: async (payload: CreateLeaveRequestPayload): Promise<LeaveRequest> => {
    return request<LeaveRequest>('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  approve: async (id: string): Promise<LeaveRequest> => {
    return request<LeaveRequest>(`/leave-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
  },

  reject: async (id: string, rejection_reason?: string): Promise<LeaveRequest> => {
    return request<LeaveRequest>(`/leave-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  },

  cancel: async (id: string, cancel_reason?: string): Promise<LeaveRequest> => {
    return request<LeaveRequest>(`/leave-requests/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancel_reason }),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/leave-requests/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Leave Balances
// ═══════════════════════════════════════════════════════════════════════════
export const leaveBalancesApi = {
  list: async (params?: { employee_id?: string; leave_type_id?: string; year?: number }): Promise<LeaveBalance[]> => {
    const res = await request<LeaveBalance[]>('/leave-balances', { params });
    return Array.isArray(res) ? res : [];
  },

  byEmployee: async (employeeId: string, year?: number): Promise<LeaveBalance[]> => {
    const res = await request<LeaveBalance[]>(`/leave-balances/employee/${employeeId}`, { params: { year } });
    return Array.isArray(res) ? res : [];
  },

  create: async (data: {
    employee_id: string;
    leave_type_id: string;
    year: number;
    entitled_days?: number;
    used_days?: number;
    carried_days?: number;
  }): Promise<LeaveBalance> => {
    return request<LeaveBalance>('/leave-balances', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id: string, data: { entitled_days?: number; carried_days?: number }): Promise<LeaveBalance> => {
    return request<LeaveBalance>(`/leave-balances/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  resetForYear: async (employeeId: string, data: { year: number; carry_over?: boolean }): Promise<any> => {
    return request(`/leave-balances/reset/${employeeId}`, { method: 'POST', body: JSON.stringify(data) });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/leave-balances/${id}`, { method: 'DELETE' });
  },
};