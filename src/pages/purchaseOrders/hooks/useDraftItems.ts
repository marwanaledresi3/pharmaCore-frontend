// pages/purchaseOrders/hooks/useDraftItems.ts
import { useState } from 'react';
import { DraftItem, CatalogProduct } from '../types';
import { uid, resolveUnitFactor } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * يحسب سعر البيع من سعر الشراء + هامش الربح.
 */
function computeSellingPrice(unitPrice: number, marginRate: number): number {
  const price = Number(unitPrice) || 0;
  const margin = Number(marginRate) || 0;
  return round2(price * (1 + margin / 100));
}

/**
 * يُنشئ بنداً افتراضياً لمنتج.
 * - يشمل حقول التسعير (margin_rate, computed_selling_price, override_selling_price, min_selling_price)
 */
function buildDefaultItem(
  product: CatalogProduct,
  marginRate: number = 0
): DraftItem {
  const unitPrice = Number(
    product.wholesale_price ?? product.cost_price ?? 0
  );
  const margin = Number(marginRate) || 0;
  const computedSelling = computeSellingPrice(unitPrice, margin);

  return {
    uid: uid(),
    product_id: product.id,
    paid_quantity: 1,
    bonus_quantity: 0,
    unit_price: unitPrice,
    discount_rate: 0,
    discount_amount: 0,
    tax_rate: 0,
    batch_number: product.live_batch_number || '',
    expiry_date: product.live_expiry_date || '',
    unit_id: null,
    conversion_factor: 1,

    // ✅ التسعير
    margin_rate: margin,
    computed_selling_price: computedSelling,
    override_selling_price: null,
    min_selling_price: computedSelling,   // افتراضي = سعر البيع
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useDraftItems() {
  const [items, setItems] = useState<DraftItem[]>([]);

  // ══════════════════════════════════════════════════════════════
  // إضافة بند
  // ══════════════════════════════════════════════════════════════
  const addItemRow = (
    catalog: CatalogProduct[],
    onError: (msg: string) => void,
    defaultMarginRate: number = 0
  ) => {
    const first = catalog[0];
    if (!first) {
      onError('لا توجد منتجات متاحة لهذا المورد');
      return;
    }
    setItems((prev) => [...prev, buildDefaultItem(first, defaultMarginRate)]);
  };

  // ══════════════════════════════════════════════════════════════
  // حذف بند
  // ══════════════════════════════════════════════════════════════
  const removeItemRow = (uidToRemove: string) => {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((it) => it.uid !== uidToRemove)
    );
  };

  // ══════════════════════════════════════════════════════════════
  // تعديل بند
  // ══════════════════════════════════════════════════════════════
  const updateItemRow = (uidToUpdate: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.uid !== uidToUpdate) return it;

        const next = { ...it, ...patch };

        // ✅ إعادة حساب computed_selling_price عند تغيير سعر الشراء أو الهامش
        if (patch.unit_price !== undefined || patch.margin_rate !== undefined) {
          next.computed_selling_price = computeSellingPrice(
            Number(next.unit_price),
            Number(next.margin_rate)
          );
        }

        // إذا لم يُحدَّد أقل سعر يدوياً → استخدم سعر البيع النهائي
        if (
          patch.unit_price !== undefined ||
          patch.margin_rate !== undefined ||
          patch.override_selling_price !== undefined
        ) {
          if (!next.min_selling_price || next.min_selling_price === 0) {
            next.min_selling_price =
              next.override_selling_price ??
              next.computed_selling_price;
          }
        }

        return next;
      })
    );
  };

  // ══════════════════════════════════════════════════════════════
  // تغيير المنتج
  // ══════════════════════════════════════════════════════════════
  const handleProductChange = (
    uidToUpdate: string,
    newProductId: string,
    catalog: CatalogProduct[],
    defaultMarginRate: number = 0
  ) => {
    const prod = catalog.find((p) => p.id === newProductId);
    if (!prod) {
      updateItemRow(uidToUpdate, { product_id: newProductId });
      return;
    }

    const unitPrice = Number(
      prod.wholesale_price ?? prod.cost_price ?? 0
    );
    const margin = Number(defaultMarginRate) || 0;
    const computedSelling = computeSellingPrice(unitPrice, margin);

    updateItemRow(uidToUpdate, {
      product_id: newProductId,
      unit_id: null,
      conversion_factor: 1,
      unit_price: unitPrice,
      batch_number: prod.live_batch_number || '',
      expiry_date: prod.live_expiry_date || '',
      margin_rate: margin,
      computed_selling_price: computedSelling,
      override_selling_price: null,
      min_selling_price: computedSelling,
    });
  };

  // ══════════════════════════════════════════════════════════════
  // تغيير الوحدة
  // ══════════════════════════════════════════════════════════════
  const handleUnitChange = (
    uidToUpdate: string,
    newUnitId: string | null,
    catalog: CatalogProduct[]
  ) => {
    const item = items.find((it) => it.uid === uidToUpdate);
    if (!item) return;

    const product = catalog.find((p) => p.id === item.product_id);
    if (!product) return;

    const factor = resolveUnitFactor(product, newUnitId);

    // السعر الافتراضي: سعر الوحدة الأساسية
    const basePrice = Number(
      product.wholesale_price ?? product.cost_price ?? 0
    );
    let unitPrice = basePrice;

    // إذا وحدة غير أساسية → نحاول استخدام purchase_price أو basePrice × factor
    if (newUnitId && product.units) {
      const unit = product.units.find((u) => u.unit_id === newUnitId);
      if (unit) {
        if (unit.purchase_price != null && Number(unit.purchase_price) > 0) {
          unitPrice = Number(unit.purchase_price);
        } else {
          unitPrice = basePrice * factor;
        }
      }
    }

    const margin = Number(item.margin_rate) || 0;
    const computedSelling = computeSellingPrice(unitPrice, margin);

    updateItemRow(uidToUpdate, {
      unit_id: newUnitId,
      conversion_factor: factor,
      unit_price: unitPrice,
      computed_selling_price: computedSelling,
      override_selling_price: null,
      min_selling_price: computedSelling,
    });
  };

  // ══════════════════════════════════════════════════════════════
  // تطبيق هامش الربح الافتراضي على كل الأصناف
  // ══════════════════════════════════════════════════════════════
  const applyDefaultMargin = (rate: number) => {
    const margin = Number(rate) || 0;
    setItems((prev) =>
      prev.map((it) => {
        const computedSelling = computeSellingPrice(
          Number(it.unit_price),
          margin
        );
        return {
          ...it,
          margin_rate: margin,
          computed_selling_price: computedSelling,
          // إذا لم يُحدَّد أقل سعر يدوياً → حدّثه
          min_selling_price:
            it.min_selling_price && it.min_selling_price > 0
              ? it.min_selling_price
              : computedSelling,
        };
      })
    );
  };

  return {
    items,
    setItems,
    addItemRow,
    removeItemRow,
    updateItemRow,
    handleProductChange,
    handleUnitChange,
    applyDefaultMargin,
    buildDefaultItem,
  };
}