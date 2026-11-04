import { request, normalizeList } from './client';
import { Expense, PaginatedResult } from '../types';

export interface CreateExpensePayload {
  description: string;
  amount: number;
  expense_account_id: string;
  currency_id: string;
  expense_date?: string;
  expense_category?: string;
  exchange_rate?: number;
  payment_type?: 'cash' | 'credit' | 'partial';
  payment_method?: 'cash' | 'bank' | 'cheque';
  paid_amount?: number;
  due_date?: string;
  supplier_id?: string;
  external_reference?: string;
}

export const expensesApi = {
  list: async (params?: {
    status?: string;
    category?: string;
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Expense>> => {
    const res = await request('/expenses', { params });
    return normalizeList<Expense>(res);
  },

  getOne: async (id: string): Promise<Expense> => {
    return request<Expense>(`/expenses/${id}`);
  },

  create: async (payload: CreateExpensePayload): Promise<Expense> => {
    return request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  remove: async (id: string): Promise<void> => {
    await request(`/expenses/${id}`, { method: 'DELETE' });
  },

 pay: async (
  id: string,
  data: { amount?: number; method?: 'cash' | 'bank' | 'cheque'; payment_date?: string }
) => {
  return request<{
    id: string;
    status: string;
    paid_amount: number;
    payment_id: string;
    journal_entry_id: string;
  }>(`/expenses/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
},

  cancel: async (id: string) => {
    return request(`/expenses/${id}/cancel`, { method: 'POST' });
  },
};