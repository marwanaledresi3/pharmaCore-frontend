import { request, normalizeList } from './client';
import { Invoice, Payment, PaginatedResult } from '../types';

export const invoicesApi = {
  list: async (params?: {
    status?: 'unpaid' | 'partial' | 'paid' | 'cancelled';
type?: 'sales' | 'purchase' | 'sales_return' | 'purchase_return';
    invoice_type?: 'sales' | 'purchase';
    customer_id?: string;
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Invoice>> => {
    const res = await request('/invoices', { params });
    return normalizeList<Invoice>(res);
  },

  getOne: async (id: string): Promise<Invoice> => {
    return request<Invoice>(`/invoices/${id}`);
  },

  getPayments: async (id: string): Promise<Payment[]> => {
    const res = await request(`/invoices/${id}/payments`);
    const normalized = normalizeList<Payment>(res);
    return normalized.items;
  },

  createFromSalesOrder: async (orderId: string, dueDate?: string): Promise<Invoice> => {
    const body: any = {};
    if (dueDate && dueDate.trim()) body.due_date = dueDate.trim().slice(0, 10);
    return request<Invoice>(`/invoices/from-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createFromPurchaseOrder: async (orderId: string, dueDate?: string): Promise<Invoice> => {
    const body: any = {};
    if (dueDate && dueDate.trim()) body.due_date = dueDate.trim().slice(0, 10);
    return request<Invoice>(`/invoices/from-purchase-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  cancel: async (id: string) => {
    return request(`/invoices/${id}/cancel`, {
      method: 'POST',
    });
  },
};
