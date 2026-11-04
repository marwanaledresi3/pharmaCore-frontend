import { PaginatedResult, User } from '../types';
import { request, normalizeList } from './client';
export const usersApi = {
  list: async (params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<User>> => {
    const res = await request('/users', { params });
    return normalizeList<User>(res);
  },

  create: async (data: { name: string; email: string; password: string; role_id?: string; branch_id?: string }): Promise<User> => {
    return request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    return request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  toggleActive: async (id: string, is_active: boolean): Promise<User> => {
    return request<User>(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
  },

  resetPassword: async (id: string, password: string) => {
    return request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
  },

  remove: async (id: string) => {
    return request(`/users/${id}`, { method: 'DELETE' });
  },
};