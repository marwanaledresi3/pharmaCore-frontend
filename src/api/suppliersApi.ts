import { request, normalizeList } from './client';
import { Supplier, PaginatedResult } from '../types';

export const suppliersApi = {
  list: async (params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<Supplier>> => {
    const res = await request('/suppliers', { params });
    return normalizeList<Supplier>(res);
  },

  getOne: async (id: string): Promise<Supplier> => {
    return request<Supplier>(`/suppliers/${id}`);
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    return request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    return request<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};
