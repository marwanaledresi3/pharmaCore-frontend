import { request } from './client';

export type AdjustmentReason =
  | 'physical_count' | 'damage' | 'theft' | 'expiry' | 'error' | 'other';

export interface StockAdjustmentItem {
  id: string;
  adjustment_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  unit_cost: number | null;
  notes: string | null;
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  warehouse_id: string;
  warehouse_name: string;
  reason: AdjustmentReason;
  notes: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  items: StockAdjustmentItem[];
  items_count?: number;
  total_value?: number;
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

export const stockAdjustmentsApi = {
  list: async (params?: {
    status?: string;
    warehouse_id?: string;
    reason?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: StockAdjustment[]; pagination: any }> => {
    return request<{ items: StockAdjustment[]; pagination: any }>('/stock-adjustments', { params });
  },

  getById: async (id: string): Promise<StockAdjustment> => {
    return request<StockAdjustment>(`/stock-adjustments/${id}`);
  },

  getWarehouseProducts: async (
    warehouseId: string,
    params?: { search?: string }
  ): Promise<{
    items: Array<{
      product_id: string;
      product_name: string;
      product_sku: string;
      product_unit: string;
      batch_id: string | null;
      batch_number: string | null;
      batch_expiry: string | null;
      system_quantity: number;
      cost_price: number;
    }>;
  }> => {
    return request<{
      items: Array<{
        product_id: string;
        product_name: string;
        product_sku: string;
        product_unit: string;
        batch_id: string | null;
        batch_number: string | null;
        batch_expiry: string | null;
        system_quantity: number;
        cost_price: number;
      }>;
    }>(`/stock-adjustments/warehouse-products/${warehouseId}`, { params });
  },

  create: async (data: {
    warehouse_id: string;
    reason: AdjustmentReason;
    adjustment_date?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      actual_quantity: number;
      batch_id?: string | null;
      unit_cost?: number;
      notes?: string;
    }>;
  }): Promise<StockAdjustment> => {
    return request<StockAdjustment>('/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirm: async (id: string): Promise<StockAdjustment> => {
    return request<StockAdjustment>(`/stock-adjustments/${id}/confirm`, { method: 'POST' });
  },

  cancel: async (id: string, reason?: string): Promise<any> => {
    return request(`/stock-adjustments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};