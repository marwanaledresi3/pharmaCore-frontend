import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeftRight, CheckCircle, XCircle, Clock,
  Warehouse, Calendar, User, FileText, Printer, Ban,
  Package, TrendingUp, ArrowRight as ArrowRightIcon,
  ExternalLink, AlertTriangle,
} from 'lucide-react';
import { stockTransfersApi, StockTransfer } from '../../api/stockTransfersApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { FileDown } from 'lucide-react';
import { pdfApi } from '../../api/pdfApi1';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'مسودة',   color: 'bg-slate-100 text-slate-700',   icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: 'مؤكد',    color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'ملغي',    color: 'bg-rose-50 text-rose-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  transferId: string;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const StockTransferDetailPage: React.FC<Props> = ({ transferId, onBack }) => {
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);
  // ═══ Load ═══
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockTransfersApi.getById(transferId);
      setTransfer(data);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل التحويل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferId]);

  // ═══ Actions ═══
  const handleConfirm = async () => {
    if (!window.confirm('هل تريد تأكيد التحويل؟ سيتم نقل المخزون بين المستودعين.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await stockTransfersApi.confirm(transferId);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل التأكيد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await stockTransfersApi.cancel(transferId, cancelReason.trim() || undefined);
      setShowCancelModal(false);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل الإلغاء');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdf = async () => {
  if (!transfer) return;
  setPdfLoading(true);
  try {
    await pdfApi.downloadStockTransferPdf(transfer.id, transfer.transfer_number);
  } catch (err: any) {
    setError(err?.message || 'فشل تحميل PDF');
  } finally {
    setPdfLoading(false);
  }
};

  // ═══ Helpers ═══
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
  const formatDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString('ar-EG') : '—';
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n || 0);
  const formatQty = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n || 0);

  // ═══ Loading / Not found ═══
  if (loading) {
    return (
      <div className="p-12">
        <LoadingSpinner message="جاري تحميل التحويل..." />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">التحويل غير موجود</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl"
        >
          العودة
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[transfer.status];

  // إحصاءات
  const totalQty = transfer.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalValue = transfer.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost || 0),
    0
  );
  const itemsCount = transfer.items.length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg"
            title="عودة"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
              {transfer.transfer_number}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              إذن تحويل · {formatDate(transfer.transfer_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>

          {transfer.status === 'draft' && (
            <>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة
              </button>
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
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                إلغاء
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {actionLoading ? 'جاري التأكيد...' : 'تأكيد التحويل'}
              </button>
            </>
          )}

          {transfer.status === 'confirmed' && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* ═══ Visual Path (من → إلى) ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          {/* من */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto mb-2">
              <Warehouse className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 mb-0.5">من مستودع</p>
            <p className="text-sm font-black text-slate-800">{transfer.from_warehouse_name}</p>
          </div>

          {/* سهم */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center">
              <ArrowRightIcon className="w-5 h-5 text-emerald-600 rotate-180" />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {itemsCount} بند
            </span>
          </div>

          {/* إلى */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-2">
              <Warehouse className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 mb-0.5">إلى مستودع</p>
            <p className="text-sm font-black text-slate-800">{transfer.to_warehouse_name}</p>
          </div>
        </div>
      </div>

      {/* ═══ Info cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={<Calendar className="w-4 h-4 text-emerald-600" />}
          label="تاريخ التحويل"
          value={formatDate(transfer.transfer_date)}
        />
        <InfoCard
          icon={<User className="w-4 h-4 text-emerald-600" />}
          label="أنشأها"
          value={transfer.created_by_name || '—'}
        />
        <InfoCard
          icon={<Package className="w-4 h-4 text-emerald-600" />}
          label="البنود"
          value={`${itemsCount} بند`}
          sub={`${formatQty(totalQty)} وحدة`}
        />
        <InfoCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          label="القيمة"
          value={
            <span className="font-mono text-base font-black text-emerald-700">
              {formatMoney(totalValue)}
            </span>
          }
        />
      </div>

      {/* ═══ Notes ═══ */}
      {transfer.notes && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 mb-1">ملاحظات</p>
          <p className="text-xs text-slate-800 leading-relaxed">{transfer.notes}</p>
        </div>
      )}

      {/* ═══ Items table ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            بنود التحويل ({itemsCount})
          </h3>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {formatQty(totalQty)} وحدة · {formatMoney(totalValue)}
          </span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700 w-8">#</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">المنتج</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">الدفعة (من)</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">الدفعة (إلى)</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">الكمية</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-700">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {transfer.items.map((item, idx) => {
              const qty = Number(item.quantity);
              const cost = Number(item.unit_cost || 0);
              const value = qty * cost;
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-800">{item.product_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.product_sku} · {item.product_unit}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    {item.from_batch_number ? (
                      <div>
                        <p className="font-mono text-[10px] text-rose-700">{item.from_batch_number}</p>
                        {item.from_batch_expiry && (
                          <p className="text-[9px] text-slate-500">
                            ينتهي: {formatDate(item.from_batch_expiry)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.to_batch_number ? (
                      <div>
                        <p className="font-mono text-[10px] text-emerald-700">{item.to_batch_number}</p>
                        {item.to_batch_expiry && (
                          <p className="text-[9px] text-slate-500">
                            ينتهي: {formatDate(item.to_batch_expiry)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">
                    {formatQty(qty)}
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono text-slate-700">
                    {cost > 0 ? formatMoney(value) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ Journal entry (إن وُجد) ═══ */}
      {transfer.journal_entry_id && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-black text-emerald-900">القيد المحاسبي المرتبط</p>
          </div>
          <p className="text-[10px] text-emerald-700 mb-2">
            تم إنشاء القيد تلقائياً عند تأكيد التحويل.
          </p>
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 text-emerald-700" />
            <a
              href={`/journal-entries/${transfer.journal_entry_id}`}
              className="text-[10px] font-bold text-emerald-700 hover:underline"
            >
              عرض القيد في دفتر اليومية
            </a>
          </div>
        </div>
      )}

      {/* ═══ Cancel warning ═══ */}
      {transfer.status === 'cancelled' && transfer.cancel_reason && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            <p className="text-xs font-black text-rose-900">سبب الإلغاء</p>
          </div>
          <p className="text-xs text-rose-800">{transfer.cancel_reason}</p>
        </div>
      )}

      {/* ═══ Timeline ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-900 mb-3">سجل الأحداث</h3>
        <div className="space-y-3">
          <TimelineItem
            icon={<FileText className="w-3.5 h-3.5" />}
            color="text-slate-600 bg-slate-100"
            label="تم إنشاء التحويل"
            detail={`بواسطة ${transfer.created_by_name || '—'} · ${formatDateTime(transfer.created_at)}`}
          />
          {transfer.confirmed_at && (
            <TimelineItem
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              color="text-emerald-600 bg-emerald-100"
              label="تم تأكيد التحويل"
              detail={`بواسطة ${transfer.confirmed_by_name || '—'} · ${formatDateTime(transfer.confirmed_at)}`}
            />
          )}
          {transfer.cancelled_at && (
            <TimelineItem
              icon={<XCircle className="w-3.5 h-3.5" />}
              color="text-rose-600 bg-rose-100"
              label="تم إلغاء التحويل"
              detail={
                <>
                  بواسطة {transfer.cancelled_by_name || '—'} · {formatDateTime(transfer.cancelled_at)}
                  {transfer.cancel_reason && (
                    <span className="block text-[10px] text-slate-600 mt-0.5">
                      السبب: {transfer.cancel_reason}
                    </span>
                  )}
                </>
              }
            />
          )}
        </div>
      </div>

      {/* ═══ Cancel Modal ═══ */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !actionLoading && setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              إلغاء التحويل
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              هل تريد إلغاء التحويل <strong>{transfer.transfer_number}</strong>؟
              {transfer.status === 'confirmed' && (
                <span className="block mt-2 text-rose-700 font-bold">
                  ⚠️ التحويل مؤكد — سيتم عكس الحركات المخزنية.
                </span>
              )}
            </p>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              سبب الإلغاء (اختياري)
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              disabled={actionLoading}
              placeholder="مثال: خطأ في الكمية"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
              >
                رجوع
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}> = ({ icon, label, value, sub }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
    </div>
    <div className="text-xs font-bold text-slate-800">{value}</div>
    {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const TimelineItem: React.FC<{
  icon: React.ReactNode;
  color: string;
  label: string;
  detail: React.ReactNode;
}> = ({ icon, color, label, detail }) => (
  <div className="flex items-start gap-2.5">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{detail}</p>
    </div>
  </div>
);