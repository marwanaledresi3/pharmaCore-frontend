import { request } from './client';

export interface GoodsReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  notes: string | null;
  sort_order: number;
}

export interface GoodsReceipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  supplier_id: string;
  supplier_name: string;
  supplier_phone: string | null;
  purchase_order_id: string | null;
  purchase_order_number: string | null;
  warehouse_id: string;
  warehouse_name: string;
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_type: 'cash' | 'credit';
  notes: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  journal_entry_id: string | null;
  items: GoodsReceiptItem[];
  items_count?: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  cancelled_by: string | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export const goodsReceiptsApi = {
  list: async (params?: {
    status?: string;
    supplier_id?: string;
    warehouse_id?: string;
    purchase_order_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: GoodsReceipt[]; pagination: any }> => {
    return request('/goods-receipts', { params });
  },

  getById: async (id: string): Promise<GoodsReceipt> => {
    return request(`/goods-receipts/${id}`);
  },

  create: async (data: {
    supplier_id: string;
    warehouse_id: string;
    purchase_order_id?: string;
    currency_id?: string;
    exchange_rate?: number;
    payment_type?: 'cash' | 'credit';
    receipt_date?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      batch_number?: string;
      expiry_date?: string;
      discount_rate?: number;
      tax_rate?: number;
      notes?: string;
    }>;
  }): Promise<GoodsReceipt> => {
    return request('/goods-receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirm: async (id: string): Promise<GoodsReceipt> => {
    return request(`/goods-receipts/${id}/confirm`, { method: 'POST' });
  },

  cancel: async (id: string, reason?: string): Promise<any> => {
    return request(`/goods-receipts/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};