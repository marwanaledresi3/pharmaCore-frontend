import { request, normalizeList } from './client';
import { Company, User, Currency, ExchangeRate, PaginatedResult } from '../types';

export const companyApi = {
  // === Company Profile & Settings ===
  getCurrent: async (): Promise<Company> => {
    return request<Company>('/companies/current');
  },

  updateCurrent: async (data: Partial<Company>): Promise<Company> => {
    return request<Company>('/companies/current', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  updateLogo: async (file: File): Promise<Company> => {
   const formData = new FormData();
  formData.append('logo', file);

  return request<Company>('/companies/logo', {
    method: 'PUT',
    body: formData,
  });
},

  getSettings: async (): Promise<Record<string, any>> => {
    return request<Record<string, any>>('/companies/settings');
  },

  updateSettings: async (settings: Record<string, any>) => {
    return request('/companies/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  changeBaseCurrency: async (currencyId: string) => {
    return request('/companies/change-currency', {
      method: 'POST',
      body: JSON.stringify({ currency_id: currencyId }),
    });
  },

  createExternalUser: async (data: {
    user_type: 'customer' | 'supplier';
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    tax_number?: string;
    credit_limit?: number;
  }) => {
    return request('/companies/external-users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === Users Management ===
  listUsers: async (params?: { page?: number; limit?: number }): Promise<PaginatedResult<User>> => {
    const res = await request('/users', { params });
    return normalizeList<User>(res);
  },

  getUser: async (id: string): Promise<User> => {
    return request<User>(`/users/${id}`);
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role_ids?: string[];
  }): Promise<User> => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changeUserPassword: async (id: string, password: string) => {
    return request(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },

  setUserStatus: async (id: string, is_active: boolean) => {
    return request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  },

  assignUserRoles: async (id: string, role_ids: string[]) => {
    return request(`/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ role_ids }),
    });
  },

  deleteUser: async (id: string) => {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // === Roles & Permissions ===
  listRoles: async () => {
    const res = await request('/roles');
    return normalizeList<any>(res).items;
  },

  listPermissions: async () => {
    const res = await request('/roles/permissions');
    return normalizeList<any>(res).items;
  },

  createRole: async (name: string, permission_ids: string[] = []) => {
    return request('/roles', {
      method: 'POST',
      body: JSON.stringify({ name, permission_ids }),
    });
  },

  assignRolePermissions: async (roleId: string, permission_ids: string[]) => {
    return request(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids }),
    });
  },

  deleteRole: async (roleId: string) => {
    return request(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  // === Currencies ===
  listCurrencies: async (): Promise<Currency[]> => {
    const res = await request('/currencies');
    const normalized = normalizeList<Currency>(res);
    return normalized.items;
  },

  createCurrency: async (data: { code: string; name: string; symbol?: string }): Promise<Currency> => {
    return request<Currency>('/currencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  convertCurrency: async (data: { amount: number; currency_id: string; as_of_date?: string }) => {
    return request('/currencies/convert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === Exchange Rates ===
  listExchangeRates: async (params?: { currency_id?: string; date_from?: string; date_to?: string }): Promise<ExchangeRate[]> => {
    const res = await request('/exchange-rates', { params });
    const normalized = normalizeList<ExchangeRate>(res);
    return normalized.items;
  },

  getCurrentExchangeRate: async (currency_id: string, as_of_date?: string): Promise<{ rate: number }> => {
    return request('/exchange-rates/current', {
      params: { currency_id, as_of_date },
    });
  },

  createExchangeRate: async (data: { currency_id: string; rate: number; rate_date?: string }) => {
    return request('/exchange-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
