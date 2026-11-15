import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Truck, CheckCircle, XCircle, Clock, Send,
  User, MapPin, Phone, Car, Calendar, Printer, Ban,
  Package, FileText, Warehouse as WarehouseIcon, Link2,
  ExternalLink, Navigation, Image as ImageIcon, AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';
import { deliveryNotesApi, DeliveryNote } from '../../api/deliveryNotesApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { FileDown } from 'lucide-react';
import { pdfApi } from '../../api/pdfApi1';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:      { label: 'مسودة',      color: 'bg-slate-100 text-slate-700',     icon: <Clock className="w-3.5 h-3.5" /> },
  dispatched: { label: 'مُرسل',      color: 'bg-sky-50 text-sky-700',           icon: <Send className="w-3.5 h-3.5" /> },
  delivered:  { label: 'تم التسليم', color: 'bg-emerald-50 text-emerald-700',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  invoiced:   { label: 'مفوتر',      color: 'bg-purple-50 text-purple-700',     icon: <FileText className="w-3.5 h-3.5" /> },
  cancelled:  { label: 'ملغي',       color: 'bg-rose-50 text-rose-700',         icon: <XCircle className="w-3.5 h-3.5" /> },
};

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  deliveryNoteId: string;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const DeliveryNoteDetailPage: React.FC<Props> = ({ deliveryNoteId, onBack }) => {
  const [dn, setDn] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Delivered modal
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [deliveredToName, setDeliveredToName] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);
  
  // ═══ Load ═══
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveryNotesApi.getById(deliveryNoteId);
      setDn(data);
      if (data.delivered_to_name) setDeliveredToName(data.delivered_to_name);
      if (data.signature_url) setSignatureUrl(data.signature_url);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل المذكرة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryNoteId]);

  // ═══ Actions ═══
  const handleDispatch = async () => {
    if (!window.confirm('هل تريد صرف المذكرة؟ ستُخصم الكميات من المخزون.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await deliveryNotesApi.dispatch(deliveryNoteId);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل الصرف');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await deliveryNotesApi.markDelivered(deliveryNoteId, {
        delivered_to_name: deliveredToName.trim() || undefined,
        signature_url: signatureUrl.trim() || undefined,
      });
      setShowDeliveredModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل تأكيد التسليم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!window.confirm('هل تريد تحويل المذكرة إلى فاتورة؟')) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await deliveryNotesApi.convertToInvoice(deliveryNoteId);
      await loadData();
      // يمكن التوجيه للفاتورة
      if (result.invoice?.id) {
        alert(`تم إنشاء الفاتورة. سيتم تحويلك للفاتورة.`);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل التحويل لفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await deliveryNotesApi.cancel(deliveryNoteId, cancelReason.trim() || undefined);
      setShowCancelModal(false);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل الإلغاء');
    } finally {
      setActionLoading(false);
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
        <LoadingSpinner message="جاري تحميل المذكرة..." />
      </div>
    );
  }

  if (!dn) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">المذكرة غير موجودة</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl"
        >
          العودة
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[dn.status];
  const totalQty = dn.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalValue = dn.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

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
              <Truck className="w-6 h-6 text-emerald-600" />
              {dn.delivery_number}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              مذكرة تسليم · {formatDate(dn.delivery_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>

          {/* Actions per status */}
          {dn.status === 'draft' && (
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
                onClick={handleDispatch}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {actionLoading ? 'جاري الصرف...' : 'صرف للشحن'}
              </button>
            </>
          )}

          {dn.status === 'dispatched' && (
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
                onClick={() => setShowDeliveredModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                تأكيد التسليم
              </button>
            </>
          )}

          {dn.status === 'delivered' && (
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
                onClick={handleConvertToInvoice}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {actionLoading ? 'جاري التحويل...' : 'تحويل لفاتورة'}
              </button>
            </>
          )}

          {dn.status === 'invoiced' && (
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

      {/* ═══ Progress bar (visual status) ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <Step
            label="مسودة"
            active={dn.status === 'draft'}
            done={['dispatched', 'delivered', 'invoiced'].includes(dn.status)}
            icon={<Clock className="w-4 h-4" />}
          />
          <StepLine done={['dispatched', 'delivered', 'invoiced'].includes(dn.status)} />
          <Step
            label="مُرسل"
            active={dn.status === 'dispatched'}
            done={['delivered', 'invoiced'].includes(dn.status)}
            icon={<Send className="w-4 h-4" />}
          />
          <StepLine done={['delivered', 'invoiced'].includes(dn.status)} />
          <Step
            label="تم التسليم"
            active={dn.status === 'delivered'}
            done={dn.status === 'invoiced'}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <StepLine done={dn.status === 'invoiced'} />
          <Step
            label="مفوتر"
            active={dn.status === 'invoiced'}
            done={false}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* ═══ Info cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard
          icon={<User className="w-4 h-4 text-emerald-600" />}
          label="العميل"
          value={dn.customer_name}
          sub={dn.customer_phone}
        />
        <InfoCard
          icon={<WarehouseIcon className="w-4 h-4 text-emerald-600" />}
          label="المستودع المصدر"
          value={dn.warehouse_name}
        />
        <InfoCard
          icon={<Calendar className="w-4 h-4 text-emerald-600" />}
          label="تاريخ التسليم"
          value={formatDate(dn.delivery_date)}
        />
        <InfoCard
          icon={<Package className="w-4 h-4 text-emerald-600" />}
          label="الإجمالي"
          value={`${totalQty.toFixed(2)} وحدة`}
          sub={`${formatMoney(totalValue)} قيمة`}
        />
      </div>

      {/* ═══ Delivery info ═══ */}
      {(dn.driver_name || dn.driver_phone || dn.vehicle_number || dn.delivery_address) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-emerald-600" />
            بيانات الشحن
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {dn.driver_name && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500">السائق</p>
                  <p className="text-xs font-bold text-slate-800">{dn.driver_name}</p>
                </div>
              </div>
            )}
            {dn.driver_phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500">هاتف السائق</p>
                  <p className="text-xs font-bold text-slate-800 font-mono" dir="ltr">
                    {dn.driver_phone}
                  </p>
                </div>
              </div>
            )}
            {dn.vehicle_number && (
              <div className="flex items-start gap-2">
                <Car className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500">المركبة</p>
                  <p className="text-xs font-bold text-slate-800 font-mono" dir="ltr">
                    {dn.vehicle_number}
                  </p>
                </div>
              </div>
            )}
            {dn.delivery_address && (
              <div className="flex items-start gap-2 md:col-span-2 lg:col-span-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500">عنوان التسليم</p>
                  <p className="text-xs font-bold text-slate-800">{dn.delivery_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Links (sales order / invoice) ═══ */}
      {(dn.sales_order_id || dn.invoice_id) && (
        <div className="flex flex-wrap gap-2">
          {dn.sales_order_id && (
            <a
              href={`/sales-orders/${dn.sales_order_id}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition"
            >
              <Link2 className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-bold text-sky-800">أمر بيع:</span>
              <span className="text-xs font-bold text-sky-700 font-mono">
                {dn.sales_order_number || dn.sales_order_id.slice(0, 8)}
              </span>
              <ExternalLink className="w-3 h-3 text-sky-600" />
            </a>
          )}
          {dn.invoice_id && (
            <a
              href={`/invoices/${dn.invoice_id}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-bold text-purple-800">فاتورة:</span>
              <span className="text-xs font-bold text-purple-700 font-mono">
                {dn.invoice_number || dn.invoice_id.slice(0, 8)}
              </span>
              <ExternalLink className="w-3 h-3 text-purple-600" />
            </a>
          )}
        </div>
      )}

      {/* ═══ Notes ═══ */}
      {dn.notes && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 mb-1">ملاحظات</p>
          <p className="text-xs text-slate-800 leading-relaxed">{dn.notes}</p>
        </div>
      )}

      {/* ═══ Items table ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            البنود ({dn.items.length})
          </h3>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {totalQty.toFixed(2)} وحدة · {formatMoney(totalValue)}
          </span>
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
            {dn.items.map((item, idx) => {
              const qty = Number(item.quantity);
              const price = Number(item.unit_price);
              const lineTotal = qty * price;
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-800">{item.product_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.product_sku} · {item.product_unit}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{item.description}</p>
                    )}
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
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">
                    {formatQty(qty)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                    {formatMoney(price)}
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono font-bold text-slate-800">
                    {formatMoney(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
          <div className="flex flex-col gap-1.5 max-w-md ml-auto">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">إجمالي الكمية</span>
              <span className="font-mono font-bold text-slate-700">{totalQty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1.5 border-t border-slate-300">
              <span className="font-black text-slate-900">القيمة الإجمالية</span>
              <span className="font-mono font-black text-emerald-700">
                {formatMoney(totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Delivery confirmation ═══ */}
      {(dn.delivered_to_name || dn.signature_url) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <h3 className="text-xs font-black text-emerald-900 mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            تأكيد الاستلام
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dn.delivered_to_name && (
              <div>
                <p className="text-[10px] font-bold text-emerald-700">استلم بواسطة</p>
                <p className="text-xs font-bold text-emerald-900">{dn.delivered_to_name}</p>
              </div>
            )}
            {dn.delivered_at && (
              <div>
                <p className="text-[10px] font-bold text-emerald-700">تاريخ التسليم</p>
                <p className="text-xs font-bold text-emerald-900">
                  {formatDateTime(dn.delivered_at)}
                </p>
              </div>
            )}
            {dn.signature_url && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-emerald-700 mb-1">التوقيع</p>
                <img
                  src={dn.signature_url}
                  alt="signature"
                  className="max-w-xs border border-emerald-300 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Timeline ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-900 mb-3">سجل الأحداث</h3>
        <div className="space-y-3">
          <TimelineItem
            icon={<Truck className="w-3.5 h-3.5" />}
            color="text-slate-600 bg-slate-100"
            label="تم إنشاء المذكرة"
            detail={`بواسطة ${dn.created_by_name || '—'} · ${formatDateTime(dn.created_at)}`}
          />
          {dn.dispatched_at && (
            <TimelineItem
              icon={<Send className="w-3.5 h-3.5" />}
              color="text-sky-600 bg-sky-100"
              label="تم الصرف للشحن"
              detail={formatDateTime(dn.dispatched_at)}
            />
          )}
          {dn.delivered_at && (
            <TimelineItem
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              color="text-emerald-600 bg-emerald-100"
              label="تم التسليم"
              detail={
                <>
                  {dn.delivered_to_name && `استلم: ${dn.delivered_to_name} · `}
                  {formatDateTime(dn.delivered_at)}
                </>
              }
            />
          )}
          {dn.status === 'invoiced' && dn.invoice_id && (
            <TimelineItem
              icon={<FileText className="w-3.5 h-3.5" />}
              color="text-purple-600 bg-purple-100"
              label="تحولت لفاتورة"
              detail={
                <>
                  <a
                    href={`/invoices/${dn.invoice_id}`}
                    className="text-purple-700 hover:underline font-bold"
                  >
                    {dn.invoice_number || 'عرض الفاتورة'}
                  </a>
                </>
              }
            />
          )}
          {dn.status === 'cancelled' && (
            <TimelineItem
              icon={<XCircle className="w-3.5 h-3.5" />}
              color="text-rose-600 bg-rose-100"
              label="تم الإلغاء"
              detail="تم إلغاء المذكرة"
            />
          )}
        </div>
      </div>

      {/* ═══ Delivered Modal ═══ */}
      {showDeliveredModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !actionLoading && setShowDeliveredModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              تأكيد التسليم
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              أدخل بيانات من استلم البضاعة (اختياري).
            </p>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المستلم
            </label>
            <input
              type="text"
              value={deliveredToName}
              onChange={(e) => setDeliveredToName(e.target.value)}
              maxLength={150}
              disabled={actionLoading}
              placeholder="اسم من استلم البضاعة"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-3"
            />
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط التوقيع (اختياري)
            </label>
            <input
              type="url"
              value={signatureUrl}
              onChange={(e) => setSignatureUrl(e.target.value)}
              disabled={actionLoading}
              placeholder="https://.../signature.png"
              dir="ltr"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeliveredModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleMarkDelivered}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                تأكيد التسليم
              </button>
            </div>
          </div>
        </div>
      )}

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
              إلغاء المذكرة
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              هل تريد إلغاء المذكرة <strong>{dn.delivery_number}</strong>؟
              {dn.status === 'dispatched' && (
                <span className="block mt-2 text-rose-700 font-bold">
                  ⚠️ ستُعاد الكميات إلى المخزون.
                </span>
              )}
              {dn.status === 'delivered' && (
                <span className="block mt-2 text-rose-700 font-bold">
                  ⚠️ ستُعاد الكميات إلى المخزون.
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
              placeholder="مثال: العميل رفض الاستلام"
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

// Step component for progress bar
const Step: React.FC<{
  label: string;
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
}> = ({ label, active, done, icon }) => (
  <div className="flex flex-col items-center gap-1 flex-1">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
        done
          ? 'bg-emerald-600 text-white'
          : active
          ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
          : 'bg-slate-100 text-slate-400'
      }`}
    >
      {done ? <CheckCircle className="w-4 h-4" /> : icon}
    </div>
    <span
      className={`text-[10px] font-bold text-center ${
        done || active ? 'text-slate-800' : 'text-slate-400'
      }`}
    >
      {label}
    </span>
  </div>
);

const StepLine: React.FC<{ done: boolean }> = ({ done }) => (
  <div className={`flex-1 h-0.5 -mt-3 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
);