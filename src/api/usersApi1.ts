import { request, normalizeList } from './client';

export interface UserRole {
  id: string;
  name: string;
}

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  branch_id?: string | null;
  branch_name?: string | null;
  roles?: UserRole[];
  created_at?: string;
  updated_at?: string;
}

export interface UserListParams {
  is_active?: boolean;
  branch_id?: string | null;
  user_type?: 'internal' | 'external';
  search?: string;
  sort?: 'name' | 'email' | 'is_active' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  branch_id?: string | null;
  is_active?: boolean;
  role_ids?: string[];
}

export const usersApi = {
  list: async (params?: UserListParams) => {
    const res = await request('/users', { params });
    return normalizeList<User>(res);
  },
  getOne: (id: string) => request<User>(`/users/${id}`),
  create: (data: UserInput) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<UserInput>) =>
    request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setActive: (id: string, is_active: boolean) =>
    request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),
  setPassword: (id: string, password: string) =>
    request(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
  setRoles: (id: string, role_ids: string[]) =>
    request(`/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ role_ids }),
    }),
  remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
};