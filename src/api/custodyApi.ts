// api/custodyApi.ts
import { request, normalizeList } from './client';
import type { PaginatedResult } from '../types';
import type {
  CustodyType,
  Custody,
  CustodyTransaction,
  EmployeeAdvance,
  CustodyStatus,
  CustodyKind,
  CustodyTransactionType,
  AdvanceType,
  AdvanceStatus,
} from '../types/custody';

const BASE = '/custodies';

export const custodyApi = {
  // ── أنواع العهد ──
  listTypes: async (): Promise<CustodyType[]> => {
    const res = await request<CustodyType[]>(`${BASE}/types`);
    return Array.isArray(res) ? res : normalizeList<CustodyType>(res).items;
  },

  createType: async (payload: {
    name: string;
    code?: string | null;
    kind: CustodyKind;
    requires_settlement?: boolean;
  }): Promise<CustodyType> => {
    return request<CustodyType>(`${BASE}/types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── العهد ──
  listCustodies: async (params?: {
    status?: CustodyStatus;
    holder_employee_id?: string;
    custody_type_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Custody>> => {
    const res = await request(`${BASE}`, { params });
    return normalizeList<Custody>(res);
  },

  getCustody: async (id: string): Promise<Custody> => {
    return request<Custody>(`${BASE}/${id}`);
  },

  createCustody: async (payload: {
    custody_number?: string | null;
    custody_type_id: string;
    holder_employee_id: string;
    amount?: number;
    currency_id?: string | null;
    description?: string | null;
    issued_date?: string | null;
    due_date?: string | null;
    account_id?: string | null;
    notes?: string | null;
    items?: Array<{
      product_id?: string | null;
      description: string;
      quantity?: number;
      unit_cost?: number;
    }>;
  }): Promise<Custody> => {
    return request<Custody>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  addTransaction: async (
    custodyId: string,
    payload: {
      transaction_type: CustodyTransactionType;
      transaction_date?: string | null;
      amount?: number;
      expense_category?: string | null;
      expense_account_id?: string | null;
      description?: string | null;
    }
  ): Promise<{ transaction: CustodyTransaction; custody: Custody | null }> => {
    return request(`${BASE}/${custodyId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── السلف والأقساط ──
  listAdvances: async (params?: {
    status?: AdvanceStatus;
    employee_id?: string;
    advance_type?: AdvanceType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<EmployeeAdvance>> => {
    const res = await request(`${BASE}/advances/list`, { params });
    return normalizeList<EmployeeAdvance>(res);
  },

  getAdvance: async (id: string): Promise<EmployeeAdvance> => {
    return request<EmployeeAdvance>(`${BASE}/advances/${id}`);
  },

  createAdvance: async (payload: {
    advance_number?: string | null;
    employee_id: string;
    advance_type?: AdvanceType;
    amount: number;
    currency_id?: string | null;
    exchange_rate?: number;
    installments_count?: number;
    installment_amount?: number | null;
    request_date?: string | null;
    first_installment_date?: string | null;
    receivable_account_id?: string | null;
    notes?: string | null;
  }): Promise<EmployeeAdvance> => {
    return request<EmployeeAdvance>(`${BASE}/advances`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  approveAdvance: async (
    id: string,
    approval_date?: string | null
  ): Promise<{ advance: EmployeeAdvance; installments: EmployeeAdvance['installments'] }> => {
    return request(`${BASE}/advances/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approval_date: approval_date || null }),
    });
  },

  rejectAdvance: async (id: string, notes?: string | null): Promise<EmployeeAdvance> => {
    return request(`${BASE}/advances/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
  },

  cancelAdvance: async (id: string, notes?: string | null): Promise<EmployeeAdvance> => {
    return request(`${BASE}/advances/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
  },

  payInstallment: async (
    installmentId: string,
    payload?: {
      amount?: number;
      paid_date?: string | null;
      payment_account_id?: string | null;
    }
  ): Promise<{ journal_entry_id: string | null; advance: EmployeeAdvance | null }> => {
    return request(`${BASE}/advances/installments/${installmentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
};

export default custodyApi;