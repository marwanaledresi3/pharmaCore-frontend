import { request, normalizeList } from './client';
import { Product, PaginatedResult } from '../types';


export const productsApi = {
  list: async (params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<PaginatedResult<Product>> => {
    const res = await request('/products', { params });
    return normalizeList<Product>(res);
  },

  getOne: async (id: string): Promise<Product> => {
    return request<Product>(`/products/${id}`);
  },

  getStock: async (id: string): Promise<Product[]> => {
  const response = await request<unknown>(`/products/${id}/stock`);

  let rows: unknown[] = [];
  if (Array.isArray(response)) rows = response;
  else if (
    response !== null &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    rows = (response as { data: unknown[] }).data;
  }

  return rows.map((row: any) => {
    const batches = Array.isArray(row.batches) ? row.batches : [];
    const liveBatch = batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];

    const totalQty = Number(row.total_quantity ?? 0);
    const reservedQty = Number(row.reserved_quantity ?? 0);
    const availableQty = Number(row.available_quantity ?? totalQty - reservedQty);

    return {
      ...row,
      id: row.id ?? row.product_id,
      name: row.name ?? row.product_name,
      sku: row.sku ?? row.product_sku ?? '',
      cost_price: Number(liveBatch?.cost_price ?? row.cost_price ?? 0),
      selling_price: Number(row.selling_price ?? 0),
      wholesale_price: Number(liveBatch?.cost_price ?? row.cost_price ?? 0),
      quantity: availableQty,
      total_quantity: totalQty,
      current_stock: availableQty,
      available_quantity: availableQty,
      reserved_quantity: reservedQty,
      live_batch_number: liveBatch?.batch_number ?? '',
      live_expiry_date: liveBatch?.expiry_date ?? '',
    } as Product & {
      available_quantity: number;
      reserved_quantity: number;
    };
  });
},

  create: async (data: Partial<Product>): Promise<Product> => {
    // Sanitize optional fields to avoid backend validator errors
    const payload: any = {
      sku: data.sku?.trim(),
      name: data.name?.trim(),
      unit: data.unit?.trim(),
    };
    if (data.barcode && data.barcode.trim()) payload.barcode = data.barcode.trim();
    if (data.category && data.category.trim()) payload.category = data.category.trim();
    if (data.cost_price !== undefined && data.cost_price !== null) payload.cost_price = Number(data.cost_price);
if (data.selling_price !== undefined && data.selling_price !== null) payload.selling_price = Number(data.selling_price);
if (data.profit_margin !== undefined && data.profit_margin !== null) payload.profit_margin = Number(data.profit_margin);
if (data.min_stock_level !== undefined && data.min_stock_level !== null) payload.min_stock_level = Number(data.min_stock_level);

    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.unit !== undefined) payload.unit = data.unit.trim();
    if (data.barcode !== undefined) payload.barcode = data.barcode ? data.barcode.trim() : null;
    if (data.category !== undefined) payload.category = data.category ? data.category.trim() : null;
    if (data.cost_price !== undefined) payload.cost_price = Number(data.cost_price);
    if (data.selling_price !== undefined) payload.selling_price = Number(data.selling_price);
    if (data.profit_margin !== undefined) payload.profit_margin = Number(data.profit_margin);
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.min_stock_level !== undefined) payload.min_stock_level = Number(data.min_stock_level);

    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
