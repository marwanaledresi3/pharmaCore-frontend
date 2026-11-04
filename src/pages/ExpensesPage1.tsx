import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  RefreshCw,
  Printer,
  Eye,
  Download,
  XCircle,
  FileText,
  Wallet,
} from 'lucide-react';
import { expensesApi } from '../api/expensesApi';
import { suppliersApi } from '../api/suppliersApi';
import { accountsApi } from '../api/accountsApi';
import { companyApi } from '../api/companyApi';
import { Expense, Supplier, Account, Currency, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { PayExpenseModal } from './PayExpenseModal';
import { useAuth } from '../context/AuthContext';
import { pdfApi } from '../api/pdfApi1';
/* ============================================================
 * Constants
 * ============================================================ */

const EXPENSE_CATEGORIES = [
  { value: 'rent',        label: 'إيجار',           icon: '🏢', defaultCode: '513' },
  { value: 'utilities',   label: 'كهرباء ومياه',    icon: '💡', defaultCode: '514' },
  { value: 'salaries',    label: 'رواتب وأجور',     icon: '👥', defaultCode: '512' },
  { value: 'maintenance', label: 'صيانة',           icon: '🔧', defaultCode: '515' },
  { value: 'transport',   label: 'نقل وشحن',        icon: '🚚', defaultCode: '516' },
  { value: 'office',      label: 'مستلزمات مكتبية', icon: '📎', defaultCode: '517' },
  { value: 'other',       label: 'أخرى',            icon: '📋', defaultCode: '518' },
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'نقداً', credit: 'آجل', partial: 'جزئي',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقداً', bank: 'حوالة بنكية', cheque: 'شيك',
};

/* ============================================================
 * Component
 * ============================================================ */

export const ExpensesPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  /* ---------- Data ---------- */
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- References ---------- */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [refsError, setRefsError] = useState<string | null>(null);

  /* ---------- Create Modal ---------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [expenseDate, setExpenseDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [currencyId, setCurrencyId] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [externalReference, setExternalReference] = useState('');

  /* ---------- Details / Print / Pay ---------- */
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [payExpenseTarget, setPayExpenseTarget] = useState<Expense | null>(null);

  /* ============================================================
   * Load
   * ============================================================ */

  const loadReferences = useCallback(async () => {
    setRefsError(null);
    try {
      const [supRes, curRes, accRes] = await Promise.all([
        suppliersApi.list({ is_active: true, limit: 200 }),
        companyApi.listCurrencies(),
        accountsApi.list(),
      ]);
      setSuppliers(supRes.items || []);
      setCurrencies(curRes || []);

      const allAccounts: Account[] = Array.isArray(accRes) ? accRes : (accRes as any)?.items || [];
      const expAccs = allAccounts.filter(
        (a) => a.account_type === 'expense' && (!a.children || a.children.length === 0)
      );
      setExpenseAccounts(expAccs);
    } catch (err: any) {
      console.error('[refs] failed:', err);
      setRefsError('تعذر تحميل الحسابات والموردين والعملات. حاول التحديث.');
    }
  }, []);

  const loadExpenses = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await expensesApi.list({
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          limit: 15,
        });
        setExpenses(res.items);
        setPagination(res.pagination);
      } catch (err: any) {
        setError(err?.message || 'فشل تحميل المصروفات');
      } finally {
        setIsLoading(false);
      }
    },
    [categoryFilter, dateFrom, dateTo]
  );

  useEffect(() => { loadReferences(); }, [loadReferences]);
  useEffect(() => { loadExpenses(1); }, [loadExpenses]);

  /* ============================================================
   * Create modal
   * ============================================================ */

  const openCreateModal = () => {
    const firstCurrency =
      currencies.find((c) => c.code === baseCurrency)?.id || currencies[0]?.id || '';

    setExpenseDate(new Date().toLocaleDateString('en-CA'));
    setCategory('rent');
    setExpenseAccountId('');
    setSupplierId('');
    setDescription('');
    setAmount('');
    setCurrencyId(firstCurrency);
    setPaymentType('cash');
    setPaymentMethod('cash');
    setPaidAmount(0);
    setDueDate('');
    setExternalReference('');
    setFormError(null);
    setIsCreateOpen(true);

    const defaultCode = EXPENSE_CATEGORIES.find((c) => c.value === 'rent')?.defaultCode;
    const matched = expenseAccounts.find((a) => a.code === defaultCode);
    if (matched) setExpenseAccountId(matched.id);
  };

  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    const defaultCode = EXPENSE_CATEGORIES.find((c) => c.value === newCat)?.defaultCode;
    const matched = expenseAccounts.find((a) => a.code === defaultCode);
    if (matched) setExpenseAccountId(matched.id);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) { setFormError('البيان مطلوب'); return; }
    if (!expenseAccountId) { setFormError('يرجى اختيار حساب المصروف'); return; }
    if (!currencyId) { setFormError('يرجى اختيار العملة'); return; }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setFormError('المبلغ يجب أن يكون أكبر من صفر'); return; }

    if ((paymentType === 'credit' || paymentType === 'partial') && !supplierId) {
      setFormError('المصروف الآجل يتطلب اختيار مورد'); return;
    }

    if (paymentType === 'partial') {
      const paid = Number(paidAmount);
      if (!Number.isFinite(paid) || paid <= 0 || paid >= amt) {
        setFormError('المبلغ المدفوع يجب أن يكون أكبر من صفر وأقل من الإجمالي');
        return;
      }
    }

    if (paymentType !== 'cash' && dateFrom && dateTo && dateFrom > dateTo) {
      setFormError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    setFormLoading(true);
    try {
      await expensesApi.create({
        expense_date: expenseDate,
        expense_category: category,
        expense_account_id: expenseAccountId,
        supplier_id: supplierId || undefined,
        description: description.trim(),
        amount: amt,
        currency_id: currencyId,
        payment_type: paymentType,
        payment_method: paymentType !== 'credit' ? paymentMethod : undefined,
        paid_amount: paymentType === 'partial' ? Number(paidAmount) : undefined,
        due_date: paymentType !== 'cash' ? dueDate || undefined : undefined,
        external_reference: externalReference.trim() || undefined,
      });
      setIsCreateOpen(false);
      await loadExpenses(1);
    } catch (err: any) {
      setFormError(err?.message || 'فشل تسجيل المصروف');
    } finally {
      setFormLoading(false);
    }
  };

  /* ============================================================
   * Actions
   * ============================================================ */

  const handleCancel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا المصروف؟ سيتم إنشاء قيد عكسي.')) return;
    setActionLoading(true);
    try {
      await expensesApi.cancel(id);
      await loadExpenses(pagination.page);
    } catch (err: any) {
      window.alert(err?.message || 'فشل إلغاء المصروف');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    const data = expenses.map((e) => ({
      'رقم المصروف': e.expense_number,
      'التاريخ': e.expense_date ? String(e.expense_date).slice(0, 10) : '',
      'الفئة': EXPENSE_CATEGORIES.find((c) => c.value === e.expense_category)?.label || e.expense_category,
      'البيان': e.description,
      'المورد': e.supplier_name || '',
      'المبلغ': Number(e.amount),
      'المدفوع': Number(e.paid_amount || 0),
      'نوع الدفع': PAYMENT_TYPE_LABELS[e.payment_type] || e.payment_type,
      'الحالة': e.status,
    }));
    exportToCsv(data, 'expenses');
  };

  /* ============================================================
   * Helpers
   * ============================================================ */

  const categoryLabel = (cat: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const categoryIcon = (cat: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === cat)?.icon || '📋';

  /* ============================================================
   * Render
   * ============================================================ */

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">المصروفات التشغيلية</h1>
          <p className="text-xs text-slate-500 mt-1">
            إيجار، كهرباء، رواتب، صيانة، نقل — تُسجَّل كمصروفات بدون مخزون
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={expenses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" /> مصروف جديد
          </button>
        </div>
      </div>

      {refsError && <ErrorAlert error={refsError} onRetry={loadReferences} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              categoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                categoryFilter === c.value ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">من:</span>
          <input
            type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <span className="text-xs font-bold text-slate-600">إلى:</span>
          <input
            type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <button
            type="button" onClick={() => loadExpenses(pagination.page)} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl" title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadExpenses(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب المصروفات..." fullHeight />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="لا توجد مصروفات"
            description="ابدأ بتسجيل المصروفات التشغيلية (إيجار، كهرباء، رواتب...)."
            icon={<Receipt className="w-8 h-8" />}
            actionLabel="تسجيل أول مصروف"
            onAction={openCreateModal}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-3">رقم المصروف</th>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">الفئة</th>
                    <th className="py-3 px-3">البيان</th>
                    <th className="py-3 px-3">المورد</th>
                    <th className="py-3 px-3 text-center">المبلغ</th>
                    <th className="py-3 px-3 text-center">المدفوع</th>
                    <th className="py-3 px-3 text-center">نوع الدفع</th>
                    <th className="py-3 px-3 text-center">الحالة</th>
                    <th className="py-3 px-3 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {e.expense_number}
                        {e.external_reference && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            ورقي: {e.external_reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {e.expense_date ? String(e.expense_date).slice(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {categoryIcon(e.expense_category)} {categoryLabel(e.expense_category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 max-w-[250px] truncate" title={e.description}>
                        {e.description || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {e.supplier_name || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold font-mono">
                        {Number(e.amount || 0).toLocaleString()} {baseCurrency}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-emerald-700">
                        {Number(e.paid_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {PAYMENT_TYPE_LABELS[e.payment_type] || e.payment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="py-3.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {/* تفاصيل */}
                          <button
                            type="button"
                            onClick={() => { setSelectedExpense(e); setIsDetailsOpen(true); }}
                            title="تفاصيل"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* طباعة (client-side) */}
                          <button
                            type="button"
                            onClick={() => { setSelectedExpense(e); setIsPrintOpen(true); }}
                            title="طباعة"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* دفع (للمصروفات غير النقدية فقط) */}
                          {['posted', 'partial'].includes(e.status) && e.payment_type !== 'cash' && (
                            <button
                              type="button"
                              onClick={() => setPayExpenseTarget(e)}
                              disabled={actionLoading}
                              title="تسجيل الدفع"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                          )}

                          {/* إلغاء (ما لم يكن مدفوعاً أو ملغى) */}
                          {['draft', 'posted', 'partial'].includes(e.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(e.id)}
                              disabled={actionLoading}
                              title="إلغاء"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => pdfApi.previewExpense(e.id)}
                          title="عرض PDF"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => pdfApi.downloadExpensePdf(e.id, e.expense_number)}
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
            <Pagination pagination={pagination} onPageChange={loadExpenses} />
          </>
        )}
      </div>

      {/* ============ Create Modal ============ */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="تسجيل مصروف جديد" maxWidth="2xl">
        {formError && <ErrorAlert error={formError} className="mb-4" />}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* الفئة */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">فئة المصروف *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.value} type="button" onClick={() => handleCategoryChange(c.value)}
                  className={`flex items-center justify-center gap-1 px-2 py-2 text-xs font-bold rounded-xl border-2 transition ${
                    category === c.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{c.icon}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* التاريخ + البيان */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
              <input
                type="date" required value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البيان *</label>
              <input
                type="text" required value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: إيجار شهر أكتوبر"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>
          </div>

          {/* حساب المصروف */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حساب المصروف *</label>
            <select
              required value={expenseAccountId}
              onChange={(e) => setExpenseAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            >
              <option value="">-- اختر حساب المصروف --</option>
              {expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>
              ))}
            </select>
          </div>

          {/* المبلغ + العملة */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ *</label>
              <input
                type="number" step="0.01" min="0.01" required value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
              <select
                required value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* نوع الدفع */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الدفع *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'credit', 'partial'] as const).map((pt) => (
                <button
                  key={pt} type="button" onClick={() => setPaymentType(pt)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition ${
                    paymentType === pt
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {PAYMENT_TYPE_LABELS[pt]}
                </button>
              ))}
            </div>
          </div>

          {/* طريقة الدفع */}
          {paymentType !== 'credit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
              <select
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                <option value="cash">نقداً</option>
                <option value="bank">حوالة بنكية</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
          )}

          {/* المبلغ المدفوع (للجزئي) */}
          {paymentType === 'partial' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع مقدماً *</label>
              <input
                type="number" step="0.01" min="0.01" required value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                المتبقي: {Math.max(0, Number(amount || 0) - Number(paidAmount || 0)).toFixed(2)} {baseCurrency}
              </p>
            </div>
          )}

          {/* تاريخ الاستحقاق */}
          {paymentType !== 'cash' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الاستحقاق <span className="text-slate-400">(افتراضي: +30 يوم)</span>
              </label>
              <input
                type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
          )}

          {/* المورد */}
          {(paymentType === 'credit' || paymentType === 'partial') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
              <select
                required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* مرجع ورقي */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة الورقية (اختياري)</label>
            <input
              type="text" value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="مثال: INV-2026-123"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit" disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ المصروف'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Details Modal ============ */}
      {selectedExpense && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`تفاصيل المصروف: ${selectedExpense.expense_number}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">رقم المصروف</span>
                <span className="font-mono font-bold">{selectedExpense.expense_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold">
                  {selectedExpense.expense_date ? String(selectedExpense.expense_date).slice(0, 10) : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الفئة</span>
                <span className="font-bold">
                  {categoryIcon(selectedExpense.expense_category)} {categoryLabel(selectedExpense.expense_category)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedExpense.status} />
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">البيان</span>
                <span className="font-medium">{selectedExpense.description}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">المورد</span>
                <span>{selectedExpense.supplier_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">المبلغ</span>
                <span className="font-mono font-black text-amber-700">
                  {Number(selectedExpense.amount || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">المدفوع</span>
                <span className="font-mono text-emerald-700">
                  {Number(selectedExpense.paid_amount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">المتبقي</span>
                <span className="font-mono text-rose-600">
                  {Math.max(0, Number(selectedExpense.amount || 0) - Number(selectedExpense.paid_amount || 0)).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">نوع الدفع</span>
                <span className="font-bold">
                  {PAYMENT_TYPE_LABELS[selectedExpense.payment_type] || selectedExpense.payment_type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">طريقة الدفع</span>
                <span>{PAYMENT_METHOD_LABELS[selectedExpense.payment_method || ''] || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">تاريخ الاستحقاق</span>
                <span className="font-mono">
                  {selectedExpense.due_date ? String(selectedExpense.due_date).slice(0, 10) : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">رقم الفاتورة الورقية</span>
                <span className="font-mono">{selectedExpense.external_reference || '—'}</span>
              </div>
            </div>

                       {/* Actions داخل التفاصيل */}
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDetailsOpen(false);
                  setIsPrintOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                <Printer className="w-4 h-4" /> طباعة
              </button>

              {['posted', 'partial'].includes(selectedExpense.status) &&
                selectedExpense.payment_type !== 'cash' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setPayExpenseTarget(selectedExpense);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl"
                  >
                    <Wallet className="w-4 h-4" /> تسجيل الدفع
                  </button>
                )}
            </div>
          </div>
        </Modal>
      )}

      {/* ============ Print Preview ============ */}
      {selectedExpense && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="سند مصروف"
          documentType="EXPENSE"
          documentNumber={selectedExpense.expense_number}
          documentDate={
            selectedExpense.expense_date
              ? String(selectedExpense.expense_date).slice(0, 10)
              : '—'
          }
          partyTitle="المورد"
          partyName={selectedExpense.supplier_name || undefined}
          partyInfo={
            selectedExpense.external_reference
              ? `مرجع: ${selectedExpense.external_reference}`
              : undefined
          }
          currencyCode={selectedExpense.currency_code || baseCurrency}
          company={company}
          items={[]}
          summary={[
            { label: 'البيان', value: selectedExpense.description || '—' },
            { label: 'الفئة', value: categoryLabel(selectedExpense.expense_category) },
            {
              label: 'نوع الدفع',
              value: PAYMENT_TYPE_LABELS[selectedExpense.payment_type] || selectedExpense.payment_type,
            },
            { label: 'الإجمالي', value: Number(selectedExpense.amount || 0), isTotal: false },
            { label: 'المدفوع', value: Number(selectedExpense.paid_amount || 0) },
            {
              label: 'المتبقي',
              value: Math.max(
                0,
                Number(selectedExpense.amount || 0) - Number(selectedExpense.paid_amount || 0)
              ),
              isTotal: true,
            },
          ]}
          notes={
            selectedExpense.payment_method
              ? `طريقة الدفع: ${PAYMENT_METHOD_LABELS[selectedExpense.payment_method] || '—'}`
              : undefined
          }
          hasBackendPdf={false}
        />
      )}

      {/* ============ Pay Modal ============ */}
      {payExpenseTarget && (
        <PayExpenseModal
          isOpen={!!payExpenseTarget}
          expense={payExpenseTarget}
          baseCurrency={baseCurrency}
          onClose={() => setPayExpenseTarget(null)}
          onSuccess={() => {
            setPayExpenseTarget(null);
            loadExpenses(pagination.page);
          }}
        />
      )}
    </div>
  );
};

export default ExpensesPage;