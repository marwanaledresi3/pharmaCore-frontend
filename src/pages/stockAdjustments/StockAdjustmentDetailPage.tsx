import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ClipboardCheck, CheckCircle, XCircle, Clock,
  Warehouse, Calendar, User, FileText, AlertTriangle,
  TrendingUp, TrendingDown, Calculator, Printer, Ban,
} from 'lucide-react';
import { stockAdjustmentsApi, StockAdjustment } from '../../api/stockAdjustmentsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { FileDown } from 'lucide-react';
import { pdfApi } from '../../api/pdfApi1';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'مسودة',   color: 'bg-slate-100 text-slate-700',   icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: 'مؤكد',    color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'ملغي',    color: 'bg-rose-50 text-rose-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

const REASON_LABEL: Record<string, { label: string; color: string }> = {
  physical_count: { label: 'جرد فعلي',       color: 'bg-sky-50 text-sky-700' },
  damage:         { label: 'تالف',            color: 'bg-rose-50 text-rose-700' },
  theft:          { label: 'سرقة',            color: 'bg-red-50 text-red-700' },
  expiry:         { label: 'انتهاء صلاحية',  color: 'bg-amber-50 text-amber-700' },
  error:          { label: 'خطأ إدخال',      color: 'bg-purple-50 text-purple-700' },
  other:          { label: 'أخرى',            color: 'bg-slate-100 text-slate-700' },
};

interface Props {
  adjustmentId: string;
  onBack: () => void;
}

export const StockAdjustmentDetailPage: React.FC<Props> = ({ adjustmentId, onBack }) => {
  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockAdjustmentsApi.getById(adjustmentId);
      setAdjustment(data);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل التسوية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustmentId]);

  const handleConfirm = async () => {
    if (!window.confirm('هل تريد تأكيد التسوية؟ سيتم تعديل المخزون وإنشاء قيد محاسبي.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await stockAdjustmentsApi.confirm(adjustmentId);
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
      await stockAdjustmentsApi.cancel(adjustmentId, cancelReason.trim() || undefined);
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
  if (!adjustment) return;
  setPdfLoading(true);
  try {
    await pdfApi.downloadStockAdjustmentPdf(adjustment.id, adjustment.adjustment_number);
  } catch (err: any) {
    setError(err?.message || 'فشل تحميل PDF');
  } finally {
    setPdfLoading(false);
  }
};

  if (loading) {
    return (
      <div className="p-12">
        <LoadingSpinner message="جاري تحميل التسوية..." />
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">التسوية غير موجودة</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl">
          العودة
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[adjustment.status];
  const reasonInfo = REASON_LABEL[adjustment.reason] || {
    label: adjustment.reason,
    color: 'bg-slate-100 text-slate-700',
  };

  // حسابات
  const stats = adjustment.items.reduce(
    (acc, item) => {
      const diff = Number(item.difference);
      if (Math.abs(diff) < 0.001) return acc;
      const value = Math.abs(diff) * Number(item.unit_cost || 0);
      if (diff > 0) {
        acc.totalGain += diff;
        acc.totalGainValue += value;
      } else {
        acc.totalLoss += Math.abs(diff);
        acc.totalLossValue += value;
      }
      acc.withDiff++;
      return acc;
    },
    { withDiff: 0, totalGain: 0, totalLoss: 0, totalGainValue: 0, totalLossValue: 0 }
  );
  const netValue = stats.totalGainValue - stats.totalLossValue;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
  const formatDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString('ar-EG') : '—';
  const formatNum = (n: number, decimals = 2) =>
    new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n || 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
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
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
              {adjustment.adjustment_number}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              تسوية جرد · {formatDate(adjustment.adjustment_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>

          {adjustment.status === 'draft' && (
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
                disabled={actionLoading || stats.withDiff === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {actionLoading ? 'جاري التأكيد...' : 'تأكيد التسوية'}
              </button>
            </>
          )}

          {adjustment.status === 'confirmed' && (
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

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={<Warehouse className="w-4 h-4 text-emerald-600" />}
          label="المستودع"
          value={adjustment.warehouse_name}
        />
        <InfoCard
          icon={<Calendar className="w-4 h-4 text-emerald-600" />}
          label="تاريخ التسوية"
          value={formatDate(adjustment.adjustment_date)}
        />
        <InfoCard
          icon={<FileText className="w-4 h-4 text-emerald-600" />}
          label="السبب"
          value={
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${reasonInfo.color}`}>
              {reasonInfo.label}
            </span>
          }
        />
        <InfoCard
          icon={<User className="w-4 h-4 text-emerald-600" />}
          label="أنشأها"
          value={adjustment.created_by_name || '—'}
        />
      </div>

      {/* Notes */}
      {adjustment.notes && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 mb-1">ملاحظات</p>
          <p className="text-xs text-slate-800 leading-relaxed">{adjustment.notes}</p>
        </div>
      )}

      {/* Stats */}
      {stats.withDiff > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            label="بنود بفروقات"
            value={String(stats.withDiff)}
            color="bg-slate-50 text-slate-700 border-slate-200"
          />
          <StatBox
            label="زيادة (كمية)"
            value={`+${formatNum(stats.totalGain, 3)}`}
            subValue={`${formatNum(stats.totalGainValue)} قيمة`}
            color="bg-emerald-50 text-emerald-700 border-emerald-200"
            icon={<TrendingUp className="w-3 h-3" />}
          />
          <StatBox
            label="نقص (كمية)"
            value={`-${formatNum(stats.totalLoss, 3)}`}
            subValue={`${formatNum(stats.totalLossValue)} قيمة`}
            color="bg-rose-50 text-rose-700 border-rose-200"
            icon={<TrendingDown className="w-3 h-3" />}
          />
          <StatBox
            label="صافي القيمة"
            value={`${netValue >= 0 ? '+' : ''}${formatNum(netValue)}`}
            color={
              netValue > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : netValue < 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }
            icon={<Calculator className="w-3 h-3" />}
          />
        </div>
      )}

      {/* Journal entry preview */}
      {Math.abs(netValue) > 0.01 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-black text-amber-900">
              القيد المحاسبي {adjustment.id ? 'المرتبط' : 'المتوقع'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 font-mono text-[11px] leading-relaxed">
            {netValue > 0 ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                  <span className="font-bold text-slate-800">113 — المخزون</span>
                  <span className="font-bold text-emerald-700">{formatNum(netValue)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>518 — فروقات الجرد</span>
                  <span>{formatNum(netValue)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                  <span className="font-bold text-slate-800">518 — فروقات الجرد</span>
                  <span className="font-bold text-rose-700">{formatNum(Math.abs(netValue))}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>113 — المخزون</span>
                  <span>{formatNum(Math.abs(netValue))}</span>
                </div>
              </>
            )}
          </div>
          {adjustment.id && (
            <p className="text-[10px] text-amber-700 mt-2">
              * القيد منشور في:{' '}
              <a
                href={`/journal-entries/${adjustment.id}`}
                className="text-emerald-700 hover:underline font-bold"
              >
                عرض القيد
              </a>
            </p>
          )}
        </div>
      )}

      {/* Items table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            بنود التسوية ({adjustment.items.length})
          </h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">#</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">المنتج</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">الدفعة</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">دفترية</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">فعلية</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">الفرق</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-700">قيمة الفرق</th>
            </tr>
          </thead>
          <tbody>
            {adjustment.items.map((item, idx) => {
              const diff = Number(item.difference);
              const value = Math.abs(diff) * Number(item.unit_cost || 0);
              return (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 ${
                    Math.abs(diff) > 0.001
                      ? diff > 0
                        ? 'bg-emerald-50/20'
                        : 'bg-rose-50/20'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-bold text-slate-800">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.product_sku} · {item.product_unit}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {item.batch_number ? (
                      <div>
                        <p className="font-mono text-[10px]">{item.batch_number}</p>
                        {item.batch_expiry && (
                          <p className="text-[9px] text-slate-500">
                            {formatDate(item.batch_expiry)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                    {formatNum(Number(item.system_quantity), 3)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">
                    {formatNum(Number(item.actual_quantity), 3)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {Math.abs(diff) < 0.001 ? (
                      <span className="text-slate-400">0</span>
                    ) : diff > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                        <TrendingUp className="w-3 h-3" />
                        +{formatNum(diff, 3)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold">
                        <TrendingDown className="w-3 h-3" />
                        {formatNum(diff, 3)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono">
                    {Math.abs(diff) < 0.001 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className={diff > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatNum(value)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-900 mb-3">سجل الأحداث</h3>
        <div className="space-y-2">
          <TimelineItem
            icon={<FileText className="w-3.5 h-3.5" />}
            color="text-slate-600 bg-slate-100"
            label="تم إنشاء التسوية"
            detail={`بواسطة ${adjustment.created_by_name || '—'} · ${formatDateTime(adjustment.created_at)}`}
          />
          {adjustment.confirmed_at && (
            <TimelineItem
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              color="text-emerald-600 bg-emerald-100"
              label="تم تأكيد التسوية"
              detail={`بواسطة ${adjustment.confirmed_by_name || '—'} · ${formatDateTime(adjustment.confirmed_at)}`}
            />
          )}
          {adjustment.cancelled_at && (
            <TimelineItem
              icon={<XCircle className="w-3.5 h-3.5" />}
              color="text-rose-600 bg-rose-100"
              label="تم إلغاء التسوية"
              detail={
                <>
                  بواسطة {adjustment.cancelled_by_name || '—'} · {formatDateTime(adjustment.cancelled_at)}
                  {adjustment.cancel_reason && (
                    <span className="block text-[10px] text-slate-600 mt-0.5">
                      السبب: {adjustment.cancel_reason}
                    </span>
                  )}
                </>
              }
            />
          )}
        </div>
      </div>

      {/* Cancel Modal */}
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
              إلغاء التسوية
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              هل تريد إلغاء التسوية <strong>{adjustment.adjustment_number}</strong>؟
              {adjustment.status === 'confirmed' && (
                <span className="block mt-2 text-rose-700 font-bold">
                  ⚠️ التسوية مؤكدة — سيتم عكس الحركات المخزنية والقيد المحاسبي.
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
              placeholder="مثال: خطأ في الجرد"
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

// ═══ Sub-components ═══
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
    </div>
    <div className="text-xs font-bold text-slate-800">{value}</div>
  </div>
);

const StatBox: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  color: string;
  icon?: React.ReactNode;
}> = ({ label, value, subValue, color, icon }) => (
  <div className={`p-3 rounded-xl border ${color}`}>
    <div className="flex items-center gap-1 text-[10px] font-bold opacity-80">
      {icon}
      {label}
    </div>
    <p className="text-lg font-black mt-0.5 font-mono">{value}</p>
    {subValue && <p className="text-[10px] opacity-70 font-mono">{subValue}</p>}
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