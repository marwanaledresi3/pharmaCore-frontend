// api/salesOrdersApi.ts
import { request, normalizeList } from './client';
import { SalesOrder, PaginatedResult } from '../types';

import type {
  CreateSalesOrderPayload,
  CreateSalesOrderItemPayload,
  ListSalesOrdersParams,
} from './ordersApi.types';

// إعادة تصدير الأنواع
export type {
  SalesOrderStatus,
  CreateSalesOrderPayload,
  CreateSalesOrderItemPayload,
  ListSalesOrdersParams,
} from './ordersApi.types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ينظّف بنود أمر البيع قبل الإرسال.
 */
function buildSalesOrderItems(
  items: CreateSalesOrderItemPayload[]
): CreateSalesOrderItemPayload[] {
  return items.map((it) => {
    const paidQty = Number(it.paid_quantity) || 1;
    const bonusQty = Number(it.bonus_quantity) || 0;
    const unitPrice = Number(it.unit_price) || 0;

    const item: CreateSalesOrderItemPayload = {
      product_id: it.product_id,
      paid_quantity: paidQty,
      quantity: paidQty + bonusQty,
      bonus_quantity: bonusQty,
      unit_price: unitPrice,
    };

    if (typeof it.discount_rate === 'number') item.discount_rate = it.discount_rate;
    if (typeof it.discount_amount === 'number') item.discount_amount = it.discount_amount;
    if (typeof it.tax_rate === 'number') item.tax_rate = it.tax_rate;

    // ✅ الوحدة
    if (it.unit_id) {
      item.unit_id = it.unit_id;
      item.conversion_factor = Number(it.conversion_factor) || 1;
    }

    // ✅ الدفعة
    if (it.batch_id) item.batch_id = it.batch_id;

    return item;
  });
}

/**
 * يبني body إنشاء أمر البيع.
 */
function buildSalesOrderBody(
  raw: CreateSalesOrderPayload & {
    payment_type?: 'cash' | 'credit' | 'partial';
    payment_method?: string;
    payment_terms_days?: number;
    paid_amount?: number;
    discount_rate?: number;
    cash_register_id?: string | null;
  }
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customer_id: raw.customer_id,
    currency_id: raw.currency_id,
    items: buildSalesOrderItems(raw.items),
  };

  if (raw.order_date && raw.order_date.trim()) {
    body.order_date = raw.order_date.trim().slice(0, 10);
  }
  if (raw.exchange_rate && Number(raw.exchange_rate) > 0) {
    body.exchange_rate = Number(raw.exchange_rate);
  }
  if (raw.warehouse_id) body.warehouse_id = raw.warehouse_id;

  // حقول الدفع والخصم والصندوق
  if (raw.payment_type) body.payment_type = raw.payment_type;
  if (raw.payment_method) body.payment_method = raw.payment_method;
  if (typeof raw.payment_terms_days === 'number') {
    body.payment_terms_days = raw.payment_terms_days;
  }
  if (typeof raw.paid_amount === 'number') body.paid_amount = raw.paid_amount;
  if (typeof raw.discount_rate === 'number') body.discount_rate = raw.discount_rate;
  if (raw.cash_register_id) body.cash_register_id = raw.cash_register_id;

  return body;
}

// ═══════════════════════════════════════════════════════════════════════════
// salesOrdersApi
// ═══════════════════════════════════════════════════════════════════════════

export const salesOrdersApi = {
  // ══════════════════════════════════════════════════════════════
  // List / Get
  // ══════════════════════════════════════════════════════════════

  /**
   * قائمة أوامر البيع.
   * GET /sales-orders
   */
  list: async (
    params?: ListSalesOrdersParams
  ): Promise<PaginatedResult<SalesOrder>> => {
    const res = await request<unknown>('/sales-orders', { params });
    return normalizeList<SalesOrder>(res);
  },

  /**
   * جلب أمر بيع واحد.
   * GET /sales-orders/:id
   */
  getOne: async (id: string): Promise<SalesOrder> => {
    return request<SalesOrder>(`/sales-orders/${id}`);
  },

  // ══════════════════════════════════════════════════════════════
  // Create / Confirm / Cancel
  // ══════════════════════════════════════════════════════════════

  /**
   * إنشاء أمر بيع.
   * POST /sales-orders
   */
  create: async (raw: CreateSalesOrderPayload): Promise<SalesOrder> => {
    return request<SalesOrder>('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(buildSalesOrderBody(raw)),
    });
  },

  /**
   * تأكيد أمر بيع (يصرف المخزون).
   * POST /sales-orders/:id/confirm
   */
  confirm: async (id: string): Promise<{
    id: string;
    status: 'confirmed';
    journal_entry_id: string;
    total_cogs: number;
  }> => {
    return request(`/sales-orders/${id}/confirm`, { method: 'POST' });
  },

  /**
   * إلغاء أمر بيع.
   * POST /sales-orders/:id/cancel
   */
  cancel: async (id: string): Promise<{ id: string; status: string }> => {
    return request(`/sales-orders/${id}/cancel`, { method: 'POST' });
  },
};