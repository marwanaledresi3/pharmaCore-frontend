// api/productsApi.ts
import { request, normalizeList } from './client';
import { Product, PaginatedResult } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductStockBatch {
  warehouse_id: string;
  warehouse_name: string;
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
  cost_price_base?: number | null;
}

export interface ProductStockDetails {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  base_unit: { id: string; code: string; name: string } | null;
  batches: ProductStockBatch[];
}

export interface ListProductsParams {
  search?: string;
  is_active?: boolean;
  product_type?: string;
  has_global_link?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  unit: string;
  barcode?: string;
  category?: string;
  cost_price?: number;
  selling_price?: number;
  profit_margin?: number;
  markup_percentage?: number | null;
  pricing_policy?: 'fixed' | 'auto_markup';
  min_stock_level?: number;
  tax_rate_id?: string;
  revenue_account_id?: string;
  inventory_account_id?: string;
  cogs_account_id?: string;
  base_unit_id?: string;
  global_product_id?: string;
}

export interface ProductUnitInput {
  unit_id: string;
  conversion_factor: number;
  sale_price?: number | null;
  purchase_price?: number | null;
  barcode?: string | null;
  is_base_unit?: boolean;
}

export interface CreateProductWithUnitsPayload extends CreateProductPayload {
  units?: ProductUnitInput[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يبني payload إنشاء المنتج (بدون units).
 */
function buildCreatePayload(
  data: Record<string, any> & Record<string, any>
): Record<string, any> {
  const payload: Record<string, any> = {
    sku: data.sku?.trim(),
    name: data.name?.trim(),
    unit: data.unit?.trim(),
  };

  if (data.barcode && String(data.barcode).trim()) {
    payload.barcode = String(data.barcode).trim();
  }
  if (data.category && String(data.category).trim()) {
    payload.category = String(data.category).trim();
  }

  if (data.cost_price !== undefined && data.cost_price !== null) {
    payload.cost_price = Number(data.cost_price);
  }
  if (data.selling_price !== undefined && data.selling_price !== null) {
    payload.selling_price = Number(data.selling_price);
  }
  if (data.profit_margin !== undefined && data.profit_margin !== null) {
    payload.profit_margin = Number(data.profit_margin);
  }
  if (data.min_stock_level !== undefined && data.min_stock_level !== null) {
    payload.min_stock_level = Number(data.min_stock_level);
  }

  if ((data as any).markup_percentage !== undefined) {
    payload.markup_percentage = (data as any).markup_percentage;
  }
  if ((data as any).pricing_policy) {
    payload.pricing_policy = (data as any).pricing_policy;
  }

  if ((data as any).tax_rate_id) payload.tax_rate_id = (data as any).tax_rate_id;
  if ((data as any).revenue_account_id) payload.revenue_account_id = (data as any).revenue_account_id;
  if ((data as any).inventory_account_id) payload.inventory_account_id = (data as any).inventory_account_id;
  if ((data as any).cogs_account_id) payload.cogs_account_id = (data as any).cogs_account_id;

  if ((data as any).base_unit_id) payload.base_unit_id = (data as any).base_unit_id;

  if ((data as any).global_product_id) {
    payload.global_product_id = (data as any).global_product_id;
  }

  return payload;
}

/**
 * يبني payload تحديث المنتج.
 */
function buildUpdatePayload(
  data: Partial<Product> & Record<string, any>
): Record<string, any> {
  const payload: Record<string, any> = {};

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.unit !== undefined) payload.unit = data.unit.trim();
  if (data.barcode !== undefined) {
    payload.barcode = data.barcode ? String(data.barcode).trim() : null;
  }
  if (data.category !== undefined) {
    payload.category = data.category ? String(data.category).trim() : null;
  }
  if (data.cost_price !== undefined) payload.cost_price = Number(data.cost_price);
  if (data.selling_price !== undefined) payload.selling_price = Number(data.selling_price);
  if (data.profit_margin !== undefined) payload.profit_margin = Number(data.profit_margin);
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.min_stock_level !== undefined) payload.min_stock_level = Number(data.min_stock_level);

  if ((data as any).markup_percentage !== undefined) {
    payload.markup_percentage = (data as any).markup_percentage;
  }
  if ((data as any).pricing_policy) {
    payload.pricing_policy = (data as any).pricing_policy;
  }

  if ((data as any).tax_rate_id !== undefined) {
    payload.tax_rate_id = (data as any).tax_rate_id || null;
  }
  if ((data as any).revenue_account_id !== undefined) {
    payload.revenue_account_id = (data as any).revenue_account_id || null;
  }
  if ((data as any).inventory_account_id !== undefined) {
    payload.inventory_account_id = (data as any).inventory_account_id || null;
  }
  if ((data as any).cogs_account_id !== undefined) {
    payload.cogs_account_id = (data as any).cogs_account_id || null;
  }

  if ((data as any).base_unit_id !== undefined) {
    payload.base_unit_id = (data as any).base_unit_id || null;
  }

  if ((data as any).global_product_id !== undefined) {
    payload.global_product_id = (data as any).global_product_id || null;
  }

  return payload;
}

/**
 * يبني مصفوفة الوحدات الفرعية (product_units).
 */
function buildUnitsPayload(units: ProductUnitInput[]): ProductUnitInput[] {
  return units
    .filter((u) => u.unit_id)
    .map((u) => ({
      unit_id: u.unit_id,
      conversion_factor: Number(u.conversion_factor) || 1,
      sale_price: u.sale_price != null ? Number(u.sale_price) : null,
      purchase_price: u.purchase_price != null ? Number(u.purchase_price) : null,
      barcode: u.barcode && String(u.barcode).trim() ? String(u.barcode).trim() : null,
      is_base_unit: u.is_base_unit === true,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// productsApi
// ═══════════════════════════════════════════════════════════════════════════

export const productsApi = {
  // ══════════════════════════════════════════════════════════════
  // List / Get
  // ══════════════════════════════════════════════════════════════

  list: async (params?: ListProductsParams): Promise<PaginatedResult<Product>> => {
    const res = await request<unknown>('/products', { params });
    return normalizeList<Product>(res);
  },

  getOne: async (id: string): Promise<Product> => {
    return request<Product>(`/products/${id}`);
  },

  // ══════════════════════════════════════════════════════════════
  // Stock
  // ══════════════════════════════════════════════════════════════

  /**
   * جلب مخزون منتج واحد (batches).
   * GET /products/:id/stock → { total_quantity, batches, base_unit, ... }
   */
  getStock: async (id: string): Promise<ProductStockDetails> => {
    const response = await request<ProductStockDetails>(`/products/${id}/stock`);

    return {
      total_quantity: Number(response?.total_quantity ?? 0),
      reserved_quantity: Number(response?.reserved_quantity ?? 0),
      available_quantity: Number(response?.available_quantity ?? 0),
      base_unit: response?.base_unit ?? null,
      batches: Array.isArray(response?.batches)
        ? response.batches.map((b) => ({
            warehouse_id: b.warehouse_id,
            warehouse_name: b.warehouse_name || 'المستودع الرئيسي',
            batch_id: b.batch_id,
            batch_number: b.batch_number || '',
            expiry_date: b.expiry_date || '',
            quantity: Number(b.quantity) || 0,
            cost_price: Number(b.cost_price) || 0,
            cost_price_base: b.cost_price_base ?? null,
          }))
        : [],
    };
  },

  /**
   * جلب مخزون كل المنتجات (للشبكة / التقارير).
   * GET /products/stock → Product[]
   */
  getAllStock: async (companyId?: string): Promise<Product[]> => {
    const response = await request<unknown>('/products/stock', {
      params: companyId ? { company_id: companyId } : undefined,
    });

    let rows: any[] = [];
    if (Array.isArray(response)) {
      rows = response;
    } else if (
      response !== null &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    ) {
      rows = (response as { data: unknown[] }).data;
    }

    return rows.map((row: any) => {
      const batches = Array.isArray(row.batches) ? row.batches : [];
      const liveBatch =
        batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];

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
        units: Array.isArray(row.units) ? row.units : [],
      } as Product;
    });
  },

  // ══════════════════════════════════════════════════════════════
  // Create / Update / Delete
  // ══════════════════════════════════════════════════════════════

  /**
   * إنشاء منتج (بدون وحدات إضافية).
   * POST /products
   */
  create: async (data: Partial<Product> & Record<string, any>): Promise<Product> => {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(buildCreatePayload(data)),
    });
  },

  /**
   * إنشاء منتج + وحدات (product_units).
   * POST /products مع base_unit_id + units[]
   *
   * ✅ هذا هو المُفضّل: يُنشئ المنتج والوحدات في معاملة واحدة.
   */
  createWithUnits: async (
    data: CreateProductWithUnitsPayload
  ): Promise<Product> => {
    const payload = buildCreatePayload(data);

    if (data.base_unit_id) {
      payload.base_unit_id = data.base_unit_id;
    }

    if (Array.isArray(data.units) && data.units.length > 0) {
      payload.units = buildUnitsPayload(data.units);
    }

    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * تعديل منتج.
   * PATCH /products/:id
   */
  update: async (
    id: string,
    data: Partial<Product> & Record<string, any>
  ): Promise<Product> => {
    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(buildUpdatePayload(data)),
    });
  },

  /**
   * حذف منتج.
   * DELETE /products/:id
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/products/${id}`, { method: 'DELETE' });
  },

  // ══════════════════════════════════════════════════════════════
  // Units
  // ══════════════════════════════════════════════════════════════

  /**
   * جلب وحدات منتج.
   * GET /products/:id/units
   */
  listUnits: async (productId: string): Promise<any[]> => {
    const res = await request<unknown>(`/products/${productId}/units`);
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
      return (res as any).data;
    }
    return [];
  },

  // ══════════════════════════════════════════════════════════════
  // Global Catalog
  // ══════════════════════════════════════════════════════════════

  /**
   * ربط منتج موجود بمنتج عالمي.
   * POST /products/:id/link-global
   */
  linkToGlobal: async (
    productId: string,
    globalProductId: string
  ): Promise<{ id: string; global_product_id: string }> => {
    return request(`/products/${productId}/link-global`, {
      method: 'POST',
      body: JSON.stringify({ global_product_id: globalProductId }),
    });
  },

  /**
   * نسخ الحقول التعريفية من الكتالوج.
   * POST /products/:id/copy-from-global
   */
  copyFromGlobal: async (
    productId: string,
    overwrite = false
  ): Promise<any> => {
    return request(`/products/${productId}/copy-from-global`, {
      method: 'POST',
      body: JSON.stringify({ overwrite }),
    });
  },

  /**
   * فك الربط بالكتالوج.
   * DELETE /products/:id/link-global
   */
  unlinkFromGlobal: async (productId: string): Promise<any> => {
    return request(`/products/${productId}/link-global`, {
      method: 'DELETE',
    });
  },
};