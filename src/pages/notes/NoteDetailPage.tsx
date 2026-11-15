import React, { useState, useEffect } from 'react';
import {
  ArrowRight, FileText, CheckCircle, XCircle, Clock,
  User, Truck, Calendar, Link2, Printer, Ban,
  TrendingUp, TrendingDown, AlertTriangle, Calculator,
  ExternalLink, Tag,
} from 'lucide-react';
import { notesApi, Note } from '../../api/notesApi';
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

const REASON_LABEL: Record<string, string> = {
  return:     'مرتجع',
  discount:   'خصم',
  correction: 'تصحيح',
  price_diff: 'فرق سعر',
  shipping:   'شحن',
  other:      'أخرى',
};

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  noteId: string;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const NoteDetailPage: React.FC<Props> = ({ noteId, onBack }) => {
  const [note, setNote] = useState<Note | null>(null);
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
      const data = await notesApi.getById(noteId);
      setNote(data);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل الإشعار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  // ═══ Actions ═══
  const handleConfirm = async () => {
    if (!window.confirm('هل تريد تأكيد الإشعار؟ سيُنشأ القيد المحاسبي.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await notesApi.confirm(noteId);
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
      await notesApi.cancel(noteId, cancelReason.trim() || undefined);
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
  if (!note) return;
  setPdfLoading(true);
  try {
    await pdfApi.downloadNotePdf(note.id, note.note_number);
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
        <LoadingSpinner message="جاري تحميل الإشعار..." />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">الإشعار غير موجود</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl"
        >
          العودة
        </button>
      </div>
    );
  }

  // ═══ Derived ═══
  const statusInfo = STATUS_MAP[note.status];
  const isCredit = note.note_type === 'credit';
  const isCustomer = note.party_type === 'customer';
  const partyName = isCustomer ? note.customer_name : note.supplier_name;
  const partyLabel = isCustomer ? 'العميل' : 'المورد';
  const typeLabel = isCredit ? 'إشعار دائن' : 'إشعار مدين';

  // ═══ Journal preview (حسب القيد المتوقع) ═══
  const journalPreview = (() => {
    const total = Number(note.total);
    if (total <= 0) return null;

    if (isCredit && isCustomer) {
      return {
        dr: { name: 'مرتجع مبيعات (411)', amount: total },
        cr: { name: 'ذمم عملاء (112)', amount: total },
        label: 'إشعار دائن لعميل — تخفيض ذمته',
      };
    }
    if (isCredit && !isCustomer) {
      return {
        dr: { name: 'ذمم موردين (211)', amount: total },
        cr: { name: 'مرتجع مشتريات (511)', amount: total },
        label: 'إشعار دائن لمورد — تخفيض مستحقاته',
      };
    }
    if (!isCredit && isCustomer) {
      return {
        dr: { name: 'ذمم عملاء (112)', amount: total },
        cr: { name: 'إيرادات أخرى (411)', amount: total },
        label: 'إشعار مدين لعميل — زيادة ذمته',
      };
    }
    return {
      dr: { name: 'مصاريف أخرى (518)', amount: total },
      cr: { name: 'ذمم موردين (211)', amount: total },
      label: 'إشعار مدين لمورد — زيادة مستحقاته',
    };
  })();

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
              <FileText className="w-6 h-6 text-emerald-600" />
              {note.note_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-600">
                {typeLabel} · {formatDate(note.note_date)}
              </p>
              {isCredit ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  <TrendingDown className="w-3 h-3" />
                  دائن
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                  <TrendingUp className="w-3 h-3" />
                  مدين
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>

          {note.status === 'draft' && (
            <>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة
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
                {actionLoading ? 'جاري التأكيد...' : 'تأكيد الإشعار'}
              </button>
            </>
          )}

          {note.status === 'confirmed' && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </button>
          )}

          // في الـ Header (بجانب زر "طباعة")
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
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* ═══ Info cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={isCustomer ? <User className="w-4 h-4 text-emerald-600" /> : <Truck className="w-4 h-4 text-emerald-600" />}
          label={partyLabel}
          value={partyName || '—'}
        />
        <InfoCard
          icon={<Calendar className="w-4 h-4 text-emerald-600" />}
          label="تاريخ الإشعار"
          value={formatDate(note.note_date)}
        />
        <InfoCard
          icon={<Tag className="w-4 h-4 text-emerald-600" />}
          label="السبب"
          value={REASON_LABEL[note.reason] || note.reason}
        />
        <InfoCard
          icon={<Calculator className="w-4 h-4 text-emerald-600" />}
          label="الإجمالي"
          value={
            <span className="font-mono text-base font-black text-emerald-700">
              {formatMoney(Number(note.total))}
            </span>
          }
        />
      </div>

      {/* ═══ Invoice link ═══ */}
      {note.invoice_id && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-sky-800">مرتبط بفاتورة:</span>
          <a
            href={`/invoices/${note.invoice_id}`}
            className="text-xs font-bold text-sky-700 hover:underline"
          >
            {note.invoice_number || note.invoice_id}
          </a>
        </div>
      )}

      {/* ═══ Description ═══ */}
      {note.description && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 mb-1">وصف / ملاحظات</p>
          <p className="text-xs text-slate-800 leading-relaxed">{note.description}</p>
        </div>
      )}

      {/* ═══ Items table ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            بنود الإشعار ({note.items.length})
          </h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700 w-8">#</th>
              <th className="text-right px-3 py-2.5 font-bold text-slate-700">الوصف</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">الكمية</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">السعر</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">خصم</th>
              <th className="text-center px-3 py-2.5 font-bold text-slate-700">ضريبة</th>
              <th className="text-left px-3 py-2.5 font-bold text-slate-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {note.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                <td className="px-3 py-2.5">
                  <p className="font-bold text-slate-800">{item.description}</p>
                  {item.product_name && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.product_sku} · {item.product_name}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                  {formatQty(Number(item.quantity))}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                  {formatMoney(Number(item.unit_price))}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                  {item.discount_rate > 0 ? (
                    <div>
                      <p>{formatMoney(Number(item.discount_amount))}</p>
                      <p className="text-[9px] text-slate-400">{item.discount_rate}%</p>
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                  {item.tax_rate > 0 ? (
                    <div>
                      <p>{formatMoney(Number(item.tax_amount))}</p>
                      <p className="text-[9px] text-slate-400">{item.tax_rate}%</p>
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-left font-mono font-bold text-slate-800">
                  {formatMoney(Number(item.line_total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
          <div className="flex flex-col gap-1.5 max-w-md ml-auto">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">المجموع</span>
              <span className="font-mono font-bold text-slate-700">
                {formatMoney(Number(note.subtotal))}
              </span>
            </div>
            {Number(note.tax_total) > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">الضريبة</span>
                <span className="font-mono font-bold text-slate-700">
                  {formatMoney(Number(note.tax_total))}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1.5 border-t border-slate-300">
              <span className="font-black text-slate-900">الإجمالي</span>
              <span className="font-mono font-black text-emerald-700">
                {formatMoney(Number(note.total))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Journal entry ═══ */}
      {journalPreview && (
        <div className={`rounded-2xl p-4 border ${
          note.journal_entry_id
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-1.5 mb-2">
            {note.journal_entry_id ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <p className={`text-xs font-black ${
              note.journal_entry_id ? 'text-emerald-900' : 'text-amber-900'
            }`}>
              {note.journal_entry_id ? 'القيد المحاسبي المرتبط' : 'القيد المحاسبي المتوقع'}
            </p>
          </div>
          <p className={`text-[10px] mb-2 ${
            note.journal_entry_id ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {journalPreview.label}
          </p>
          <div className="bg-white rounded-lg p-3 font-mono text-[11px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
              <span className="font-bold text-slate-800">Dr {journalPreview.dr.name}</span>
              <span className="font-bold text-emerald-700">{formatMoney(journalPreview.dr.amount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pr-4">
              <span>Cr {journalPreview.cr.name}</span>
              <span>{formatMoney(journalPreview.cr.amount)}</span>
            </div>
          </div>
          {note.journal_entry_id && (
            <div className="mt-2 flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3 text-emerald-700" />
              <a
                href={`/journal-entries/${note.journal_entry_id}`}
                className="text-[10px] font-bold text-emerald-700 hover:underline"
              >
                عرض القيد في دفتر اليومية
              </a>
            </div>
          )}
        </div>
      )}

      {/* ═══ Timeline ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-900 mb-3">سجل الأحداث</h3>
        <div className="space-y-3">
          <TimelineItem
            icon={<FileText className="w-3.5 h-3.5" />}
            color="text-slate-600 bg-slate-100"
            label="تم إنشاء الإشعار"
            detail={`بواسطة ${note.created_by_name || '—'} · ${formatDateTime(note.created_at)}`}
          />
          {note.confirmed_at && (
            <TimelineItem
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              color="text-emerald-600 bg-emerald-100"
              label="تم تأكيد الإشعار"
              detail={`بواسطة ${note.confirmed_by_name || '—'} · ${formatDateTime(note.confirmed_at)}`}
            />
          )}
          {note.cancelled_at && (
            <TimelineItem
              icon={<XCircle className="w-3.5 h-3.5" />}
              color="text-rose-600 bg-rose-100"
              label="تم إلغاء الإشعار"
              detail={
                <>
                  بواسطة {note.cancelled_by_name || '—'} · {formatDateTime(note.cancelled_at)}
                  {note.cancel_reason && (
                    <span className="block text-[10px] text-slate-600 mt-0.5">
                      السبب: {note.cancel_reason}
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
              إلغاء الإشعار
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              هل تريد إلغاء الإشعار <strong>{note.note_number}</strong>؟
              {note.status === 'confirmed' && (
                <span className="block mt-2 text-rose-700 font-bold">
                  ⚠️ الإشعار مؤكد — سيتم عكس القيد المحاسبي.
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
              placeholder="مثال: خطأ في الإدخال"
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
}> = ({ icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
    </div>
    <div className="text-xs font-bold text-slate-800">{value}</div>
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