// api/ordersApi.types.ts
import { PurchaseOrder, SalesOrder } from '../types';

/* ============================================================
 * Enums / Unions
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

export type PaymentMethod =
  | 'cash'
  | 'bank'
  | 'cheque'
  | 'card'
  | 'wallet'
  | 'other';

export type QRMode = 'authenticated' | 'public' | 'both';

/* ============================================================
 * Purchase Order — Create
 * ============================================================ */

export interface CreatePurchaseOrderItemPayload {
  product_id: string;
  supplier_product_id?: string;

  paid_quantity: number;
  bonus_quantity?: number;
  quantity?: number;

  unit_price?: number;
  discount_rate?: number;
  discount_amount?: number;
  tax_rate?: number;

  // ✅ Payment
  payment_type?: PaymentType;
  payment_method?: PaymentMethod;
  payment_terms_days?: number;
  paid_amount?: number;

  batch_number?: string | null;
  expiry_date?: string | null;

  // ✅ Supplier invoice
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;

  // ✅ التسعير
  margin_rate?: number;
  computed_selling_price?: number;
  override_selling_price?: number | null;
  min_selling_price?: number;
}

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

   discount_rate?: number;
  // فاتورة المورد الورقية
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;

  // المستودع (اختياري)
  warehouse_id?: string;

  items: CreatePurchaseOrderItemPayload[];
}

/* ============================================================
 * Purchase Order — Approve
 * ============================================================ */

export interface ItemAdjustmentPayload {
  item_id: string;
  unit_price?: number;
  bonus_quantity?: number;
  discount_rate?: number;
  tax_rate?: number;
  batch_number?: string;
  expiry_date?: string;
  reason?: string;
}

export interface ApprovePurchaseOrderPayload {
  item_adjustments?: ItemAdjustmentPayload[];
  qr_mode?: QRMode;
  qr_ttl_days?: number;
}

export interface QRPayload {
  url: string;
  qr_data_url: string;
  pin: string | null;
  mode: QRMode;
  expires_at: string;
}

export interface ApprovePurchaseOrderResult extends Partial<PurchaseOrder> {
  qr?: QRPayload;
}

/* ============================================================
 * Purchase Order — Confirm
 * ============================================================ */

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

/* ============================================================
 * Delivery Token (QR)
 * ============================================================ */

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
    mode: QRMode;
    expires_at: string;
    used_at: string | null;
  };
  buyer_company_name?: string;
  supplier_company_name?: string;
}

/* ============================================================
 * Sales Order — Create
 * ============================================================ */

export interface CreateSalesOrderItemPayload {
  product_id: string;

  paid_quantity: number;
  bonus_quantity?: number;
  quantity?: number;

  unit_price: number;
  discount_rate?: number;
  discount_amount?: number;
  tax_rate?: number;

  batch_id?: string | null;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;
}

export interface CreateSalesOrderPayload {
  customer_id: string;
  currency_id: string;
  order_date?: string;
  exchange_rate?: number;
  payment_type?: PaymentType;
  payment_method?: PaymentMethod;
  payment_terms_days?: number;
  paid_amount?: number;

   discount_rate?: number;
  // المستودع (اختياري)
  warehouse_id?: string;

  items: CreateSalesOrderItemPayload[];
}

/* ============================================================
 * List params
 * ============================================================ */

export interface ListPurchaseOrdersParams {
  status?: PurchaseOrderStatus;
  date_from?: string;
  date_to?: string;
  supplier_id?: string;
  page?: number;
  limit?: number;
}

export interface ListIncomingPurchaseOrdersParams {
  status?: PurchaseOrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ListSalesOrdersParams {
  status?: SalesOrderStatus;
  date_from?: string;
  date_to?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
}