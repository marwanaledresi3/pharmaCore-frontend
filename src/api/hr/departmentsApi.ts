// api/hr/departmentsApi.ts
import { request } from '../client';
import { Department } from '../../types/hr';

export interface DepartmentListParams {
  is_active?: boolean;
}

export const departmentsApi = {
  list: async (params?: DepartmentListParams): Promise<Department[]> => {
    const res = await request<Department[]>('/departments', { params });
    return Array.isArray(res) ? res : [];
  },

  getOne: async (id: string): Promise<Department> => {
    return request<Department>(`/departments/${id}`);
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    return request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    return request<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/departments/${id}`, { method: 'DELETE' });
  },
};