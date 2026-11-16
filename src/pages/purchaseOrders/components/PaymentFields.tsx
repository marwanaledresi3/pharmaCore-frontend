// pages/purchaseOrders/components/PaymentFields.tsx
import React from 'react';
import { PaymentMethod, PaymentType } from '../../../api/ordersApi';
import { CashRegisterSelect } from '../../../components/common/CashRegisterSelect';
import { useAuth } from '../../../context/AuthContext';
interface Props {
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentTermsDays: number;
  paidAmount: number;
  grandTotal: number;
  baseCurrency: string;
  cashRegisterId?: string | null;
  onChange: (patch: {
    paymentType?: PaymentType;
    paymentMethod?: PaymentMethod;
    paymentTermsDays?: number;
    paidAmount?: number;
    cashRegisterId?: string | null;
  }) => void;
}

export const PaymentFields: React.FC<Props> = ({
  paymentType,
  paymentMethod,
  paymentTermsDays,
  paidAmount,
  grandTotal,
  baseCurrency,
  cashRegisterId,
  onChange,
}) => {
  const { user } = useAuth();
  return (
    <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
      <h4 className="text-xs font-black text-blue-950 mb-3">💳 تفاصيل الدفع</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            نوع الدفع *
          </label>
          <select
            value={paymentType}
            onChange={(e) => onChange({ paymentType: e.target.value as PaymentType })}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="cash">نقدي (Cash)</option>
            <option value="credit">آجل (Credit)</option>
            <option value="partial">جزئي (Partial)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            طريقة الدفع
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => onChange({ paymentMethod: e.target.value as PaymentMethod })}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="cash">صندوق (Cash)</option>
            <option value="bank">بنك (Bank)</option>
            <option value="cheque">شيك (Cheque)</option>
          </select>
        </div>

        {/* ✅ إظهار اختيار الصندوق إذا كان الدفع نقدي عبر الصندوق */}
        {paymentType !== 'credit' && paymentMethod === 'cash' && (
          <CashRegisterSelect
            value={cashRegisterId}
            onChange={(id) => onChange({ cashRegisterId: id })}
            branchId={(user as any)?.branch_id || null}
            required
          />
        )}

        {paymentType !== 'cash' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              أيام السداد
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={paymentTermsDays}
              onChange={(e) => onChange({ paymentTermsDays: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}

        {paymentType !== 'credit' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ المدفوع
            </label>
            <input
              type="number"
              min="0"
              max={grandTotal}
              step="0.01"
              value={paidAmount}
              onChange={(e) => onChange({ paidAmount: Number(e.target.value) })}
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {paymentType === 'cash' ? 'يُملأ تلقائياً بالإجمالي' : 'جزء من الإجمالي'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};