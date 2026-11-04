import { request, normalizeList } from './client';
import type { Branch, PaginatedResult } from '../types';

export type BranchInput = {
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_name?: string | null;
  warehouse_id?: string | null;
  is_active?: boolean;
  is_main?: boolean;
};

export type BranchListParams = {
  is_active?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

export const branchesApi = {
  list: async (params?: BranchListParams): Promise<PaginatedResult<Branch>> => {
    const res = await request('/branches', { params });
    return normalizeList<Branch>(res);
  },
  getOne: async (id: string) => request<Branch>(`/branches/${id}`),
  create: async (data: BranchInput) =>
    request<Branch>('/branches', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<BranchInput>) =>
    request<Branch>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: async (id: string) =>
    request(`/branches/${id}`, { method: 'DELETE' }),
};