import { request, normalizeList } from './client';
import { Return, PaginatedResult } from '../types';

export interface CreateReturnPayload {
  invoice_id: string;
  return_date?: string;
  reason?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
    batch_id?: string | null;
  }>;
}

export const returnsApi = {
  list: async (params?: {
    return_type?: 'sales' | 'purchase';
    status?: 'draft' | 'confirmed' | 'cancelled';
    invoice_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Return>> => {
    const res = await request('/returns', { params });
    return normalizeList<Return>(res);
  },

  getOne: async (id: string): Promise<Return> => {
    return request<Return>(`/returns/${id}`);
  },

  createSaleReturn: async (payload: CreateReturnPayload): Promise<Return> => {
    const body: any = {
      invoice_id: payload.invoice_id,
      items: payload.items.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price) || 0,
        batch_id: it.batch_id || undefined,
      })),
    };
    if (payload.return_date) body.return_date = payload.return_date.slice(0, 10);
    if (payload.reason) body.reason = payload.reason;

    return request<Return>('/returns/sale', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createPurchaseReturn: async (payload: CreateReturnPayload): Promise<Return> => {
    const body: any = {
      invoice_id: payload.invoice_id,
      items: payload.items.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price) || 0,
        batch_id: it.batch_id || undefined,
      })),
    };
    if (payload.return_date) body.return_date = payload.return_date.slice(0, 10);
    if (payload.reason) body.reason = payload.reason;

    return request<Return>('/returns/purchase', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  confirm: async (id: string) => {
    return request(`/returns/${id}/confirm`, {
      method: 'POST',
    });
  },

  cancel: async (id: string) => {
    return request(`/returns/${id}/cancel`, {
      method: 'POST',
    });
  },
};
