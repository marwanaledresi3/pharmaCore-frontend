// api/hr/employeesApi.ts
import { request, normalizeList } from '../client';
import { Employee, PaginatedResult } from '../../types/hr';

export interface EmployeeListParams {
  search?: string;
  status?: string;
  department_id?: string;
  page?: number;
  limit?: number;
}

export const employeesApi = {
  list: async (params?: EmployeeListParams): Promise<PaginatedResult<Employee>> => {
    const res = await request('/employees', { params });
    return normalizeList<Employee>(res);
  },

  getOne: async (id: string): Promise<Employee> => {
    return request<Employee>(`/employees/${id}`);
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    return request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/employees/${id}`, { method: 'DELETE' });
  },
};