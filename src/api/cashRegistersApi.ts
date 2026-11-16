// src/api/cashRegistersApi.ts
import { request } from './client';

export interface CashRegister {
  id: string;
  company_id: string;
  branch_id: string | null;
  branch_name: string | null;
  account_id: string;
  account_code: string;
  account_name: string;
  currency_id: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  code: string;
  name: string;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CashTransfer {
  id: string;
  transfer_number: string;
  transfer_date: string;
  from_register_id: string;
  from_register_name: string;
  from_register_code: string;
  to_register_id: string;
  to_register_name: string;
  to_register_code: string;
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  amount: number;
  exchange_rate: number;
  base_amount: number;
  status: 'completed' | 'cancelled';
  notes: string | null;
  journal_entry_id: string | null;
  created_by_name: string | null;
  created_at: string;
}
export interface CashMovementItem {
  id: string;
  entry_date: string;
  entry_number?: string;
  reference_type?: string;
  reference_number?: string;
  description: string;
  debit: number;   // مقبوضات / وارد
  credit: number;  // مدفوعات / منصرف
  balance?: number;
  created_by_name?: string;
}

export interface CashStatementResponse {
  register: {
    id: string;
    name: string;
    code?: string;
    currency_code?: string;
    current_balance: number;
    account_id?: string;
    branch_name?: string;
  };
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  movements: CashMovementItem[];
}

export const cashRegistersApi = {
  list: async (params?: { is_active?: boolean; branch_id?: string }): Promise<CashRegister[]> => {
    const res = await request<CashRegister[] | { items: CashRegister[] }>('/cash-registers', {
      params,
    });
    return Array.isArray(res) ? res : res?.items || [];
  },

  getOne: async (id: string): Promise<CashRegister> => {
    return request<CashRegister>(`/cash-registers/${id}`);
  },

  create: async (payload: {
    name: string;
    code?: string;
    branch_id?: string | null;
    currency_id?: string | null;
    opening_balance?: number;
    is_default?: boolean;
  }): Promise<CashRegister> => {
    return request<CashRegister>('/cash-registers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (
    id: string,
    payload: {
      name?: string;
      branch_id?: string | null;
      is_default?: boolean;
      is_active?: boolean;
    }
  ): Promise<CashRegister> => {
    return request<CashRegister>(`/cash-registers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // التحويلات النقدية بين الصناديق
  listTransfers: async (params?: {
    register_id?: string;
    status?: 'completed' | 'cancelled';
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) => {
    return request<{
      items: CashTransfer[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>('/cash-transfers', { params });
  },

  createTransfer: async (payload: {
    from_register_id: string;
    to_register_id: string;
    amount: number;
    transfer_date?: string;
    notes?: string;
  }): Promise<CashTransfer> => {
    return request<CashTransfer>('/cash-transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelTransfer: async (id: string): Promise<{ id: string; status: 'cancelled' }> => {
    return request(`/cash-transfers/${id}/cancel`, { method: 'POST' });
  },

  
getStatement: async (
  id: string,
  params?: { date_from?: string; date_to?: string }
): Promise<CashStatementResponse> => {
  return request<CashStatementResponse>(`/cash-registers/${id}/statement`, {
    params,
  });
},
};