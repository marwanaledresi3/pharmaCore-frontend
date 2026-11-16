// pages/purchaseOrders/types.ts

export interface CatalogProduct {
  // ─── للمورد المحلي ───
  id?: string;
  name?: string;
  unit?: string;
  current_stock?: number;

  // ─── للمورد الشبكي ───
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  system_quantity?: number;
  batch_id?: string;
  batch_number?: string;
  batch_expiry?: string;

  // ─── مشترك ───
  sku?: string;
  barcode?: string;
  cost_price?: number;
  wholesale_price?: number;
  selling_price?: number;
  tax_rate?: number;
  category?: string;
  scientific_name?: string;
  image_url?: string;

  // ─── quantity / stock ───
  quantity?: number;
  total_quantity?: number;
  available_quantity?: number;
  reserved_quantity?: number;

  // ─── live batch (للمورد الشبكي) ───
  live_batch_number?: string;
  live_expiry_date?: string;
  is_network_product?: boolean;

  // ─── الوحدات الفرعية ───
  units?: Array<CatalogUnit>;
}

export interface CatalogUnit {
  unit_id: string;
  unit_name: string;
  conversion_factor: number;
  is_base_unit: boolean;
  sale_price?: number | null;
  purchase_price?: number | null;
  barcode?: string | null;
}

export interface DraftItem {
  uid: string;
  product_id: string;
  supplier_product_id?: string;
  paid_quantity: number;
  bonus_quantity: number;
  quantity?: number;
  unit_price: number;
  tax_rate: number;
  discount_rate?: number;
  discount_amount?: number;
  margin_rate?: number;
  computed_selling_price?: number;
  override_selling_price?: number | null;
  min_selling_price?: number;
  unit_id: string | null;
  conversion_factor: number;
  batch_number?: string;
  expiry_date?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discountTotal: number;
  netAfterDiscount: number;
  taxTotal: number;
  grandTotal: number;
}

export type RefsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface QRData {
  url: string;
  qr_data_url: string;
  pin?: string;
  mode: 'authenticated' | 'public' | 'both';
  expires_at: string;
}