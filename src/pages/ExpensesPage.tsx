import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Trash2, FileText, Download, Eye } from 'lucide-react';
import { expensesApi } from '../api/expensesApi';
import { accountsApi } from '../api/accountsApi';
import { suppliersApi } from '../api/suppliersApi';
import { companyApi } from '../api/companyApi';
import { Expense, Supplier, Currency } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { pdfApi } from '../api/pdfApi1';
export const ExpensesPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseCategory, setExpenseCategory] = useState('other');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [externalReference, setExternalReference] = useState('');

  const loadData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const [expRes, accRes, supRes, curRes] = await Promise.all([
      expensesApi.list({ limit: 100 }),
      accountsApi.list({ type: 'expense' }),
      suppliersApi.list({ is_active: true, limit: 200 }),
      companyApi.listCurrencies(),
    ]);

    // expensesApi.list → PaginatedResult (مضمون)
    setExpenses(expRes.items || []);

    // accountsApi.list → قد يكون { items } أو مصفوفة
    const accountsArr = Array.isArray(accRes)
      ? accRes
      : (accRes as any)?.items ?? [];
    setAccounts(accountsArr);

    // suppliersApi.list → { items }
    const supsArr = Array.isArray(supRes)
      ? supRes
      : (supRes as any)?.items ?? [];
    setSuppliers(supsArr);

    // companyApi.listCurrencies → مصفوفة مباشرة أو { items }
    const curArr = Array.isArray(curRes)
      ? curRes
      : (curRes as any)?.items ?? [];
    setCurrencies(curArr);
  } catch (err: any) {
    setError(err?.message || 'فشل تحميل البيانات');
  } finally {
    setIsLoading(false);
  }
}, []);;

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    const expenseAccounts = accounts.filter((a: any) => a.account_type === 'expense');
    setExpenseAccountId(expenseAccounts[0]?.id || '');
    setCurrencyId(currencies[0]?.id || '');
    setDescription('');
    setAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseCategory('other');
    setPaymentType('cash');
    setPaymentMethod('cash');
    setPaidAmount('');
    setDueDate('');
    setSupplierId('');
    setExternalReference('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return setFormError('البيان مطلوب');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setFormError('المبلغ غير صالح');
    if (!expenseAccountId) return setFormError('يرجى اختيار حساب المصروف');
    if (!currencyId) return setFormError('يرجى اختيار العملة');
    if (paymentType !== 'cash' && !supplierId) {
      return setFormError('المورد مطلوب للمصروف الآجل');
    }
    if (paymentType === 'partial') {
      const paid = Number(paidAmount);
      if (!Number.isFinite(paid) || paid <= 0) return setFormError('المبلغ المدفوع مطلوب');
      if (paid >= amt) return setFormError('المدفوع يجب أن يكون أقل من الإجمالي');
    }

    setFormLoading(true);
    setFormError(null);

    try {
      await expensesApi.create({
        description: description.trim(),
        amount: amt,
        expense_account_id: expenseAccountId,
        currency_id: currencyId,
        expense_date: expenseDate,
        expense_category: expenseCategory,
        payment_type: paymentType,
        payment_method: paymentType !== 'credit' ? paymentMethod : undefined,
        paid_amount: paymentType === 'partial' ? Number(paidAmount) : undefined,
        due_date: paymentType !== 'cash' && dueDate ? dueDate : undefined,
        supplier_id: paymentType !== 'cash' && supplierId ? supplierId : undefined,
        external_reference: externalReference.trim() || undefined,
      });
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'فشل حفظ المصروف');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePay = async (exp: Expense) => {
    const remaining = Number(exp.amount) - Number(exp.paid_amount || 0);
    if (remaining <= 0.01) return window.alert('المصروف مدفوع بالكامل');

    const input = window.prompt(
      `المبلغ المتبقي: ${remaining.toFixed(2)} ${baseCurrency}. أدخل المبلغ المراد دفعه:`,
      remaining.toFixed(2)
    );
    if (!input) return;

    try {
      await expensesApi.pay(exp.id, {
        amount: Number(input),
        method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
      });
      await loadData();
    } catch (err: any) {
      window.alert(err?.message || 'فشل الدفع');
    }
  };

  const handleCancel = async (exp: Expense) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء المصروف ${exp.expense_number}؟`)) return;
    try {
      await expensesApi.cancel(exp.id);
      await loadData();
    } catch (err: any) {
      window.alert(err?.message || 'فشل الإلغاء');
    }
  };

  const expenseAccounts = accounts.filter((a: any) => a.account_type === 'expense');

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">المصروفات</h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل المصروفات التشغيلية — نقداً أو على الحساب
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" /> مصروف جديد
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب المصروفات..." fullHeight />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="لا توجد مصروفات"
            description="ابدأ بتسجيل أول مصروف."
            icon={<FileText className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-3">رقم</th>
                  <th className="py-3 px-3">التاريخ</th>
                  <th className="py-3 px-3">الفئة</th>
                  <th className="py-3 px-3">البيان</th>
                  <th className="py-3 px-3">المورد</th>
                  <th className="py-3 px-3 text-center">المبلغ</th>
                  <th className="py-3 px-3 text-center">المدفوع</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-3 font-mono font-bold">{exp.expense_number}</td>
                    <td className="py-3.5 px-3 font-mono">
                      {String(exp.expense_date).slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-3">{exp.expense_category}</td>
                    <td className="py-3.5 px-3 max-w-[200px] truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-3">{exp.supplier_name || '—'}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {Number(exp.amount).toFixed(2)} {exp.currency_code || baseCurrency}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-700">
                      {Number(exp.paid_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        exp.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        exp.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {exp.status === 'paid' ? 'مدفوع' :
                         exp.status === 'partial' ? 'جزئي' :
                         exp.status === 'cancelled' ? 'ملغي' : 'مرحّل'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-left">
                      <div className="flex items-center justify-end gap-1">
                        {exp.status !== 'paid' && exp.status !== 'cancelled' && (
                          <button
                            onClick={() => handlePay(exp)}
                            title="دفع"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {exp.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(exp)}
                            title="إلغاء"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
  onClick={() => pdfApi.previewExpense(exp.id)}
  title="عرض PDF"
  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
>
  <FileText className="w-4 h-4" />
</button>
<button
  onClick={() => pdfApi.downloadExpensePdf(exp.id, exp.expense_number)}
  title="تحميل PDF"
  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
>
  <Download className="w-4 h-4" />
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="تسجيل مصروف جديد"
        maxWidth="2xl"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* البيان */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: إيجار شهر أكتوبر"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* الحساب + الفئة */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب المصروف *</label>
              <select
                required
                value={expenseAccountId}
                onChange={(e) => setExpenseAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر الحساب --</option>
                {expenseAccounts.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الفئة</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                <option value="rent">إيجار</option>
                <option value="utilities">كهرباء ومياه</option>
                <option value="salaries">رواتب وأجور</option>
                <option value="maintenance">صيانة</option>
                <option value="transport">نقل وشحن</option>
                <option value="office">مستلزمات مكتبية</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>

          {/* المبلغ + العملة + التاريخ */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
              <select
                required
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* نوع الدفع */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نوع الدفع *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'credit', 'partial'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border-2 ${
                    paymentType === t
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {t === 'cash' ? 'نقداً' : t === 'credit' ? 'آجل' : 'جزئي'}
                </button>
              ))}
            </div>
          </div>

          {/* تفاصيل إضافية */}
          {paymentType !== 'credit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                <option value="cash">نقداً</option>
                <option value="bank">حوالة بنكية</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
          )}

          {paymentType === 'partial' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدفوع مقدماً *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
          )}

          {paymentType !== 'cash' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                >
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم فاتورة المورد (اختياري)</label>
            <input
              type="text"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="INV-2026-123"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ المصروف'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};