import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, RefreshCw, Printer, Download, CreditCard,
  XCircle, Eye, TrendingUp, TrendingDown,
} from 'lucide-react';
import { invoicesApi } from '../api/invoicesApi';
import { paymentsApi } from '../api/paymentsApi';
import { pdfApi } from '../api/pdfApi1';
import { Invoice, Payment, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { downloadInvoicePdf } from '../utils/downloadInvoicePdf';
type InvoiceTypeFilter = 'all' | 'sales' | 'purchase';

const INVOICE_TYPE_LABELS: Record<string, string> = {
  sales: 'فاتورة بيع',
  purchase: 'فاتورة شراء',
  sales_return: 'مرتجع بيع',
  purchase_return: 'مرتجع شراء',
};

const INVOICE_TYPE_STYLES: Record<string, string> = {
  sales: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purchase: 'bg-blue-50 text-blue-700 border-blue-200',
  sales_return: 'bg-amber-50 text-amber-700 border-amber-200',
  purchase_return: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const InvoicesPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const loadInvoices = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'all' ? undefined : (statusFilter as 'unpaid' | 'partial' | 'paid' | 'cancelled');
      const res = await invoicesApi.list({
        invoice_type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusParam,
        page,
        limit: 15,
      });
      setInvoices(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل الفواتير');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { loadInvoices(1); }, [loadInvoices]);

  const openDetailsModal = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDetailsOpen(true);
    try {
      const [fullInv, pmts] = await Promise.all([
        invoicesApi.getOne(inv.id),
        invoicesApi.getPayments(inv.id),
      ]);
      setSelectedInvoice(fullInv);
      setPayments(pmts);
    } catch { /* silent */ }
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = Number(inv.total || 0) - Number(inv.paid_amount || 0);
    setPayAmount(remaining > 0 ? remaining : Number(inv.total));
    setPayMethod('cash');
    setPayError(null);
    setIsPayOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) return setPayError('مبلغ غير صالح');
    setPayLoading(true);
    setPayError(null);
    try {
      await paymentsApi.create({
        invoice_id: selectedInvoice.id,
        amount,
        payment_type: selectedInvoice.invoice_type === 'sales' ? 'receive' : 'pay',
        method: payMethod,
      });
      setIsPayOpen(false);
      setIsDetailsOpen(false);
      alert('تم تسجيل الدفعة بنجاح');
      loadInvoices(pagination.page);
    } catch (err: any) {
      setPayError(err?.message || 'فشل تسجيل الدفعة');
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟')) return;
    try {
      await invoicesApi.cancel(id);
      setIsDetailsOpen(false);
      loadInvoices(pagination.page);
    } catch (err: any) {
      alert(err?.message || 'فشل إلغاء الفاتورة');
    }
  };

  const handleExportCsv = () => {
    const exportData = invoices.map((inv) => ({
      'رقم الفاتورة': inv.invoice_number,
      النوع: INVOICE_TYPE_LABELS[inv.invoice_type] || inv.invoice_type,
      الطرف: inv.party_name || '',
      التاريخ: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
      الإجمالي: inv.total,
      'المدفوع': inv.paid_amount,
      'المتبقي': Number(inv.total || 0) - Number(inv.paid_amount || 0),
      الحالة: inv.status,
    }));
    exportToCsv(exportData, 'invoices_list');
  };

  const totalSales = invoices.filter((i) => i.invoice_type === 'sales').reduce((s, i) => s + Number(i.total), 0);
  const totalPurchases = invoices.filter((i) => i.invoice_type === 'purchase').reduce((s, i) => s + Number(i.total), 0);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل الفواتير المالية</h1>
          <p className="text-xs text-slate-500 mt-1">فواتير المبيعات والمشتريات، متابعة التحصيل والسداد</p>
        </div>
        <button onClick={handleExportCsv} disabled={invoices.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
          <Download className="w-4 h-4" /> تصدير CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <TrendingUp className="w-4 h-4" /> إجمالي المبيعات (على الصفحة)
          </div>
          <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
            {totalSales.toFixed(2)} {baseCurrency}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
            <TrendingDown className="w-4 h-4" /> إجمالي المشتريات (على الصفحة)
          </div>
          <p className="text-2xl font-black font-mono text-blue-900 mt-1">
            {totalPurchases.toFixed(2)} {baseCurrency}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          {(['all', 'sales', 'purchase'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                typeFilter === t
                  ? t === 'sales' ? 'bg-emerald-600 text-white'
                    : t === 'purchase' ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {t === 'all' ? 'الكل' : t === 'sales' ? 'فواتير المبيعات' : 'فواتير المشتريات'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700">
            <option value="all">جميع حالات السداد</option>
            <option value="unpaid">غير مدفوعة</option>
            <option value="partial">مدفوعة جزئياً</option>
            <option value="paid">مدفوعة بالكامل</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <button onClick={() => loadInvoices(pagination.page)} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadInvoices(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب الفواتير..." fullHeight />
        ) : invoices.length === 0 ? (
          <EmptyState title="لا توجد فواتير" description="لم تُصدر أو تستلم أي فاتورة بعد."
            icon={<FileText className="w-8 h-8" />} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">الطرف</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4 text-center">الإجمالي</th>
                    <th className="py-3 px-4 text-center">المدفوع</th>
                    <th className="py-3 px-4 text-center">المتبقي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv: any) => {
                    const remaining = Number(inv.total || 0) - Number(inv.paid_amount || 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-900">#{inv.invoice_number}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${INVOICE_TYPE_STYLES[inv.invoice_type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {INVOICE_TYPE_LABELS[inv.invoice_type] || inv.invoice_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {inv.party_name || inv.customer_name || inv.supplier_name || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          {Number(inv.total || 0).toFixed(2)} {inv.currency_code || baseCurrency}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-700">
                          {Number(inv.paid_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">
                          {remaining > 0 ? remaining.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3.5 px-4 text-center"><StatusBadge status={inv.status} /></td>
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-1">
                            {remaining > 0 && inv.status !== 'cancelled' && (
                              <button onClick={() => openPaymentModal(inv)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="تسجيل دفعة">
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            <button
                                type="button"
                                onClick={() => pdfApi.previewInvoice(inv.id)}
                                title="عرض PDF"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDetailsModal(inv)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="تفاصيل">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice(inv); setIsPrintOpen(true); }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg" title="طباعة">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={loadInvoices} />
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedInvoice && (
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)}
          title={`فاتورة: #${selectedInvoice.invoice_number}`} maxWidth="4xl">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">النوع</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${INVOICE_TYPE_STYLES[selectedInvoice.invoice_type] || ''}`}>
                  {INVOICE_TYPE_LABELS[selectedInvoice.invoice_type] || selectedInvoice.invoice_type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الطرف</span>
                <span className="font-bold text-slate-900">{(selectedInvoice as any).party_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold">
                  {selectedInvoice.invoice_date ? String(selectedInvoice.invoice_date).slice(0, 10) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الإجمالي</span>
                <span className="font-mono font-bold">{Number(selectedInvoice.total || 0).toFixed(2)} {baseCurrency}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">الصنف</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">السعر</th>
                    <th className="py-2.5 px-3 text-center">الضريبة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedInvoice.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.product_name || 'صنف'}
                        {it.sku && <span className="text-slate-400 mr-1 font-mono">({it.sku})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{Number(it.unit_price).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {it.tax_rate ? `${it.tax_rate}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold font-mono">{Number(it.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">الدفعات المسجلة</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">الطريقة</th>
                        <th className="p-2">المرجع</th>
                        <th className="p-2 text-left">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2 font-mono">{String(p.payment_date).slice(0, 10)}</td>
                          <td className="p-2">{p.method === 'cash' ? 'نقداً' : p.method === 'bank' ? 'حوالة' : 'شيك'}</td>
                          <td className="p-2 font-mono text-slate-400">{p.reference || '-'}</td>
                          <td className="p-2 text-left font-bold font-mono text-emerald-700">
                            {Number(p.amount).toFixed(2)} {baseCurrency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button onClick={async () => {
  if (!selectedInvoice) return;
  await downloadInvoicePdf(selectedInvoice, company);
}}>
  <Download className="w-4 h-4" /> تحميل PDF
</button>
                <button onClick={() => pdfApi.downloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoice_number)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                  <button onClick={() => openPaymentModal(selectedInvoice)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
                    <CreditCard className="w-4 h-4" /> دفعة سداد
                  </button>
                )}
                {selectedInvoice.status !== 'cancelled' && Number(selectedInvoice.paid_amount) === 0 && (
                  <button onClick={() => handleCancelInvoice(selectedInvoice.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg">
                    <XCircle className="w-4 h-4" /> إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {selectedInvoice && (
        <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)}
          title={`تسجيل دفعة #${selectedInvoice.invoice_number}`}>
          {payError && <ErrorAlert error={payError} className="mb-4" />}
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">الطرف:</span><span className="font-bold">{(selectedInvoice as any).party_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">الإجمالي:</span><span className="font-mono font-bold">{Number(selectedInvoice.total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">المتبقي:</span><span className="font-mono font-bold text-rose-600">{(Number(selectedInvoice.total) - Number(selectedInvoice.paid_amount || 0)).toFixed(2)}</span></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({baseCurrency}) *</label>
              <input type="number" step="0.01" min="0.01" required value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد *</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs">
                <option value="cash">نقداً</option>
                <option value="bank">حوالة بنكية</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button type="button" onClick={() => setIsPayOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
              <button type="submit" disabled={payLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50">
                {payLoading ? '...' : 'تأكيد السداد'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Print */}
      {selectedInvoice && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={INVOICE_TYPE_LABELS[selectedInvoice.invoice_type] || 'فاتورة'}
          documentType={INVOICE_TYPE_LABELS[selectedInvoice.invoice_type] || 'فاتورة'}
          documentNumber={selectedInvoice.invoice_number}
          documentDate={selectedInvoice.invoice_date ? String(selectedInvoice.invoice_date).slice(0, 10) : ''}
          partyTitle={selectedInvoice.invoice_type === 'sales' ? 'العميل' : 'المورد'}
          partyName={(selectedInvoice as any).party_name || '-'}
          currencyCode={selectedInvoice.currency_code || baseCurrency}
          company={company}
          items={(selectedInvoice.items || []).map((it: any) => ({
            name: it.product_name || 'دواء',
            sku: it.sku,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            tax: it.tax_rate ? `${it.tax_rate}%` : undefined,
            total: Number(it.line_total),
          }))}
          summary={[
            { label: 'الإجمالي', value: Number(selectedInvoice.total || 0) },
            { label: 'المدفوع', value: Number(selectedInvoice.paid_amount || 0) },
            { label: 'المتبقي', value: Number(selectedInvoice.total || 0) - Number(selectedInvoice.paid_amount || 0), isTotal: true },
          ]}
          hasBackendPdf={true}
          onBackendPdf={() => pdfApi.downloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoice_number)}
        />
      )}
    </div>
  );
};