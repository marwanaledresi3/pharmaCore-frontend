// api/purchaseOrdersApi.ts
import { request, normalizeList } from './client';
import { PurchaseOrder, PaginatedResult } from '../types';

import type {
  CreatePurchaseOrderPayload,
  CreatePurchaseOrderItemPayload,
  ApprovePurchaseOrderPayload,
  ApprovePurchaseOrderResult,
  ConfirmPurchaseOrderResult,
  DeliveryTokenPreview,
  ListPurchaseOrdersParams,
  ListIncomingPurchaseOrdersParams,
} from './ordersApi.types';

// إعادة تصدير الأنواع
export type {
  PurchaseOrderStatus,
  PaymentType,
  PaymentMethod,
  QRMode,
  CreatePurchaseOrderPayload,
  CreatePurchaseOrderItemPayload,
  ItemAdjustmentPayload,
  ApprovePurchaseOrderPayload,
  ApprovePurchaseOrderResult,
  ConfirmPurchaseOrderResult,
  DeliveryTokenPreview,
  ListPurchaseOrdersParams,
  ListIncomingPurchaseOrdersParams,
} from './ordersApi.types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ينظّف بنود أمر الشراء قبل الإرسال.
 */
function buildPurchaseOrderItems(
  items: CreatePurchaseOrderItemPayload[]
): CreatePurchaseOrderItemPayload[] {
  return items.map((it) => {
    const paidQty = Number(it.paid_quantity) || 1;
    const bonusQty = Number(it.bonus_quantity) || 0;
    const unitPrice = it.unit_price !== undefined ? Number(it.unit_price) : undefined;

    const item: CreatePurchaseOrderItemPayload = {
      product_id: it.product_id,
      paid_quantity: paidQty,
      bonus_quantity: bonusQty,
      quantity: paidQty + bonusQty,
    };

    if (it.supplier_product_id) item.supplier_product_id = it.supplier_product_id;
    if (unitPrice !== undefined && Number.isFinite(unitPrice)) item.unit_price = unitPrice;
    if (typeof it.discount_rate === 'number') item.discount_rate = it.discount_rate;
    if (typeof it.discount_amount === 'number') item.discount_amount = it.discount_amount;
    if (typeof it.tax_rate === 'number') item.tax_rate = it.tax_rate;

    // ✅ الوحدة
    if (it.unit_id) {
      item.unit_id = it.unit_id;
      item.conversion_factor = Number(it.conversion_factor) || 1;
    }

    // ✅ التسعير
    if (typeof it.margin_rate === 'number') {
      item.margin_rate = it.margin_rate;
    }
    if (typeof it.computed_selling_price === 'number') {
      item.computed_selling_price = it.computed_selling_price;
    }
    if (it.override_selling_price !== undefined) {
      item.override_selling_price =
        it.override_selling_price != null && Number(it.override_selling_price) > 0
          ? Number(it.override_selling_price)
          : null;
    }
    if (typeof it.min_selling_price === 'number') {
      item.min_selling_price = it.min_selling_price;
    }

    if (it.batch_number && it.batch_number.trim()) {
      item.batch_number = it.batch_number.trim();
    }
    if (it.expiry_date && it.expiry_date.trim().length >= 10) {
      item.expiry_date = it.expiry_date.trim().slice(0, 10);
    }

    return item;
  });
}

/**
 * يبني body إنشاء أمر الشراء.
 */
// api/purchaseOrdersApi.ts — buildPurchaseOrderBody (محدّث)

function buildPurchaseOrderBody(
  raw: CreatePurchaseOrderPayload
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    supplier_id: raw.supplier_id,
    currency_id: raw.currency_id,
    items: buildPurchaseOrderItems(raw.items),
  };

  if (raw.order_date && raw.order_date.trim()) {
    body.order_date = raw.order_date.trim().slice(0, 10);
  }
  if (raw.exchange_rate && Number(raw.exchange_rate) > 0) {
    body.exchange_rate = Number(raw.exchange_rate);
  }

  // ✅ Payment
  if (raw.payment_type) body.payment_type = raw.payment_type;
  if (raw.payment_method) body.payment_method = raw.payment_method;
  if (raw.payment_terms_days != null && Number(raw.payment_terms_days) >= 0) {
    body.payment_terms_days = Number(raw.payment_terms_days);
  }
  if (raw.paid_amount != null && Number(raw.paid_amount) > 0) {
    body.paid_amount = Number(raw.paid_amount);
  }

  // ✅ Discount على الفاتورة (جديد)
  if (raw.discount_rate != null && Number(raw.discount_rate) >= 0) {
    body.discount_rate = Number(raw.discount_rate);
  }

  // ✅ Warehouse
  if (raw.warehouse_id) body.warehouse_id = raw.warehouse_id;

  // ✅ Supplier invoice
  if (raw.supplier_invoice_number && raw.supplier_invoice_number.trim()) {
    body.supplier_invoice_number = raw.supplier_invoice_number.trim();
  }
  if (raw.supplier_invoice_date && raw.supplier_invoice_date.trim()) {
    body.supplier_invoice_date = raw.supplier_invoice_date.trim().slice(0, 10);
  }

  if (raw.cash_register_id) {
    body.cash_register_id = raw.cash_register_id;
  }

  return body;
}

// ═══════════════════════════════════════════════════════════════════════════
// purchaseOrdersApi
// ═══════════════════════════════════════════════════════════════════════════

export const purchaseOrdersApi = {
  // ══════════════════════════════════════════════════════════════
  // Buyer Side
  // ══════════════════════════════════════════════════════════════

  list: async (
    params?: ListPurchaseOrdersParams
  ): Promise<PaginatedResult<PurchaseOrder>> => {
    const res = await request<unknown>('/purchase-orders', { params });
    return normalizeList<PurchaseOrder>(res);
  },

  getOne: async (id: string): Promise<PurchaseOrder> => {
    return request<PurchaseOrder>(`/purchase-orders/${id}`);
  },

  create: async (raw: CreatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    return request<PurchaseOrder>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(buildPurchaseOrderBody(raw)),
    });
  },

  confirm: async (id: string): Promise<ConfirmPurchaseOrderResult> => {
    return request<ConfirmPurchaseOrderResult>(
      `/purchase-orders/${id}/confirm`,
      { method: 'POST' }
    );
  },

  cancel: async (id: string): Promise<{ id: string; status: string }> => {
    return request(`/purchase-orders/${id}/cancel`, { method: 'POST' });
  },

  // ══════════════════════════════════════════════════════════════
  // Supplier Side (Incoming)
  // ══════════════════════════════════════════════════════════════

  listIncoming: async (
    params?: ListIncomingPurchaseOrdersParams
  ): Promise<PaginatedResult<PurchaseOrder>> => {
    const res = await request<unknown>('/purchase-orders/incoming', { params });

    if (res !== null && typeof res === 'object' && 'data' in res) {
      const payload = (res as { data: unknown }).data;

      if (
        payload !== null &&
        typeof payload === 'object' &&
        'items' in payload &&
        Array.isArray((payload as { items: unknown }).items)
      ) {
        return payload as PaginatedResult<PurchaseOrder>;
      }

      if (Array.isArray(payload)) {
        return {
          items: payload as PurchaseOrder[],
          pagination: {
            page: 1,
            limit: payload.length,
            total: payload.length,
            pages: 1,
          },
        };
      }
    }

    return normalizeList<PurchaseOrder>(res);
  },

  approve: async (
    id: string,
    opts: ApprovePurchaseOrderPayload = {}
  ): Promise<ApprovePurchaseOrderResult> => {
    return request<ApprovePurchaseOrderResult>(
      `/purchase-orders/${id}/approve`,
      { method: 'POST', body: JSON.stringify(opts) }
    );
  },

  reject: async (
    id: string,
    reason: string
  ): Promise<{ id: string; status: 'rejected' }> => {
    return request(`/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ══════════════════════════════════════════════════════════════
  // QR Delivery
  // ══════════════════════════════════════════════════════════════

  previewDeliveryToken: async (
    token: string
  ): Promise<DeliveryTokenPreview> => {
    return request<DeliveryTokenPreview>(
      '/purchase-orders/delivery/preview',
      { params: { token } }
    );
  },

  confirmByToken: async (
    token: string
  ): Promise<ConfirmPurchaseOrderResult & { delivery_token_id?: string }> => {
    return request('/purchase-orders/delivery/confirm-by-token', {
      method: 'POST',
      body: JSON.stringify({ token, used_mode: 'authenticated' }),
    });
  },
};