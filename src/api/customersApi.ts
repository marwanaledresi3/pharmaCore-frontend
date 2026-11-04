import { request, normalizeList } from './client';
import { Customer, PaginatedResult } from '../types';

export const customersApi = {
  list: async (params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<Customer>> => {
    const res = await request('/customers', { params });
    return normalizeList<Customer>(res);
  },

  getOne: async (id: string): Promise<Customer> => {
    return request<Customer>(`/customers/${id}`);
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
