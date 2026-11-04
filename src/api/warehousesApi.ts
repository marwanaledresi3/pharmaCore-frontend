import { request, normalizeList } from './client';
import { Warehouse, Batch, PaginatedResult } from '../types';
export interface WarehouseLite {
  id: string;
  name: string;
  code?: string | null;
  is_active?: boolean;
}
export const warehousesApi = {
  list: async (): Promise<PaginatedResult<Warehouse>> => {
    const res = await request('/warehouses');
    return normalizeList<Warehouse>(res);
  },
  lists: async (params?: { is_active?: boolean; page?: number; limit?: number }) => {
    const res = await request('/warehouses', { params });
    return normalizeList<WarehouseLite>(res) as PaginatedResult<WarehouseLite>;
  },

  getOne: async (id: string): Promise<Warehouse> => {
    return request<Warehouse>(`/warehouses/${id}`);
  },

  getProductBatches: async (productId: string): Promise<Array<{
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}>> => {
  const res = await request<unknown>(`/products/${productId}/batches`);
  if (Array.isArray(res)) return res as any;
  if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
    return (res as any).data;
  }
  return [];
},
  create: async (data: { name: string; location?: string }): Promise<Warehouse> => {
    return request<Warehouse>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
    return request<Warehouse>(`/warehouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/warehouses/${id}`, {
      method: 'DELETE',
    });
  },

  listBatches: async (params?: { product_id?: string; warehouse_id?: string; expiring_soon?: boolean }): Promise<PaginatedResult<Batch>> => {
    const res = await request('/batches', { params });
    return normalizeList<Batch>(res);
  },

  createBatch: async (data: {
    product_id: string;
    warehouse_id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    cost_price?: number;
  }): Promise<Batch> => {
    return request<Batch>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
