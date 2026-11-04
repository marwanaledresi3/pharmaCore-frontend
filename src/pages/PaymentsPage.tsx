import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  Printer,
  Trash2,
  TrendingDown,
  TrendingUp,
  FileText,
  Download,
  AlertCircle,
  FileCheck,
  User,
} from 'lucide-react';
import { paymentsApi } from '../api/paymentsApi';
import { invoicesApi } from '../api/invoicesApi';
import { suppliersApi } from '../api/suppliersApi';
import { customersApi } from '../api/customersApi';
import { Payment, Invoice, Supplier, Customer } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { pdfApi } from '../api/pdfApi1';

type TargetMode = 'invoice' | 'party';

export const PaymentsPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  /* ---------- Data ---------- */
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'receive' | 'pay'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Create Modal ---------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'receive' | 'pay'>('receive');
  const [targetMode, setTargetMode] = useState<TargetMode>('invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------- Print ---------- */
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  /* ============================================================
   * Load data
   * ============================================================ */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const typeParam = typeFilter === 'all' ? undefined : typeFilter;

      const [pmtsRes, invsRes, supsRes, custsRes] = await Promise.all([
        paymentsApi.list({
          payment_type: typeParam,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        invoicesApi.list({ limit: 200 }),
        suppliersApi.list({ is_active: true, limit: 200 }),
        customersApi.list({ is_active: true, limit: 200 }),
      ]);

      setPayments(pmtsRes.items);
      setInvoices(invsRes.items);
      setSuppliers(supsRes.items);
      setCustomers(custsRes.items);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل السندات');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ============================================================
   * Helpers
   * ============================================================ */
  const eligibleInvoices = (type: 'receive' | 'pay') =>
    invoices.filter(
      (i: any) =>
        (type === 'receive' ? i.invoice_type === 'sales' : i.invoice_type === 'purchase') &&
        ['unpaid', 'partial'].includes(i.status) &&
        Number(i.total) - Number(i.paid_amount || 0) > 0
    );

  const parties = (type: 'receive' | 'pay') =>
    type === 'receive' ? customers : suppliers;

  const openCreateModal = (type: 'receive' | 'pay') => {
    setPaymentType(type);
    setTargetMode('invoice');
    setSelectedInvoiceId('');
    setSelectedPartyId('');
    setExternalReference('');
    setDescription('');
    setAmount('');
    setMethod('cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setFormError(null);
    setIsCreateOpen(true);

    // اختيار افتراضي: أول فاتورة
    const targetInvoices = eligibleInvoices(type);
    const firstInv = targetInvoices[0];
    if (firstInv) {
      setSelectedInvoiceId(firstInv.id);
      const remaining = Number(firstInv.total || 0) - Number(firstInv.paid_amount || 0);
      setAmount(remaining);
    }
  };

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      const remaining = Number(inv.total || 0) - Number(inv.paid_amount || 0);
      setAmount(remaining);
    }
  };

  const fillFullAmount = () => {
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (inv) {
      setAmount(Number(inv.total) - Number(inv.paid_amount || 0));
    }
  };

  /* ============================================================
   * Submit
   * ============================================================ */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // تحقق: البيان دائماً مطلوب
    if (!description.trim()) {
      setFormError('يرجى إدخال البيان');
      return;
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (targetMode === 'invoice') {
      if (!selectedInvoiceId) {
        setFormError('يرجى اختيار الفاتورة');
        return;
      }
      const inv = invoices.find((i) => i.id === selectedInvoiceId);
      if (inv) {
        const remaining = Number(inv.total) - Number(inv.paid_amount || 0);
        if (amt > remaining + 0.01) {
          setFormError(`المبلغ (${amt}) يتجاوز المتبقي (${remaining})`);
          return;
        }
      }
    } else {
      // على الحساب — طرف إجباري
      if (!selectedPartyId) {
        setFormError(
          paymentType === 'receive'
            ? 'يرجى اختيار العميل'
            : 'يرجى اختيار المورد'
        );
        return;
      }
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const payload: any = {
        amount: amt,
        payment_type: paymentType,
        method,
        payment_date: paymentDate,
        description: description.trim(),
        external_reference: externalReference.trim() || undefined,
      };

      if (targetMode === 'invoice') {
        payload.invoice_id = selectedInvoiceId;
      } else {
        if (paymentType === 'receive') {
          payload.customer_id = selectedPartyId;
        } else {
          payload.supplier_id = selectedPartyId;
        }
      }

      await paymentsApi.create(payload);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'فشل تسجيل السند');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السند؟ سيتم عكس القيد المحاسبي.')) return;
    try {
      await paymentsApi.remove(id);
      await loadData();
    } catch (err: any) {
      window.alert(err?.message || 'فشل حذف السند');
    }
  };

  const handleExportCsv = () => {
    const data = payments.map((p: any) => ({
      'رقم السند': p.voucher_number || p.id.slice(0, 8),
      'رقم السند الورقي': p.external_reference || '',
      النوع: p.payment_type === 'receive' ? 'قبض' : 'صرف',
      الفاتورة: p.invoice_number || '',
      الطرف: p.party_name || '',
      البيان: p.description || '',
      التاريخ: p.payment_date ? String(p.payment_date).slice(0, 10) : '',
      الطريقة: p.method === 'cash' ? 'نقد' : p.method === 'bank' ? 'بنك' : 'شيك',
      المبلغ: Number(p.amount),
    }));
    exportToCsv(data, 'payments');
  };

  /* ============================================================
   * Render
   * ============================================================ */
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            سندات القبض والصرف
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل المقبوضات والمدفوعات — على فاتورة أو على الحساب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={payments.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('receive')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <TrendingUp className="w-4 h-4" /> سند قبض
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('pay')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition"
          >
            <TrendingDown className="w-4 h-4" /> سند صرف
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              typeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('receive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              typeFilter === 'receive' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            قبض فقط
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('pay')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              typeFilter === 'pay' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            صرف فقط
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">من:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <span className="text-xs font-bold text-slate-600">إلى:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب السندات..." fullHeight />
        ) : payments.length === 0 ? (
          <EmptyState
            title="لا توجد سندات"
            description="ابدأ بتسجيل سند قبض أو صرف — على فاتورة أو على الحساب."
            icon={<CreditCard className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-3">رقم السند</th>
                  <th className="py-3 px-3">النوع</th>
                  <th className="py-3 px-3">المرجع</th>
                  <th className="py-3 px-3">الطرف</th>
                  <th className="py-3 px-3">البيان</th>
                  <th className="py-3 px-3">التاريخ</th>
                  <th className="py-3 px-3 text-center">المبلغ</th>
                  <th className="py-3 px-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-slate-900">
                        {p.voucher_number || `#${p.id.slice(0, 8)}`}
                      </div>
                      {p.external_reference && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          ورقي: {p.external_reference}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.payment_type === 'receive'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {p.payment_type === 'receive' ? 'قبض' : 'صرف'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      {p.invoice_number ? (
                        <span className="font-bold text-slate-800">#{p.invoice_number}</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">على الحساب</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {p.party_name || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-[200px] truncate" title={p.description || ''}>
                      {p.description || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono">
                      {p.payment_date ? String(p.payment_date).slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900 font-mono">
                      {Number(p.amount).toLocaleString()} {p.currency_code || baseCurrency}
                    </td>
                    <td className="py-3.5 px-3 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => pdfApi.previewPayment(p.id)}
                          title="عرض PDF"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            pdfApi.downloadPaymentPdf(
                              p.id,
                              p.voucher_number || p.id.slice(0, 8)
                            )
                          }
                          title="تحميل PDF"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(p);
                            setIsPrintOpen(true);
                          }}
                          title="طباعة"
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          title="حذف"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ Create Modal ============ */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={paymentType === 'receive' ? 'تسجيل سند قبض' : 'تسجيل سند صرف'}
        maxWidth="2xl"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* تبويب: على فاتورة / على الحساب */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              نوع السند
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetMode('invoice');
                  setSelectedPartyId('');
                  setFormError(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                  targetMode === 'invoice'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                على فاتورة
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetMode('party');
                  setSelectedInvoiceId('');
                  setFormError(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                  targetMode === 'party'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                على الحساب
              </button>
            </div>
          </div>

          {/* الحقل الأساسي: فاتورة أو طرف */}
          {targetMode === 'invoice' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الفاتورة المستهدفة *
              </label>
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر الفاتورة --</option>
                {eligibleInvoices(paymentType).map((inv: any) => {
                  const remaining = Number(inv.total) - Number(inv.paid_amount || 0);
                  return (
                    <option key={inv.id} value={inv.id}>
                      #{inv.invoice_number} | {inv.party_name || '—'} | إجمالي:{' '}
                      {Number(inv.total).toFixed(2)} | متبقي: {remaining.toFixed(2)}
                    </option>
                  );
                })}
              </select>
              {eligibleInvoices(paymentType).length === 0 && (
                <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> لا توجد فواتير غير مسددة — استخدم "على الحساب".
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {paymentType === 'receive' ? 'العميل *' : 'المورد *'}
              </label>
              <select
                required
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="">
                  -- اختر {paymentType === 'receive' ? 'العميل' : 'المورد'} --
                </option>
                {parties(paymentType).map((pt: any) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                    {pt.phone ? ` — ${pt.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                سيُسجَّل المبلغ على حساب {paymentType === 'receive' ? 'العميل' : 'المورد'} مباشرة.
              </p>
            </div>
          )}

          {/* البيان — دائماً مطلوب */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البيان *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                targetMode === 'invoice'
                  ? 'مثال: سداد فاتورة مبيعات'
                  : 'مثال: دفعة على الحساب — شراء أدوية'
              }
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* رقم السند الورقي — اختياري */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم السند الورقي (اختياري)
            </label>
            <input
              type="text"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="مثال: 12345 أو INV-2026-123"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* المبلغ + التاريخ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ ({baseCurrency}) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
                {targetMode === 'invoice' && (
                  <button
                    type="button"
                    onClick={fillFullAmount}
                    className="px-3 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl"
                    title="ملء المبلغ المتبقي"
                  >
                    كامل
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* طريقة السداد */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="cash">نقداً (خزينة الصندوق)</option>
              <option value="bank">إيداع / حوالة بنكية</option>
              <option value="cheque">شيك مصرفي</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50 transition"
            >
              {formLoading ? 'جاري الحفظ...' : 'تأكيد السند'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Print ============ */}
      {selectedPayment && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={selectedPayment.payment_type === 'receive' ? 'سند قبض مالي' : 'سند صرف مالي'}
          documentType={selectedPayment.payment_type === 'receive' ? 'سند قبض' : 'سند صرف'}
          documentNumber={(selectedPayment as any).voucher_number || selectedPayment.id.slice(0, 8)}
          documentDate={selectedPayment.payment_date ? String(selectedPayment.payment_date).slice(0, 10) : ''}
          partyTitle="البيان"
          partyName={(selectedPayment as any).description || '—'}
          partyInfo={`طريقة الدفع: ${
            selectedPayment.method === 'cash'
              ? 'نقداً'
              : selectedPayment.method === 'bank'
                ? 'حوالة بنكية'
                : 'شيك'
          }${
            (selectedPayment as any).external_reference
              ? ` | رقم السند الورقي: ${(selectedPayment as any).external_reference}`
              : ''
          }`}
          currencyCode={selectedPayment.currency_code || baseCurrency}
          company={company}
          summary={[
            {
              label: 'المبلغ المستلم / المدفوع',
              value: Number(selectedPayment.amount || 0),
              isTotal: true,
            },
          ]}
          notes="تم استلام / صرف المبلغ الموضح أعلاه وفقاً للقيود المالية المعتمدة في النظام."
        />
      )}
    </div>
  );
};