import React, { useState, useEffect } from 'react';
import {
  ArrowRight, PackageCheck, CheckCircle, XCircle, Clock,
  Truck, Warehouse, Calendar, User, FileText, Printer, Ban,
  CreditCard, Banknote, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { goodsReceiptsApi, GoodsReceipt } from '../../api/goodsReceiptsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { FileDown } from 'lucide-react';
import { pdfApi } from '../../api/pdfApi1';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'مسودة',   color: 'bg-slate-100 text-slate-700',   icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: 'مؤكد',    color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'ملغي',    color: 'bg-rose-50 text-rose-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

interface Props { receiptId: string; onBack: () => void; }

export const GoodsReceiptDetailPage: React.FC<Props> = ({ receiptId, onBack }) => {
  const [gr, setGr] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);

  const loadData = async () => {
    setLoading(true); setError(null);
    try { const data = await goodsReceiptsApi.getById(receiptId); setGr(data); }
    catch (err: any) { setError(err?.message || 'تعذر التحميل'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [receiptId]);

  const handleConfirm = async () => {
    if (!window.confirm('تأكيد الإذن؟ سيُضاف للمخزون ويُنشأ قيد محاسبي.')) return;
    setActionLoading(true); setError(null);
    try { await goodsReceiptsApi.confirm(receiptId); await loadData(); }
    catch (err: any) { setError(err?.message || 'فشل التأكيد'); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    setActionLoading(true); setError(null);
    try {
      await goodsReceiptsApi.cancel(receiptId, cancelReason.trim() || undefined);
      setShowCancelModal(false); setCancelReason(''); await loadData();
    } catch (err: any) { setError(err?.message || 'فشل الإلغاء'); }
    finally { setActionLoading(false); }
  };

  const handlePdf = async () => {
  if (!gr) return;
  setPdfLoading(true);
  try {
    await pdfApi.downloadGoodsReceiptPdf(gr.id, gr.receipt_number);
  } catch (err: any) {
    setError(err?.message || 'فشل تحميل PDF');
  } finally {
    setPdfLoading(false);
  }
};

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ar-EG') : '—';
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString('ar-EG') : '—';
  const formatMoney = (n: number) => new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n || 0);
  const formatQty = (n: number) => new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n || 0);

  if (loading) return <div className="p-12"><LoadingSpinner message="جاري التحميل..." /></div>;
  if (!gr) return <div className="p-12 text-center"><p>الإذن غير موجود</p><button onClick={onBack} className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl">العودة</button></div>;

  const s = STATUS_MAP[gr.status];
  const totalQty = gr.items.reduce((sum, it) => sum + Number(it.quantity), 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowRight className="w-4 h-4" /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <PackageCheck className="w-6 h-6 text-emerald-600" />{gr.receipt_number}
            </h1>
            <p className="text-xs text-slate-600 mt-1">إذن استلام · {formatDate(gr.receipt_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${s.color}`}>{s.icon}{s.label}</span>
          {gr.status === 'draft' && (
            <>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"><Printer className="w-3.5 h-3.5" />طباعة</button>

              <button
  onClick={handlePdf}
  disabled={pdfLoading}
  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-50"
>
  {pdfLoading ? (
    <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
  ) : (
    <FileDown className="w-3.5 h-3.5" />
  )}
  {pdfLoading ? 'جاري التحميل...' : 'PDF'}
</button>

              <button onClick={() => setShowCancelModal(true)} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl disabled:opacity-50"><Ban className="w-3.5 h-3.5" />إلغاء</button>
              <button onClick={handleConfirm} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
                {actionLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {actionLoading ? 'جاري التأكيد...' : 'تأكيد الإذن'}
              </button>
            </>
          )}
          {gr.status === 'confirmed' && (
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"><Printer className="w-3.5 h-3.5" />طباعة</button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard icon={<Truck className="w-4 h-4 text-emerald-600" />} label="المورد" value={gr.supplier_name} />
        <InfoCard icon={<Warehouse className="w-4 h-4 text-emerald-600" />} label="المستودع" value={gr.warehouse_name} />
        <InfoCard icon={<Calendar className="w-4 h-4 text-emerald-600" />} label="التاريخ" value={formatDate(gr.receipt_date)} />
        <InfoCard
          icon={gr.payment_type === 'cash' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <CreditCard className="w-4 h-4 text-emerald-600" />}
          label="طريقة الدفع"
          value={gr.payment_type === 'cash' ? 'نقدي' : 'آجل'}
        />
      </div>

      {/* Purchase Order link */}
      {gr.purchase_order_id && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-sky-800">مرتبط بأمر شراء:</span>
          <a href={`/purchase-orders/${gr.purchase_order_id}`} className="text-xs font-bold text-sky-700 hover:underline">
            {gr.purchase_order_number || gr.purchase_order_id.slice(0, 8)}
          </a>
        </div>
      )}

      {/* Notes */}
      {gr.notes && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 mb-1">ملاحظات</p>
          <p className="text-xs text-slate-800 leading-relaxed">{gr.notes}</p>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">البنود ({gr.items.length})</h3>
          <span className="text-xs font-bold text-slate-600 font-mono">{formatQty(totalQty)} وحدة · {formatMoney(Number(gr.total))}</span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700 w-8">#</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">المنتج</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">الدفعة</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">الكمية</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">السعر</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {gr.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                <td className="px-3 py-2.5">
                  <p className="font-bold text-slate-800">{item.product_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{item.product_sku} · {item.product_unit}</p>
                </td>
                <td className="px-3 py-2.5">
                  {item.batch_number ? (
                    <div>
                      <p className="font-mono text-[10px]">{item.batch_number}</p>
                      {item.expiry_date && <p className="text-[9px] text-slate-500">{formatDate(item.expiry_date)}</p>}
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">{formatQty(Number(item.quantity))}</td>
                <td className="px-3 py-2.5 text-center font-mono text-slate-700">{formatMoney(Number(item.unit_price))}</td>
                <td className="px-3 py-2.5 text-left font-mono font-bold text-slate-800">{formatMoney(Number(item.line_total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
          <div className="flex flex-col gap-1.5 max-w-md ml-auto">
            <div className="flex justify-between text-xs"><span className="text-slate-600">المجموع</span><span className="font-mono font-bold">{formatMoney(Number(gr.subtotal))}</span></div>
            {Number(gr.tax_total) > 0 && <div className="flex justify-between text-xs"><span className="text-slate-600">الضريبة</span><span className="font-mono font-bold">{formatMoney(Number(gr.tax_total))}</span></div>}
            <div className="flex justify-between text-sm pt-1.5 border-t border-slate-300">
              <span className="font-black text-slate-900">الإجمالي</span>
              <span className="font-mono font-black text-emerald-700">{formatMoney(Number(gr.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Journal entry */}
      {gr.journal_entry_id && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-black text-emerald-900">القيد المحاسبي المرتبط</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 text-emerald-700" />
            <a href={`/journal-entries/${gr.journal_entry_id}`} className="text-[10px] font-bold text-emerald-700 hover:underline">
              عرض القيد في دفتر اليومية
            </a>
          </div>
        </div>
      )}

      {/* Cancel reason */}
      {gr.status === 'cancelled' && gr.cancel_reason && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            <p className="text-xs font-black text-rose-900">سبب الإلغاء</p>
          </div>
          <p className="text-xs text-rose-800">{gr.cancel_reason}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-900 mb-3">سجل الأحداث</h3>
        <div className="space-y-3">
          <TimelineItem icon={<FileText className="w-3.5 h-3.5" />} color="text-slate-600 bg-slate-100" label="تم إنشاء الإذن" detail={`بواسطة ${gr.created_by_name || '—'} · ${formatDateTime(gr.created_at)}`} />
          {gr.confirmed_at && <TimelineItem icon={<CheckCircle className="w-3.5 h-3.5" />} color="text-emerald-600 bg-emerald-100" label="تم التأكيد" detail={`بواسطة ${gr.confirmed_by_name || '—'} · ${formatDateTime(gr.confirmed_at)}`} />}
          {gr.cancelled_at && <TimelineItem icon={<XCircle className="w-3.5 h-3.5" />} color="text-rose-600 bg-rose-100" label="تم الإلغاء" detail={`بواسطة ${gr.cancelled_by_name || '—'} · ${formatDateTime(gr.cancelled_at)}`} />}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !actionLoading && setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2"><Ban className="w-4 h-4 text-rose-600" />إلغاء الإذن</h3>
            <p className="text-xs text-slate-600 mb-3">هل تريد إلغاء الإذن <strong>{gr.receipt_number}</strong>؟</p>
            <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإلغاء (اختياري)</label>
            <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} maxLength={500} disabled={actionLoading} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelModal(false)} disabled={actionLoading} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">رجوع</button>
              <button onClick={handleCancel} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl">
                {actionLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[10px] font-bold text-slate-500">{label}</p></div>
    <div className="text-xs font-bold text-slate-800">{value}</div>
  </div>
);

const TimelineItem: React.FC<{ icon: React.ReactNode; color: string; label: string; detail: React.ReactNode }> = ({ icon, color, label, detail }) => (
  <div className="flex items-start gap-2.5">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div className="flex-1"><p className="text-xs font-bold text-slate-800">{label}</p><p className="text-[10px] text-slate-500 mt-0.5">{detail}</p></div>
  </div>
);