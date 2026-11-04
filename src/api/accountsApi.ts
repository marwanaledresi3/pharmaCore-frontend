import { request, normalizeList } from './client';
import { Account, JournalEntry, PaginatedResult } from '../types';

export const accountsApi = {
  // === Chart of Accounts ===
  getTree: async (): Promise<Account[]> => {
    return request<Account[]>('/accounts/tree');
  },

  list: async (params?: { type?: string; is_active?: boolean; search?: string }): Promise<Account[]> => {
    const res = await request('/accounts', { params });
    const normalized = normalizeList<Account>(res);
    return normalized.items;
  },

  listPostable: async (): Promise<Account[]> => {
    const res = await request('/accounts/postable');
    const normalized = normalizeList<Account>(res);
    return normalized.items;
  },

  getOne: async (id: string): Promise<Account> => {
    return request<Account>(`/accounts/${id}`);
  },

  getLedger: async (id: string, params?: { date_from?: string; date_to?: string }) => {
    return request(`/accounts/${id}/ledger`, { params });
  },

  create: async (data: { code: string; name: string; account_type: string; parent_id?: string | null }): Promise<Account> => {
    const body: any = {
      code: data.code.trim(),
      name: data.name.trim(),
      account_type: data.account_type,
    };
    if (data.parent_id) body.parent_id = data.parent_id;

    return request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update: async (id: string, data: Partial<Account>): Promise<Account> => {
    return request<Account>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return request(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  // === Journal Entries ===
  listJournalEntries: async (params?: {
    status?: 'draft' | 'posted';
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<JournalEntry>> => {
    const res = await request('/journal-entries', { params });
    return normalizeList<JournalEntry>(res);
  },

  getJournalEntry: async (id: string): Promise<JournalEntry> => {
    return request<JournalEntry>(`/journal-entries/${id}`);
  },

  createJournalEntry: async (data: {
    entry_date: string;
    description?: string;
    source_type?: string;
    source_id?: string;
    lines: Array<{
      account_id: string;
      debit?: number;
      credit?: number;
      description?: string;
    }>;
  }): Promise<JournalEntry> => {
    const body: any = {
      entry_date: data.entry_date.slice(0, 10),
      description: data.description || 'قيد يدوي',
      source_type: data.source_type || 'manual',
      lines: data.lines.map((l) => ({
        account_id: l.account_id,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description || '',
      })),
    };
    if (data.source_id) body.source_id = data.source_id;

    return request<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  postJournalEntry: async (id: string) => {
    return request(`/journal-entries/${id}/post`, {
      method: 'POST',
    });
  },

  unpostJournalEntry: async (id: string) => {
    return request(`/journal-entries/${id}/unpost`, {
      method: 'POST',
    });
  },

  deleteJournalEntry: async (id: string) => {
    return request(`/journal-entries/${id}`, {
      method: 'DELETE',
    });
  },

  getTrialBalance: async (params?: { date_from?: string; date_to?: string }) => {
    return request('/journal-entries/trial-balance', { params });
  },
};
