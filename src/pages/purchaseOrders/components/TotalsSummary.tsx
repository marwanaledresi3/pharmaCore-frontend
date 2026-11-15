// pages/purchaseOrders/components/TotalsSummary.tsx
import React from 'react';
import { PaymentType } from '../../../api/ordersApi';

interface Props {
  subtotal: number;
  discountTotal: number;
  netAfterDiscount: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  paymentType: PaymentType;
  baseCurrency: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TotalsSummary — ملخص إجماليات الفاتورة
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * يعرض:
 * - المجموع الصافي
 * - الخصم (إن وُجد)
 * - الصافي بعد الخصم (إن وُجد خصم)
 * - الضريبة (إن وُجدت)
 * - الإجمالي النهائي
 * - المدفوع (إن لم يكن آجل)
 * - المتبقي (إن لم يكن آجل)
 */
export const TotalsSummary: React.FC<Props> = ({
  subtotal,
  discountTotal,
  netAfterDiscount,
  taxTotal,
  grandTotal,
  paidAmount,
  paymentType,
  baseCurrency,
}) => {
  const formatNumber = (n: number) =>
    (Number(n) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const hasDiscount = discountTotal > 0;
  const hasTax = taxTotal > 0;
  const isCredit = paymentType === 'credit';
  const hasPayment = !isCredit && paidAmount > 0;
  const remaining = grandTotal - paidAmount;

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black text-slate-800">ملخص الفاتورة</h4>
        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {baseCurrency}
        </span>
      </div>

      {/* 1) المجموع الصافي */}
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">المجموع الصافي:</span>
        <span className="font-mono font-bold text-slate-800">
          {formatNumber(subtotal)} {baseCurrency}
        </span>
      </div>

      {/* 2) الخصم (إن وُجد) */}
      {hasDiscount && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">الخصم:</span>
          <span className="font-mono font-bold text-rose-600">
            -{formatNumber(discountTotal)} {baseCurrency}
          </span>
        </div>
      )}

      {/* 3) الصافي بعد الخصم (إن وُجد خصم) */}
      {hasDiscount && (
        <div className="flex justify-between text-xs border-t border-slate-200 pt-1.5">
          <span className="text-slate-600">الصافي بعد الخصم:</span>
          <span className="font-mono font-bold text-slate-800">
            {formatNumber(netAfterDiscount)} {baseCurrency}
          </span>
        </div>
      )}

      {/* 4) الضريبة (إن وُجدت) */}
      {hasTax && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">الضريبة:</span>
          <span className="font-mono font-bold text-sky-700">
            {formatNumber(taxTotal)} {baseCurrency}
          </span>
        </div>
      )}

      {/* 5) الإجمالي النهائي */}
      <div className="flex justify-between border-t-2 border-slate-300 pt-2 font-bold text-sm">
        <span className="text-slate-900">الإجمالي:</span>
        <span className="font-mono text-emerald-700 text-base">
          {formatNumber(grandTotal)} {baseCurrency}
        </span>
      </div>

      {/* 6) المدفوع (إن لم يكن آجل) */}
      {hasPayment && (
        <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
          <span className="text-slate-600">المدفوع:</span>
          <span className="font-mono font-bold text-emerald-700">
            {formatNumber(paidAmount)} {baseCurrency}
          </span>
        </div>
      )}

      {/* 7) المتبقي (إن لم يكن آجل) */}
      {!isCredit && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">المتبقي:</span>
          <span
            className={`font-mono font-bold ${
              remaining > 0.01 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {formatNumber(Math.max(0, remaining))} {baseCurrency}
          </span>
        </div>
      )}

      {/* 8) حالة الدفع */}
      <div className="flex justify-center pt-2 border-t border-slate-200">
        {(() => {
          const config = {
            cash: {
              label: 'نقدي',
              color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              icon: '💵',
            },
            credit: {
              label: 'آجل',
              color: 'bg-amber-100 text-amber-800 border-amber-200',
              icon: '📅',
            },
            partial: {
              label: 'جزئي',
              color: 'bg-sky-100 text-sky-800 border-sky-200',
              icon: '💰',
            },
          } as const;

          const c = config[paymentType] || config.cash;

          return (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${c.color}`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </span>
          );
        })()}
      </div>
    </div>
  );
};