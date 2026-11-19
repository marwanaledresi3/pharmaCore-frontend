// api/hr/jobTitlesApi.ts
import { request } from '../client';
import { JobTitle } from '../../types/hr';

export const jobTitlesApi = {
  list: async (): Promise<JobTitle[]> => {
    const res = await request<JobTitle[]>('/job-titles');
    return Array.isArray(res) ? res : [];
  },

  getOne: async (id: string): Promise<JobTitle> => {
    return request<JobTitle>(`/job-titles/${id}`);
  },

  create: async (data: Partial<JobTitle>): Promise<JobTitle> => {
    return request<JobTitle>('/job-titles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<JobTitle>): Promise<JobTitle> => {
    return request<JobTitle>(`/job-titles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/job-titles/${id}`, { method: 'DELETE' });
  },
};