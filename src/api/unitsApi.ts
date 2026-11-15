import { request } from './client';

export interface Unit {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UnitPayload {
  code: string;
  name: string;
  name_en?: string | null;
}

export const unitsApi = {
  list: async (params?: { search?: string; is_active?: boolean }): Promise<Unit[]> => {
    return request<Unit[]>('/units', { params });
  },

  getById: async (id: string): Promise<Unit> => {
    return request<Unit>(`/units/${id}`);
  },

  create: async (data: UnitPayload): Promise<Unit> => {
    return request<Unit>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<UnitPayload & { is_active: boolean }>): Promise<Unit> => {
    return request<Unit>(`/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  remove: async (id: string): Promise<{ id: string }> => {
    return request<{ id: string }>(`/units/${id}`, { method: 'DELETE' });
  },
};