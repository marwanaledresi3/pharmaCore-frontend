import { request } from './client';
import { User, Company } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterCompanyPayload {
  company: {
    name: string;
    name_english: string;
    currency_code: string;
    tax_number?: string;
    address?: string;
    logo_url?: string;
  };
  owner: {
    name: string;
    email: string;
    password: string;
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  registerCompany: async (payload: RegisterCompanyPayload) => {
    return request('/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  changePassword: async (current_password: string, new_password: string) => {
    return request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  externalLogin: async (email: string, password: string) => {
    return request('/auth/external-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },
};
