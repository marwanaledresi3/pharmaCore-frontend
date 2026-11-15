import { request } from './client';

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  from_batch_id: string | null;
  from_batch_number: string | null;
  from_batch_expiry: string | null;
  to_batch_id: string | null;
  to_batch_number: string | null;
  to_batch_expiry: string | null; 
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  transfer_date: string;
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;
  notes: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  items: StockTransferItem[];
  items_count?: number;
  journal_entry_id: string | null; 
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

export const stockTransfersApi = {
  list: async (params?: {
    status?: string;
    from_warehouse_id?: string;
    to_warehouse_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: StockTransfer[]; total: number }> => {
    return request<{ items: StockTransfer[]; total: number }>('/stock-transfers', { params });
  },

  getById: async (id: string): Promise<StockTransfer> => {
    return request<StockTransfer>(`/stock-transfers/${id}`);
  },

  create: async (data: {
    from_warehouse_id: string;
    to_warehouse_id: string;
    transfer_date?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      from_batch_id?: string | null;
      unit_cost?: number;
      notes?: string;
    }>;
  }): Promise<StockTransfer> => {
    return request<StockTransfer>('/stock-transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirm: async (id: string): Promise<StockTransfer> => {
    return request<StockTransfer>(`/stock-transfers/${id}/confirm`, { method: 'POST' });
  },

  cancel: async (id: string, reason?: string): Promise<any> => {
    return request(`/stock-transfers/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};