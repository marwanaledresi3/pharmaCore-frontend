import React, { useState, useEffect } from 'react';
import {
  RotateCcw, Plus, RefreshCw, Printer, Download, Eye,
  CheckCircle2, XCircle,
  FileText,
} from 'lucide-react';
import { returnsApi } from '../api/returnsApi';
import { invoicesApi } from '../api/invoicesApi';
import { warehousesApi } from '../api/warehousesApi';
import { pdfApi } from '../api/pdfApi1';
import { Return, Invoice, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

/* ============================================================
 * Types
 * ============================================================ */

interface BatchOption {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}

interface ReturnItemRow {
  product_id: string;
  name: string;
  maxQty: number;
  quantity: number;
  unit_price: number;
  available_batches: BatchOption[];
  batch_id: string | null;
}

/* ============================================================
 * Component
 * ============================================================ */

export const ReturnsPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [returnsList, setReturnsList] = useState<Return[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'purchase'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [returnType, setReturnType] = useState<'sales' | 'purchase'>('sales');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('منتج تالف / انتهاء صلاحية / طلب العميل');
  const [returnItems, setReturnItems] = useState<ReturnItemRow[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [isPrintOpen, setIsPrintOpen] = useState(false);

  /* ============================================================
   * Load data
   * ============================================================ */

  const loadData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const typeParam = typeFilter === 'all' ? undefined : typeFilter;
      const [retRes, invRes] = await Promise.all([
        returnsApi.list({ return_type: typeParam, page, limit: 15 }),
        invoicesApi.list({ limit: 100 }),
      ]);
      setReturnsList(retRes.items);
      setPagination(retRes.pagination);
      setInvoices(invRes.items);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل المرتجعات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [typeFilter]);

  /* ============================================================
   * Create modal
   * ============================================================ */

  const openCreateModal = async (type: 'sales' | 'purchase') => {
    setReturnType(type);
    setReturnDate(new Date().toISOString().slice(0, 10));
    setReason('منتج تالف / انتهاء صلاحية / طلب العميل');
    setFormError(null);
    setReturnItems([]);
    setSelectedInvoiceId('');
    setSelectedInvoice(null);

    const targetInvoices = invoices.filter((i: any) => i.invoice_type === type);
    const firstInv = targetInvoices[0];

    setIsCreateOpen(true);

    if (firstInv) {
      await handleInvoiceSelect(firstInv.id, type);
    }
  };

  const handleInvoiceSelect = async (invId: string, type?: 'sales' | 'purchase') => {
    const effectiveType = type || returnType;
    setSelectedInvoiceId(invId);
    try {
      const detailed = await invoicesApi.getOne(invId);
      setSelectedInvoice(detailed);

      // جلب الدفعات (فقط لمرتجع الشراء)
      const batchesPerProduct = await Promise.all(
        (detailed.items || []).map(async (it: any) => {
          if (effectiveType !== 'purchase') {
            return { productId: it.product_id, batches: [] };
          }
          try {
            const batches = await warehousesApi.getProductBatches(it.product_id);
            return { productId: it.product_id, batches: batches || [] };
          } catch (err) {
            console.warn('[Returns] batches fetch failed for', it.product_id, err);
            return { productId: it.product_id, batches: [] };
          }
        })
      );

      const batchMap = new Map(batchesPerProduct.map((b) => [b.productId, b.batches]));

      setReturnItems(
        (detailed.items || []).map((it: any) => {
          const batches = batchMap.get(it.product_id) || [];
          return {
            product_id: it.product_id,
            name: it.product_name || 'صنف',
            maxQty: Number(it.quantity) || 1,
            quantity: 1,
            unit_price: Number(it.unit_price) || 0,
            available_batches: batches,
            batch_id: effectiveType === 'purchase' && batches.length > 0 ? batches[0].id : null,
          };
        })
      );
    } catch (err) {
      console.error('[ReturnsPage] handleInvoiceSelect error:', err);
    }
  };

  const updateReturnItem = (idx: number, patch: Partial<ReturnItemRow>) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setFormError('يرجى اختيار الفاتورة الأصلية للمرتجع');
      return;
    }

    const validItems = returnItems.filter((it) => it.quantity > 0);
    if (validItems.length === 0) {
      setFormError('يجب تحديد كمية مرتجعة لصنف واحد على الأقل');
      return;
    }

    if (returnType === 'purchase') {
      const missingBatch = validItems.find((it) => !it.batch_id);
      if (missingBatch) {
        setFormError(`يجب اختيار دفعة (batch) للصنف: ${missingBatch.name}`);
        return;
      }
    }

    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        invoice_id: selectedInvoiceId,
        return_date: returnDate,
        reason: reason.trim() || undefined,
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          ...(returnType === 'purchase' && it.batch_id ? { batch_id: it.batch_id } : {}),
        })),
      };

      if (returnType === 'sales') {
        await returnsApi.createSaleReturn(payload);
      } else {
        await returnsApi.createPurchaseReturn(payload);
      }

      setIsCreateOpen(false);
      loadData(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء المرتجع');
    } finally {
      setFormLoading(false);
    }
  };

  /* ============================================================
   * Details
   * ============================================================ */

  const openDetailsModal = async (ret: Return) => {
    setSelectedReturn(ret);
    setIsDetailsOpen(true);
    try {
      const detailed = await returnsApi.getOne(ret.id);
      setSelectedReturn(detailed);
    } catch {
      /* silent */
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedReturn) return;
    if (!window.confirm('هل أنت متأكد من تأكيد المرتجع؟ سيؤدي ذلك إلى تعديل أرصدة المخزون وإنشاء القيود المحاسبية التلقائية.')) return;

    setActionLoading(true);
    try {
      await returnsApi.confirm(selectedReturn.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل تأكيد المرتجع');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!selectedReturn) return;
    if (!window.confirm('هل أنت متأكد من إلغاء هذا المرتجع؟')) return;

    setActionLoading(true);
    try {
      await returnsApi.cancel(selectedReturn.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء المرتجع');
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
   * Render
   * ============================================================ */

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مرتجعات المبيعات والمشتريات</h1>
          <p className="text-xs text-slate-500 mt-1">إدارة المرتجعات، تسوية الحسابات، واسترجاع الكميات للمخزون</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreateModal('sales')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" /> مرتجع مبيعات جديد
          </button>
          <button
            onClick={() => openCreateModal('purchase')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" /> مرتجع مشتريات جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${typeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setTypeFilter('sales')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${typeFilter === 'sales' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            مرتجعات المبيعات
          </button>
          <button
            onClick={() => setTypeFilter('purchase')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${typeFilter === 'purchase' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            مرتجعات المشتريات
          </button>
        </div>
        <button
          onClick={() => loadData(pagination.page)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadData(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب المرتجعات..." fullHeight />
        ) : returnsList.length === 0 ? (
          <EmptyState
            title="لا توجد مرتجعات مسجلة"
            description="يمكنك إنشاء مرتجع مبيعات أو مرتجع مشتريات بناءً على الفواتير الصادرة والواردة."
            icon={<RotateCcw className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم المرتجع</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">الفاتورة</th>
                    <th className="py-3 px-4">الطرف</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4 text-center">المبلغ</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnsList.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">#{r.return_number}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.return_type === 'sales' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {r.return_type === 'sales' ? 'مرتجع بيع' : 'مرتجع شراء'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.invoice_number ? `#${r.invoice_number}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">{r.party_name || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {r.return_date ? String(r.return_date).slice(0, 10) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                        {Number(r.total || 0).toLocaleString()} {baseCurrency}
                      </td>
                      <td className="py-3.5 px-4 text-center"><StatusBadge status={r.status} /></td>
                      <td className="py-3.5 px-4 text-left">
                         <button
                          type="button"
                          onClick={() => pdfApi.previewReturn(r.id)}
                          title="عرض PDF"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDetailsModal(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={loadData} />
          </>
        )}
      </div>

      {/* ============ Create Modal ============ */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={returnType === 'sales' ? 'إنشاء مرتجع مبيعات' : 'إنشاء مرتجع مشتريات'}
        maxWidth="3xl"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اختر الفاتورة المراد إرجاع بنود منها *
            </label>
            <select
              required
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- اختر الفاتورة --</option>
              {invoices
                .filter((i: any) => i.invoice_type === returnType)
                .map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    #{inv.invoice_number} | {(inv as any).party_name || ''} | إجمالي: {inv.total}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ المرتجع *</label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإرجاع</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="تالف، منتهي، خطأ في الطلب"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Items Table */}
          {returnItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                حدد الكميات المرتجعة {returnType === 'purchase' && '(يجب اختيار دفعة لكل صنف)'}
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">الصنف</th>
                      <th className="p-2.5 text-center">الكمية الأصلية</th>
                      <th className="p-2.5 text-center w-24">المرتجعة</th>
                      <th className="p-2.5 text-center">سعر الوحدة</th>
                      {returnType === 'purchase' && (
                        <th className="p-2.5 text-center min-w-[200px]">الدفعة *</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnItems.map((it, idx) => {
                      const batches = it.available_batches || [];
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-800">{it.name}</td>
                          <td className="p-2.5 text-center font-mono text-slate-500">{it.maxQty}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={it.maxQty}
                              value={it.quantity}
                              onChange={(e) => {
                                const val = Math.min(it.maxQty, Math.max(0, Number(e.target.value)));
                                updateReturnItem(idx, { quantity: val });
                              }}
                              className="w-20 text-center rounded-lg border border-slate-300 p-1 font-mono font-bold"
                            />
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-700">
                            {Number(it.unit_price).toFixed(2)} {baseCurrency}
                          </td>
                          {returnType === 'purchase' && (
                            <td className="p-2.5 text-center">
                              {batches.length === 0 ? (
                                <span className="text-[10px] text-rose-600 font-bold">
                                  لا توجد دفعات متاحة
                                </span>
                              ) : (
                                <select
                                  value={it.batch_id || ''}
                                  onChange={(e) =>
                                    updateReturnItem(idx, { batch_id: e.target.value || null })
                                  }
                                  className="w-full rounded-lg border border-slate-300 p-1 text-[10px] font-mono"
                                >
                                  <option value="">-- اختر --</option>
                                  {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.batch_number} | انتهاء: {String(b.expiry_date || '').slice(0, 10)} | متاح: {b.quantity}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
              {formLoading ? 'جاري الحفظ...' : 'إنشاء المرتجع'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Details Modal ============ */}
      {selectedReturn && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`تفاصيل المرتجع: #${selectedReturn.return_number}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">الطرف</span>
                <span className="font-bold text-slate-900 text-sm">
                  {(selectedReturn as any).party_name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold">
                  {selectedReturn.return_date ? String(selectedReturn.return_date).slice(0, 10) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الإجمالي</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {Number(selectedReturn.total || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedReturn.status} />
              </div>
            </div>

            {/* Items (read-only) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">الصنف</th>
                    <th className="p-2.5 text-center">الكمية</th>
                    <th className="p-2.5 text-center">سعر الوحدة</th>
                    <th className="p-2.5 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((selectedReturn as any).items || []).map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-semibold text-slate-800">{it.product_name || 'دواء'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-rose-600">{it.quantity}</td>
                      <td className="p-2.5 text-center font-mono">{Number(it.unit_price).toFixed(2)}</td>
                      <td className="p-2.5 text-left font-mono font-bold">
                        {Number(it.line_total).toFixed(2)} {baseCurrency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <Printer className="w-4 h-4" /> طباعة
                </button>
                <button
                  onClick={() => pdfApi.downloadReturnPdf(selectedReturn.id, selectedReturn.return_number)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedReturn.status === 'draft' && (
                  <>
                    <button
                      onClick={handleCancelReturn}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                    >
                      <XCircle className="w-4 h-4" /> إلغاء
                    </button>
                    <button
                      onClick={handleConfirmReturn}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading ? 'جاري التأكيد...' : 'تأكيد وعكس المخزون'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Print */}
      {selectedReturn && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`مرتجع ${selectedReturn.return_type === 'sales' ? 'مبيعات' : 'مشتريات'}`}
          documentType={selectedReturn.return_type === 'sales' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'}
          documentNumber={selectedReturn.return_number}
          documentDate={selectedReturn.return_date ? String(selectedReturn.return_date).slice(0, 10) : ''}
          partyTitle={selectedReturn.return_type === 'sales' ? 'العميل' : 'المورد'}
          partyName={(selectedReturn as any).party_name || ''}
          currencyCode={baseCurrency}
          company={company}
          items={((selectedReturn as any).items || []).map((it: any) => ({
            name: it.product_name || 'دواء',
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            total: Number(it.line_total),
          }))}
          summary={[
            { label: 'المبلغ الإجمالي المرتجع', value: Number(selectedReturn.total || 0), isTotal: true },
          ]}
          notes={selectedReturn.reason ? `سبب المرتجع: ${selectedReturn.reason}` : undefined}
          hasBackendPdf={true}
          onBackendPdf={() => pdfApi.downloadReturnPdf(selectedReturn.id, selectedReturn.return_number)}
        />
      )}
    </div>
  );
};