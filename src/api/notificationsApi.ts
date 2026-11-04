import { request, normalizeList } from './client';
import { NotificationItem, PaginatedResult } from '../types';

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; type?: string; page?: number; limit?: number }): Promise<PaginatedResult<NotificationItem>> => {
    const res = await request('/notifications', { params });
    return normalizeList<NotificationItem>(res);
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return request<{ count: number }>('/notifications/unread-count');
  },

  markRead: async (id: string) => {
    return request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead: async () => {
    return request('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  remove: async (id: string) => {
    return request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  scan: async () => {
    return request('/notifications/scan', {
      method: 'POST',
    });
  },
};
