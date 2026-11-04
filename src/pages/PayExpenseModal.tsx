import React, { useState, useEffect, useCallback } from 'react';
import { expensesApi } from '../api/expensesApi';
import { Modal } from '../components/common/Modal';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Expense, } from '../types';
interface Props {
  isOpen: boolean;
  expense: Expense;
  baseCurrency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayExpenseModal: React.FC<Props> = ({
  isOpen, expense, baseCurrency, onClose, onSuccess,
}) => {
  const remaining = Math.max(
    0,
    Number(expense.amount || 0) - Number(expense.paid_amount || 0)
  );

  const [amount, setAmount] = useState<number | string>(remaining);
  const [method, setMethod] = useState<'cash' | 'bank' | 'cheque'>('bank');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString('en-CA')   // YYYY-MM-DD محلي
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    if (amt > remaining + 0.01) {
      setError(`المبلغ لا يمكن أن يتجاوز المتبقي (${remaining})`);
      return;
    }

    setLoading(true);
    try {
      await expensesApi.pay(expense.id, {
        amount: amt,
        method,
        payment_date: paymentDate,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`دفع مصروف ${expense.expense_number}`} maxWidth="md">
      {error && <ErrorAlert error={error} className="mb-4" />}

      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex justify-between mb-1">
          <span className="text-slate-500">الإجمالي:</span>
          <span className="font-mono font-bold">{Number(expense.amount).toLocaleString()} {baseCurrency}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-slate-500">المدفوع:</span>
          <span className="font-mono text-emerald-700">{Number(expense.paid_amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">المتبقي:</span>
          <span className="font-mono font-bold text-rose-600">{remaining.toLocaleString()} {baseCurrency}</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ *</label>
          <input
            type="number" step="0.01" min="0.01" max={remaining}
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
          <select
            value={method} onChange={(e) => setMethod(e.target.value as any)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
          >
            <option value="cash">نقداً</option>
            <option value="bank">حوالة بنكية</option>
            <option value="cheque">شيك</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الدفع *</label>
          <input
            type="date" required value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl disabled:opacity-50">
            {loading ? 'جاري الدفع...' : 'تأكيد الدفع'}
          </button>
        </div>
      </form>
    </Modal>
  );
};