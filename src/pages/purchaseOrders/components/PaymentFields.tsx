import React from 'react';
import { CreditCard, Calendar } from 'lucide-react';
import { PaymentMethod, PaymentType } from '../../../api/ordersApi';
import { PAYMENT_TYPE_LABELS } from '../constants';

interface Props {
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentTermsDays: number;
  paidAmount: number;
  grandTotal: number;
  baseCurrency: string;
  onChange: (patch: {
    paymentType?: PaymentType;
    paymentMethod?: PaymentMethod;
    paymentTermsDays?: number;
    paidAmount?: number;
  }) => void;
}

export const PaymentFields: React.FC<Props> = ({
  paymentType,
  paymentMethod,
  paymentTermsDays,
  paidAmount,
  grandTotal,
  baseCurrency,
  onChange,
}) => {
  return (
    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-blue-700" />
        <h4 className="text-xs font-black text-blue-900">طريقة الدفع</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">نوع الدفع *</label>
          <select
            value={paymentType}
            onChange={(e) => onChange({ paymentType: e.target.value as PaymentType })}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="cash">💵 نقد</option>
            <option value="credit">📅 آجل</option>
            <option value="partial">💰 جزئي</option>
          </select>
        </div>

        {paymentType !== 'credit' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
            <select
              value={paymentMethod}
              onChange={(e) => onChange({ paymentMethod: e.target.value as PaymentMethod })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="cash">نقد</option>
              <option value="bank">تحويل بنكي</option>
              <option value="cheque">شيك</option>
              <option value="card">بطاقة</option>
              <option value="wallet">محفظة</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        )}

        {paymentType !== 'cash' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">مدة السداد (أيام)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={paymentTermsDays}
              onChange={(e) => onChange({ paymentTermsDays: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
        )}

        {paymentType === 'partial' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => onChange({ paidAmount: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              الباقي: {(grandTotal - paidAmount).toFixed(2)} {baseCurrency}
            </span>
          </div>
        )}
      </div>

      {paymentType === 'credit' && (
        <p className="text-[11px] text-slate-500 mt-2">
          <Calendar className="w-3 h-3 inline mr-1" />
          الاستحقاق بعد {paymentTermsDays} يوماً من تاريخ الطلب
        </p>
      )}
    </div>
  );
};