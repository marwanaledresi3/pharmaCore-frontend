import { request, normalizeList } from './client';
import { Payment, PaginatedResult } from '../types';

export interface CreatePaymentPayload {
  invoice_id?: string;
  supplier_id?: string;
  customer_id?: string;
  amount: number;
  payment_type?: 'receive' | 'pay';
  payment_date?: string;
  method?: 'cash' | 'bank' | 'cheque';
  reference?: string;
  external_reference?: string;
  description?: string;
  cash_account_id?: string;
}

export const paymentsApi = {
  list: async (params?: {
    invoice_id?: string;
    payment_type?: 'receive' | 'pay';
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Payment>> => {
    const res = await request('/payments', { params });
    return normalizeList<Payment>(res);
  },

  create: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const body: any = {
      amount: Number(payload.amount),
    };

    if (payload.invoice_id) body.invoice_id = payload.invoice_id;
    if (payload.supplier_id) body.supplier_id = payload.supplier_id;
    if (payload.customer_id) body.customer_id = payload.customer_id;
    if (payload.payment_type) body.payment_type = payload.payment_type;
    if (payload.payment_date) body.payment_date = payload.payment_date.slice(0, 10);
    if (payload.method) body.method = payload.method;
    if (payload.reference) body.reference = payload.reference;
    if (payload.external_reference) body.external_reference = payload.external_reference;
    if (payload.description) body.description = payload.description;
    if (payload.cash_account_id) body.cash_account_id = payload.cash_account_id;

    return request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  remove: async (id: string) => {
    return request(`/payments/${id}`, {
      method: 'DELETE',
    });
  },

  refund: async (data: {
    customer_id: string;
    amount: number;
    return_id?: string;
    payment_date?: string;
    method?: 'cash' | 'bank' | 'cheque';
    cash_account_id?: string;
  }) => {
    return request('/payments/refund', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  applyCredit: async (data: { invoice_id: string; amount: number }) => {
    return request('/payments/apply-credit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};