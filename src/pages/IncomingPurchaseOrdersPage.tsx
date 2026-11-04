import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, RefreshCw, CheckCircle2, XCircle, Eye, QrCode,
  Printer, Building2, AlertCircle, Edit3, Save, X, CreditCard,
} from 'lucide-react';
import { ordersApi, ApprovePurchaseOrderPayload, PaymentType } from '../api/ordersApi';
import { PurchaseOrder, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const PAYMENT_LABELS: Record<PaymentType, string> = {
  cash: 'نقد',
  credit: 'آجل',
  partial: 'جزئي',
};

interface AdjustmentRow {
  item_id: string;
  product_name: string;
  sku?: string;
  original_paid_quantity: number;
  original_bonus_quantity: number;
  original_unit_price: number;
  original_discount_rate: number;
  original_tax_rate: number;
  original_line_total: number;
  // editable
  unit_price: number;
  bonus_quantity: number;
  discount_rate: number;
  tax_rate: number;
  batch_number: string;
  expiry_date: string;
  reason: string;
  // computed
  preview_line_total: number;
}

export const IncomingPurchaseOrdersPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showResolved, setShowResolved] = useState(false);

  /* Details modal */
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* Edit mode */
  const [isEditMode, setIsEditMode] = useState(false);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);

  /* Reject modal */
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  /* QR modal */
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{
    url: string; qr_data_url: string; pin: string | null; expires_at: string;
  } | null>(null);

  /* ============================================================
   * Load incoming
   * ============================================================ */

  const loadIncoming = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getIncomingPurchaseOrders({ include_resolved: showResolved });
      setOrders(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل الطلبات الواردة');
    } finally {
      setIsLoading(false);
    }
  }, [showResolved]);

  useEffect(() => { loadIncoming(); }, [loadIncoming]);

  /* ============================================================
   * Details
   * ============================================================ */

  const openDetails = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setIsEditMode(false);
    try {
      const detailed = await ordersApi.getPurchaseOrder(order.id);
      setSelectedOrder(detailed);
      buildAdjustments(detailed);
    } catch {
      buildAdjustments(order);
    }
  };

  const buildAdjustments = (order: PurchaseOrder) => {
    const items = (order.items || []) as any[];
    const rows: AdjustmentRow[] = items.map((it) => {
      const paid = Number(it.paid_quantity ?? it.quantity) || 0;
      const bonus = Number(it.bonus_quantity) || 0;
      const price = Number(it.unit_price) || 0;
      const discRate = Number(it.discount_rate) || 0;
      const taxRate = Number(it.tax_rate) || 0;
      return {
        item_id: it.id,
        product_name: it.product_name || 'دواء',
        sku: it.sku,
        original_paid_quantity: paid,
        original_bonus_quantity: bonus,
        original_unit_price: price,
        original_discount_rate: discRate,
        original_tax_rate: taxRate,
        original_line_total: Number(it.line_total) || 0,
        unit_price: price,
        bonus_quantity: bonus,
        discount_rate: discRate,
        tax_rate: taxRate,
        batch_number: it.batch_number || '',
        expiry_date: it.expiry_date ? String(it.expiry_date).slice(0, 10) : '',
        reason: '',
        preview_line_total: Number(it.line_total) || 0,
      };
    });
    setAdjustments(rows);
  };

  const updateAdjustment = (idx: number, patch: Partial<AdjustmentRow>) => {
    setAdjustments((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...patch };
        // recompute preview
        const paid = next.original_paid_quantity;
        const gross = paid * next.unit_price;
        const disc = gross * (next.discount_rate / 100);
        const net = Math.max(0, gross - disc);
        const tax = net * (next.tax_rate / 100);
        next.preview_line_total = Math.round((net + tax) * 100) / 100;
        return next;
      })
    );
  };

  const previewTotal = adjustments.reduce((s, r) => s + r.preview_line_total, 0);
  const originalTotal = adjustments.reduce((s, r) => s + r.original_line_total, 0);

  /* ============================================================
   * Approve
   * ============================================================ */

  const handleApprove = async () => {
    if (!selectedOrder) return;

    const changedRows = adjustments.filter(
      (r) =>
        r.unit_price !== r.original_unit_price ||
        r.bonus_quantity !== r.original_bonus_quantity ||
        r.discount_rate !== r.original_discount_rate ||
        r.tax_rate !== r.original_tax_rate ||
        (r.batch_number || '') !== '' ||
        (r.expiry_date || '') !== ''
    );

    if (changedRows.length > 0 && isEditMode) {
      if (!window.confirm(`لديك ${changedRows.length} تعديل/تعديلات على البنود. هل تريد تطبيقها والموافقة؟`)) return;
    } else {
      if (!window.confirm('هل أنت متأكد من الموافقة على طلب الشراء؟ سيتم توليد رمز QR للتسليم.')) return;
    }

    setActionLoading(true);
    try {
      const payload: ApprovePurchaseOrderPayload = { qr_mode: 'both', qr_ttl_days: 7 };

      if (changedRows.length > 0) {
        payload.item_adjustments = changedRows.map((r) => ({
          item_id: r.item_id,
          unit_price: r.unit_price !== r.original_unit_price ? r.unit_price : undefined,
          bonus_quantity: r.bonus_quantity !== r.original_bonus_quantity ? r.bonus_quantity : undefined,
          discount_rate: r.discount_rate !== r.original_discount_rate ? r.discount_rate : undefined,
          tax_rate: r.tax_rate !== r.original_tax_rate ? r.tax_rate : undefined,
          batch_number: r.batch_number || undefined,
          expiry_date: r.expiry_date || undefined,
          reason: r.reason || undefined,
        }));
      }

      const result = await ordersApi.approveIncomingPurchaseOrder(selectedOrder.id, payload);

      if (result.qr) {
        setQrData(result.qr);
        setIsQrOpen(true);
      }

      setIsDetailsOpen(false);
      await loadIncoming();
    } catch (err: any) {
      window.alert(err?.message || 'فشل الموافقة على الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
   * Reject
   * ============================================================ */

  const handleReject = async () => {
    if (!selectedOrder) return;
    const reason = rejectReason.trim();
    if (!reason) return setRejectError('سبب الرفض مطلوب');

    setActionLoading(true);
    setRejectError(null);
    try {
      await ordersApi.rejectIncomingPurchaseOrder(selectedOrder.id, reason);
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
      setRejectReason('');
      await loadIncoming();
    } catch (err: any) {
      setRejectError(err?.message || 'فشل رفض الطلب');
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الطلبات الواردة</h1>
          <p className="text-xs text-slate-500 mt-1">أوامر شراء من الشركات المشترية — راجع، عدّل، ووافق أو ارفض</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded" />
            عرض المعالجة (موافق عليها/مرفوضة)
          </label>
          <button onClick={loadIncoming} disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> تحديث
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadIncoming} />}

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل الطلبات..." fullHeight />
        ) : orders.length === 0 ? (
          <EmptyState title="لا توجد طلبات واردة" description="ستظهر هنا أوامر الشراء التي ترسلها الشركات إليك."
            icon={<ShoppingBag className="w-8 h-8" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">المشتري</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4 text-center">الإجمالي</th>
                  <th className="py-3 px-4 text-center">الدفع</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">PO#{o.order_number}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {o.buyer_company_name || o.company_id?.slice(0, 8) || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {o.order_date ? String(o.order_date).slice(0, 10) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                      {Number(o.total || 0).toLocaleString()} {baseCurrency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {o.payment_type ? (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {PAYMENT_LABELS[o.payment_type as PaymentType] || o.payment_type}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center"><StatusBadge status={o.status} /></td>
                    <td className="py-3.5 px-4 text-left">
                      <button onClick={() => openDetails(o)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg">
                        <Eye className="w-3.5 h-3.5" /> مراجعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ Details Modal ============ */}
      {selectedOrder && (
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)}
          title={`مراجعة الطلب PO#${selectedOrder.order_number}`} maxWidth="5xl">
          <div className="space-y-5">
            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div><span className="text-slate-400 block mb-0.5">المشتري</span>
                <span className="font-bold text-slate-900">{(selectedOrder as any).buyer_company_name || '—'}</span></div>
              <div><span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold">{selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : '-'}</span></div>
              <div><span className="text-slate-400 block mb-0.5">الإجمالي الحالي</span>
                <span className="font-mono font-black text-emerald-700">{originalTotal.toFixed(2)} {baseCurrency}</span></div>
              <div><span className="text-slate-400 block mb-0.5">الحالة</span><StatusBadge status={selectedOrder.status} /></div>
            </div>

            {/* Payment */}
            {selectedOrder.payment_type && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-900">الدفع: {PAYMENT_LABELS[selectedOrder.payment_type as PaymentType]}</span>
                  {selectedOrder.payment_method && <span className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700">{selectedOrder.payment_method}</span>}
                  {selectedOrder.due_date && <span className="text-blue-600">استحقاق: <span className="font-mono font-bold">{String(selectedOrder.due_date).slice(0, 10)}</span></span>}
                </div>
              </div>
            )}

            {/* Edit toggle */}
            {selectedOrder.status === 'pending_approval' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <button onClick={() => setIsEditMode(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
                      <Edit3 className="w-3.5 h-3.5" /> تعديل البنود (سعر/بونص/خصم/ضريبة)
                    </button>
                  ) : (
                    <button onClick={() => { setIsEditMode(false); buildAdjustments(selectedOrder); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                      <X className="w-3.5 h-3.5" /> إلغاء التعديل
                    </button>
                  )}
                </div>
                {isEditMode && previewTotal !== originalTotal && (
                  <div className="text-xs">
                    <span className="text-slate-500">الإجمالي الجديد: </span>
                    <span className="font-mono font-black text-emerald-700">{previewTotal.toFixed(2)} {baseCurrency}</span>
                    <span className={`mr-2 font-mono font-bold ${previewTotal > originalTotal ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ({previewTotal > originalTotal ? '+' : ''}{(previewTotal - originalTotal).toFixed(2)})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Items table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-2">الصنف</th>
                    <th className="py-2.5 px-2 text-center w-16">الكمية</th>
                    {isEditMode && <th className="py-2.5 px-2 text-center w-20">بونص</th>}
                    {!isEditMode && <th className="py-2.5 px-2 text-center w-20">بونص</th>}
                    <th className="py-2.5 px-2 text-center w-24">السعر</th>
                    {isEditMode && <th className="py-2.5 px-2 text-center w-16">خصم%</th>}
                    {isEditMode && <th className="py-2.5 px-2 text-center w-16">ضريبة%</th>}
                    {isEditMode && <th className="py-2.5 px-2 text-center w-28">تشغيلة</th>}
                    {isEditMode && <th className="py-2.5 px-2 text-center w-32">انتهاء</th>}
                    {isEditMode && <th className="py-2.5 px-2 text-center w-32">السبب</th>}
                    <th className="py-2.5 px-3 text-left w-24">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments.map((row, idx) => (
                    <tr key={row.item_id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 font-semibold text-slate-800">
                        {row.product_name}
                        {row.sku && <span className="text-slate-400 mr-1 text-[10px]">({row.sku})</span>}
                      </td>
                      <td className="py-2 px-2 text-center font-mono">{row.original_paid_quantity}</td>
                      <td className="py-2 px-2 text-center">
                        {isEditMode ? (
                          <input type="number" min="0" value={row.bonus_quantity}
                            onChange={(e) => updateAdjustment(idx, { bonus_quantity: Number(e.target.value) })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        ) : <span className="font-mono text-emerald-700 font-bold">{row.original_bonus_quantity}</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isEditMode ? (
                          <input type="number" min="0" step="0.01" value={row.unit_price}
                            onChange={(e) => updateAdjustment(idx, { unit_price: Number(e.target.value) })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        ) : <span className="font-mono">{row.original_unit_price.toFixed(2)}</span>}
                      </td>
                      {isEditMode && (
                        <td className="py-2 px-2 text-center">
                          <input type="number" min="0" max="100" step="0.1" value={row.discount_rate}
                            onChange={(e) => updateAdjustment(idx, { discount_rate: Number(e.target.value) })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        </td>
                      )}
                      {isEditMode && (
                        <td className="py-2 px-2 text-center">
                          <input type="number" min="0" max="100" step="0.1" value={row.tax_rate}
                            onChange={(e) => updateAdjustment(idx, { tax_rate: Number(e.target.value) })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        </td>
                      )}
                      {isEditMode && (
                        <td className="py-2 px-2 text-center">
                          <input type="text" value={row.batch_number} placeholder="تشغيلة"
                            onChange={(e) => updateAdjustment(idx, { batch_number: e.target.value })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        </td>
                      )}
                      {isEditMode && (
                        <td className="py-2 px-2 text-center">
                          <input type="date" value={row.expiry_date}
                            onChange={(e) => updateAdjustment(idx, { expiry_date: e.target.value })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center font-mono" />
                        </td>
                      )}
                      {isEditMode && (
                        <td className="py-2 px-2 text-center">
                          <input type="text" value={row.reason} placeholder="سبب"
                            onChange={(e) => updateAdjustment(idx, { reason: e.target.value })}
                            className="w-full rounded border border-slate-300 p-1 text-xs text-center" />
                        </td>
                      )}
                      <td className="py-2 px-3 text-left font-bold font-mono text-slate-900">
                        {isEditMode ? row.preview_line_total.toFixed(2) : row.original_line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            {selectedOrder.status === 'pending_approval' && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button onClick={() => { setRejectReason(''); setRejectError(null); setIsRejectOpen(true); }}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> رفض الطلب
                </button>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" /> {actionLoading ? 'جاري المعالجة...' : 'الموافقة وتوليد QR'}
                </button>
              </div>
            )}

            {selectedOrder.status === 'approved' && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" /> تمت الموافقة — بانتظار استلام المشتري
                </span>
              </div>
            )}

            {selectedOrder.status === 'rejected' && (selectedOrder as any).rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900">سبب الرفض: </span>
                <span className="text-rose-800">{(selectedOrder as any).rejection_reason}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ============ Reject Modal ============ */}
      <Modal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="رفض طلب الشراء">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">سبب الرفض سيظهر للمشتري في تفاصيل الطلب.</p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            placeholder="مثال: الكميات غير متوفرة حالياً..." />
          {rejectError && <ErrorAlert error={rejectError} />}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button onClick={() => setIsRejectOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl disabled:opacity-50">
              {actionLoading ? '...' : 'تأكيد الرفض'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ============ QR Modal ============ */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="رمز QR للتسليم" maxWidth="md">
        {qrData && (
          <div className="space-y-4 text-center">
            <div className="inline-block p-4 bg-white rounded-xl border-2 border-slate-200">
              <img src={qrData.qr_data_url} alt="QR" className="w-64 h-64 mx-auto" />
            </div>
            {qrData.pin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] text-amber-800 mb-1">رمز PIN (للتأكيد العام):</p>
                <p className="text-3xl font-black font-mono text-amber-900 tracking-widest">{qrData.pin}</p>
              </div>
            )}
            <p className="text-xs text-slate-600">
              <strong>ينتهي في:</strong> {new Date(qrData.expires_at).toLocaleString('ar-SA')}
            </p>
            <button onClick={() => window.print()}
              className="w-full px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl">
              <Printer className="w-4 h-4 inline mr-1" /> طباعة
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};