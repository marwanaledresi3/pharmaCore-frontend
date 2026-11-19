// api/settingsApi.ts
import { request } from './client';

export interface HrJobsStatus {
  enabled: boolean;
  schedule: string;
  month: number;
  day: number;
  hour: number;
  carry_over: boolean;
  next_run: string;
}

export const settingsApi = {
  // ─── CRUD ───────────────────────────────────────────────
  getAll: async (): Promise<Record<string, any>> => {
    return request('/settings');
  },

  getOne: async (key: string): Promise<{ key: string; value: any }> => {
    return request(`/settings/${key}`);
  },

  updateOne: async (key: string, value: any): Promise<{ key: string; value: any }> => {
    return request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  updateMany: async (settings: Record<string, any>): Promise<{ updated: string[] }> => {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  delete: async (key: string): Promise<{ success: boolean }> => {
    return request(`/settings/${key}`, { method: 'DELETE' });
  },

  // ─── HR Jobs ───────────────────────────────────────────
  reloadHrJobs: async (): Promise<{ success: boolean; message: string }> => {
    return request('/settings/reload-hr-jobs', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  hrJobsStatus: async (): Promise<HrJobsStatus> => {
    return request('/settings/hr-jobs-status');
  },
};