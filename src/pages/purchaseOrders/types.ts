// pages/purchaseOrders/types.ts

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Types — Purchase Orders
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * منتج في الكتالوج (محلي أو شبكي)
 */
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
  selling_price?: number;
  tax_rate?: number;
  category?: string;
  scientific_name?: string;
  image_url?: string;

  // ─── الوحدات الفرعية ───
  units?: Array<CatalogUnit>;
}

/**
 * وحدة قياس فرعية للمنتج
 */
export interface CatalogUnit {
  unit_id: string;
  unit_name: string;
  conversion_factor: number;
  is_base_unit: boolean;
  sale_price?: number | null;
  purchase_price?: number | null;
  barcode?: string | null;
}

/**
 * بند في المسودة (draft) — يُستخدم في نموذج الإنشاء
 *
 * ⚠️ يجب أن يطابق `CreatePurchaseOrderItemPayload` في `ordersApi.types.ts`
 *    ليعمل مع `buildPurchaseOrderItems` بدون أخطاء TypeScript.
 */
export interface DraftItem {
  /** معرف فريد للبند (للـ React keys) */
  uid: string;

  /** معرف المنتج */
  product_id: string;

  supplier_product_id?: string;

  paid_quantity: number;

  bonus_quantity: number;

  /** إجمالي الكمية (paid + bonus) */
  quantity?: number;

  /** سعر الوحدة (بالوحدة المختارة) */
  unit_price: number;

  /** نسبة الضريبة (%) */
  tax_rate: number;

  // ═══════════════════════════════════════════════════════════════
  // 💰 Discount (على البند)
  // ═══════════════════════════════════════════════════════════════

  /** نسبة الخصم على البند (%) — للمشتريات المحلية */
  discount_rate?: number;

  /** مبلغ الخصم على البند — يُحسب تلقائياً */
  discount_amount?: number;

  // ═══════════════════════════════════════════════════════════════
  // 🏷️ Pricing (للمشتريات)
  // ═══════════════════════════════════════════════════════════════

  /** نسبة هامش الربح الخاصة بالبند (%) */
  margin_rate?: number;

  /** سعر البيع المحسوب تلقائياً */
  computed_selling_price?: number;

  /** سعر البيع الذي أدخله المستخدم يدوياً (يتجاوز المحسوب) */
  override_selling_price?: number | null;

  /** الحد الأدنى لسعر البيع */
  min_selling_price?: number;

  // ═══════════════════════════════════════════════════════════════
  // 📦 الوحدة
  // ═══════════════════════════════════════════════════════════════

  /** معرف الوحدة المختارة (NULL = الوحدة الأساسية) */
  unit_id: string | null;

  /** معامل التحويل للوحدة الأساسية */
  conversion_factor: number;

  // ═══════════════════════════════════════════════════════════════
  // 🆕 حقول خاصة بالمشتريات فقط
  // ═══════════════════════════════════════════════════════════════

  /** رقم الدفعة (للمشتريات) */
  batch_number?: string;

  /** تاريخ انتهاء الدفعة (للمشتريات) — YYYY-MM-DD */
  expiry_date?: string;
}

/**
 * إجماليات الفاتورة
 */
export interface InvoiceTotals {
  /** المجموع الصافي (قبل الخصم والضريبة) */
  subtotal: number;

  /** إجمالي الخصم (على الفاتورة) */
  discountTotal: number;

  /** الصافي بعد الخصم */
  netAfterDiscount: number;

  /** إجمالي الضرائب */
  taxTotal: number;

  /** الإجمالي النهائي */
  grandTotal: number;
}