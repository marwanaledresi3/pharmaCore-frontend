import { request, normalizeList } from './client';
import { PurchaseOrder, SalesOrder, PaginatedResult } from '../types';

/* ============================================================
 * Types
 * ============================================================ */

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'cancelled';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'invoiced'
  | 'cancelled';

export type PaymentType = 'cash' | 'credit' | 'partial';
export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'card' | 'wallet' | 'other';

export interface CreatePurchaseOrderPayload {
  supplier_id: string;
  currency_id: string;
  order_date?: string;
  exchange_rate?: number;

  // الدفع
  payment_type?: PaymentType;
  payment_method?: PaymentMethod;
  payment_terms_days?: number;
  paid_amount?: number;

  // فاتورة المورد الورقية
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;

  items: Array<{
    product_id: string;
    supplier_product_id?: string;
    paid_quantity: number;
    bonus_quantity?: number;
    quantity?: number;
    unit_price?: number;
    discount_rate?: number;
    discount_amount?: number;
    tax_rate?: number;
    batch_number?: string | null;
    expiry_date?: string | null;
  }>;
}

export interface CreateSalesOrderPayload {
  customer_id: string;
  currency_id: string;
  order_date?: string;
  exchange_rate?: number;
  items: Array<{
    product_id: string;
    paid_quantity: number;
    bonus_quantity?: number;
    quantity?: number;
    unit_price: number;
    discount_rate?: number;
    discount_amount?: number;
    tax_rate?: number;
  }>;
}

export interface ApprovePurchaseOrderPayload {
  item_adjustments?: Array<{
    item_id: string;
    unit_price?: number;
    bonus_quantity?: number;
    discount_rate?: number;
    tax_rate?: number;
    batch_number?: string;
    expiry_date?: string;
    reason?: string;
  }>;
  qr_mode?: 'authenticated' | 'public' | 'both';
  qr_ttl_days?: number;
}

export interface ApprovePurchaseOrderResult extends Partial<PurchaseOrder> {
  qr?: {
    url: string;
    qr_data_url: string;
    pin: string | null;
    mode: 'authenticated' | 'public' | 'both';
    expires_at: string;
  };
}

export interface ConfirmPurchaseOrderResult {
  id: string;
  status: 'confirmed';
  journal_entry_id: string;
  sales_invoice_id: string | null;
  sales_invoice_number: string | null;
  supplier_journal_entries: {
    sales_entry_id: string;
    cogs_entry_id: string | null;
    cogs_total_base: number;
  } | null;
  total_inventory_cost: number;
  payment: {
    type: PaymentType;
    paid_amount: number;
    paid_at: string | null;
    payment_id: string | null;
  };
}

export interface DeliveryTokenPreview {
  order: {
    id: string;
    order_number: string;
    status: PurchaseOrderStatus;
    total: number;
    order_date: string;
    company_id: string;
    supplier_company_id: string;
    due_date?: string | null;
    payment_type?: PaymentType;
    payment_method?: PaymentMethod | null;
  };
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  delivery_token: {
    mode: 'authenticated' | 'public' | 'both';
    expires_at: string;
    used_at: string | null;
  };
  buyer_company_name?: string;
  supplier_company_name?: string;
}

/* ============================================================
 * Helpers
 * ============================================================ */
function buildPurchaseOrderBody(raw: CreatePurchaseOrderPayload) {
  const cleanedItems = raw.items.map((it) => {
    const paidQty = Number(it.paid_quantity) || 1;
    const bonusQty = Number(it.bonus_quantity) || 0;
    const unitPrice = it.unit_price !== undefined ? Number(it.unit_price) : undefined;

    const item: CreatePurchaseOrderPayload['items'][number] = {
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

    if (it.batch_number && it.batch_number.trim()) {
      item.batch_number = it.batch_number.trim();
    }
    if (it.expiry_date && it.expiry_date.trim().length >= 10) {
      item.expiry_date = it.expiry_date.trim().slice(0, 10);
    }
    return item;
  });

  const body: Record<string, unknown> = {
    supplier_id: raw.supplier_id,
    currency_id: raw.currency_id,
    items: cleanedItems,
  };

  if (raw.order_date && raw.order_date.trim()) {
    body.order_date = raw.order_date.trim().slice(0, 10);
  }
  if (raw.exchange_rate && Number(raw.exchange_rate) > 0) {
    body.exchange_rate = Number(raw.exchange_rate);
  }
  if (raw.payment_type) body.payment_type = raw.payment_type;
  if (raw.payment_method) body.payment_method = raw.payment_method;
  if (raw.payment_terms_days != null && Number(raw.payment_terms_days) >= 0) {
    body.payment_terms_days = Number(raw.payment_terms_days);
  }
  if (raw.paid_amount != null && Number(raw.paid_amount) > 0) {
    body.paid_amount = Number(raw.paid_amount);
  }

  // فاتورة المورد الورقية
  if (raw.supplier_invoice_number && raw.supplier_invoice_number.trim()) {
    body.supplier_invoice_number = raw.supplier_invoice_number.trim();
  }
  if (raw.supplier_invoice_date && raw.supplier_invoice_date.trim()) {
    body.supplier_invoice_date = raw.supplier_invoice_date.trim().slice(0, 10);
  }

  return body;
}
/* ============================================================
 * ordersApi
 * ============================================================ */

export const ordersApi = {
  /* ============ Purchase Orders (Buyer Side) ============ */

  listPurchaseOrders: async (params?: {
    status?: PurchaseOrderStatus;
    date_from?: string;
    date_to?: string;
    supplier_id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<PurchaseOrder>> => {
    const res = await request<unknown>('/purchase-orders', { params });
    return normalizeList<PurchaseOrder>(res);
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    return request<PurchaseOrder>(`/purchase-orders/${id}`);
  },

  createPurchaseOrder: async (raw: CreatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    const bodyPayload = buildPurchaseOrderBody(raw);
    return request<PurchaseOrder>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
    });
  },

  confirmPurchaseOrder: async (id: string): Promise<ConfirmPurchaseOrderResult> => {
    return request<ConfirmPurchaseOrderResult>(`/purchase-orders/${id}/confirm`, {
      method: 'POST',
    });
  },

  cancelPurchaseOrder: async (id: string): Promise<{ id: string; status: string }> => {
    return request(`/purchase-orders/${id}/cancel`, { method: 'POST' });
  },

  /* ============ Incoming Purchase Orders (Supplier Side) ============ */

  getIncomingPurchaseOrders: async (params?: {
    page?: number;
    limit?: number;
    include_resolved?: boolean;
  }): Promise<PaginatedResult<PurchaseOrder>> => {
    const res = await request<unknown>('/purchase-orders/incoming', { params });

    // الباك إند يُرجع { success, data: [...] }
    if (
      res !== null &&
      typeof res === 'object' &&
      'data' in res &&
      Array.isArray((res as { data: unknown }).data)
    ) {
      const items = (res as { data: PurchaseOrder[] }).data;
      return {
        items,
        pagination: {
          page: 1,
          limit: items.length,
          total: items.length,
          pages: 1,
        },
      };
    }

    return normalizeList<PurchaseOrder>(res);
  },

  approveIncomingPurchaseOrder: async (
    id: string,
    opts: ApprovePurchaseOrderPayload = {}
  ): Promise<ApprovePurchaseOrderResult> => {
    return request<ApprovePurchaseOrderResult>(`/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  },

  rejectIncomingPurchaseOrder: async (
    id: string,
    reason: string
  ): Promise<{ id: string; status: 'rejected' }> => {
    return request(`/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /* ============ QR Delivery ============ */

  previewDeliveryToken: async (token: string): Promise<DeliveryTokenPreview> => {
    return request<DeliveryTokenPreview>('/purchase-orders/delivery/preview', {
      params: { token },
    });
  },

  confirmPurchaseOrderByToken: async (
    token: string
  ): Promise<ConfirmPurchaseOrderResult & { delivery_token_id?: string }> => {
    return request(`/purchase-orders/delivery/confirm-by-token`, {
      method: 'POST',
      body: JSON.stringify({ token, used_mode: 'authenticated' }),
    });
  },

  /* ============ Sales Orders ============ */

  listSalesOrders: async (params?: {
    status?: SalesOrderStatus;
    date_from?: string;
    date_to?: string;
    customer_id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SalesOrder>> => {
    const res = await request<unknown>('/sales-orders', { params });
    return normalizeList<SalesOrder>(res);
  },

  getSalesOrder: async (id: string): Promise<SalesOrder> => {
    return request<SalesOrder>(`/sales-orders/${id}`);
  },

  createSalesOrder: async (raw: CreateSalesOrderPayload): Promise<SalesOrder> => {
    const cleanedItems = raw.items.map((it) => {
      const paidQty = Number(it.paid_quantity) || 1;
      const bonusQty = Number(it.bonus_quantity) || 0;
      const unitPrice = Number(it.unit_price) || 0;

      const item: CreateSalesOrderPayload['items'][number] = {
        product_id: it.product_id,
        paid_quantity: paidQty,
        quantity: paidQty + bonusQty,
        bonus_quantity: bonusQty,
        unit_price: unitPrice,
      };

      if (typeof it.discount_rate === 'number') item.discount_rate = it.discount_rate;
      if (typeof it.discount_amount === 'number') item.discount_amount = it.discount_amount;
      if (typeof it.tax_rate === 'number') item.tax_rate = it.tax_rate;

      return item;
    });

    const bodyPayload: Record<string, unknown> = {
      customer_id: raw.customer_id,
      currency_id: raw.currency_id,
      items: cleanedItems,
    };

    if (raw.order_date && raw.order_date.trim()) {
      bodyPayload.order_date = raw.order_date.trim().slice(0, 10);
    }
    if (raw.exchange_rate && Number(raw.exchange_rate) > 0) {
      bodyPayload.exchange_rate = Number(raw.exchange_rate);
    }

    return request<SalesOrder>('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
    });
  },

  confirmSalesOrder: async (id: string) => {
    return request(`/sales-orders/${id}/confirm`, { method: 'POST' });
  },

  cancelSalesOrder: async (id: string) => {
    return request(`/sales-orders/${id}/cancel`, { method: 'POST' });
  },
};