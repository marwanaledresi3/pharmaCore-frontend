// pages/purchaseOrders/hooks/useTotals.ts
import { useMemo } from 'react';
import { DraftItem, InvoiceTotals } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useTotals — حساب إجماليات الفاتورة
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * القواعد:
 * - المجموع الصافي = Σ (paid_quantity × unit_price)
 * - الخصم = subtotal × (invoiceDiscountRate / 100)
 * - الصافي بعد الخصم = subtotal - discountTotal
 * - الضريبة = Σ (paid_quantity × unit_price × tax_rate / 100)  ← على السعر قبل الخصم
 * - الإجمالي = netAfterDiscount + taxTotal
 *
 * ⚠️ ملاحظة: الضريبة تُحسب على السعر قبل الخصم (لتطابق Backend)
 *            إذا أردت الضريبة بعد الخصم، غيّر taxTotal.
 *
 * @param items — بنود الفاتورة
 * @param isNetworkSupplier — هل المورد شبكي؟ (للتأثير على الحساب — غير مستخدم حالياً)
 * @param invoiceDiscountRate — نسبة الخصم على الفاتورة (0-100)
 * @returns InvoiceTotals
 */
export function useTotals(
  items: DraftItem[],
  isNetworkSupplier: boolean = false,
  invoiceDiscountRate: number = 0
): InvoiceTotals {
  // ─── 1) المجموع الصافي ───
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = Number(it.paid_quantity) || 0;
      const price = Number(it.unit_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

  // ─── 2) الخصم على الفاتورة ───
  const discountTotal = useMemo(() => {
    const rate = Math.max(0, Math.min(100, Number(invoiceDiscountRate) || 0));
    return subtotal * (rate / 100);
  }, [subtotal, invoiceDiscountRate]);

  // ─── 3) الصافي بعد الخصم ───
  const netAfterDiscount = useMemo(() => {
    return Math.max(0, subtotal - discountTotal);
  }, [subtotal, discountTotal]);

  // ─── 4) إجمالي الضرائب ───
  // ملاحظة: نستخدم السعر قبل الخصم (لتطابق Backend)
  const taxTotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = Number(it.paid_quantity) || 0;
      const price = Number(it.unit_price) || 0;
      const taxRate = Number(it.tax_rate) || 0;
      const gross = qty * price;
      return acc + gross * (taxRate / 100);
    }, 0);
  }, [items]);

  // ─── 5) الإجمالي النهائي ───
  const grandTotal = useMemo(() => {
    return netAfterDiscount + taxTotal;
  }, [netAfterDiscount, taxTotal]);

  // ─── 6) الإرجاع ───
  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    netAfterDiscount: round2(netAfterDiscount),
    taxTotal: round2(taxTotal),
    grandTotal: round2(grandTotal),
  };
}

/**
 * تقريب لخانتين عشريتين
 */
function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}