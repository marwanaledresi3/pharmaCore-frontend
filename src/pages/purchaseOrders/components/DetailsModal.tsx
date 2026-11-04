import React from 'react';
import {
  RefreshCw, Wallet, XCircle, CheckCircle2, Printer, FileText, AlertCircle,
} from 'lucide-react';
import { PurchaseOrder, Supplier } from '../../../types';
import { PaymentMethod, PaymentType } from '../../../api/ordersApi';
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../constants';
import { Modal } from '../../../components/common/Modal';
import { StatusBadge } from '../../../components/common/Badge';
import { SupplierKindBadge } from './SupplierKindBadge';
import { pdfApi } from '../../../api/pdfApi1';

interface Props {
  isOpen: boolean;
  order: PurchaseOrder | null;
  suppliers: Supplier[];
  isLoading: boolean;
  actionLoading: boolean;
  baseCurrency: string;
  onClose: () => void;
  onPrint: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCreateInvoice: () => void;
}

export const DetailsModal: React.FC<Props> = ({
  isOpen,
  order,
  suppliers,
  isLoading,
  actionLoading,
  baseCurrency,
  onClose,
  onPrint,
  onConfirm,
  onCancel,
  onCreateInvoice,
}) => {
  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل: PO#${order.order_number}`} maxWidth="4xl">
      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التحميل...
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">المورد</span>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-slate-900">{order.supplier_name || 'مورد عام'}</span>
              <SupplierKindBadge
                supplier={suppliers.find(
                  (s) => s.id === order.supplier_id || s.name === order.supplier_name
                )}
              />
            </div>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">التاريخ</span>
            <span className="font-mono font-semibold text-slate-800">
              {order.order_date ? String(order.order_date).slice(0, 10) : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">الإجمالي</span>
            <span className="font-mono font-black text-emerald-700">
              {Number(order.total || 0).toLocaleString()} {baseCurrency}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">الحالة</span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Payment */}
        {order.payment_type && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-blue-900">
                الدفع: {PAYMENT_TYPE_LABELS[order.payment_type as PaymentType]}
              </span>
              {order.payment_method && (
                <span className="text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-blue-800">
              {order.due_date && (
                <div>
                  <span className="text-blue-600">الاستحقاق: </span>
                  <span className="font-mono font-bold">{String(order.due_date).slice(0, 10)}</span>
                </div>
              )}
              <div>
                <span className="text-blue-600">المدفوع: </span>
                <span className="font-mono font-bold">
                  {Number(order.paid_amount || 0).toFixed(2)} {baseCurrency}
                </span>
              </div>
              <div>
                <span className="text-blue-600">المتبقي: </span>
                <span className="font-mono font-bold">
                  {Math.max(0, Number(order.total) - Number(order.paid_amount || 0)).toFixed(2)} {baseCurrency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Supplier invoice */}
        {((order as any).supplier_invoice_number || (order as any).supplier_invoice_date) && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-900">فاتورة المورد الورقية</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(order as any).supplier_invoice_number && (
                <div>
                  <span className="text-slate-500">رقم: </span>
                  <span className="font-mono font-bold">{(order as any).supplier_invoice_number}</span>
                </div>
              )}
              {(order as any).supplier_invoice_date && (
                <div>
                  <span className="text-slate-500">تاريخ: </span>
                  <span className="font-mono font-bold">
                    {String((order as any).supplier_invoice_date).slice(0, 10)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {order.status === 'rejected' && order.rejection_reason && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-rose-700" />
              <span className="font-bold text-rose-900">سبب الرفض</span>
            </div>
            <p className="text-rose-800">{order.rejection_reason}</p>
          </div>
        )}

        {/* Items */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                <th className="py-2.5 px-3">الصنف</th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-center">البونص</th>
                <th className="py-2.5 px-3 text-center">السعر</th>
                <th className="py-2.5 px-3 text-center">الخصم</th>
                <th className="py-2.5 px-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.items || []).map((it: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {it.product_name || 'دواء'}
                    {it.sku && <span className="text-slate-400 mr-1">({it.sku})</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {it.paid_quantity ?? it.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                    {it.bonus_quantity || 0}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {Number(it.unit_price).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {it.discount_rate ? `${it.discount_rate}%` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-left font-bold text-slate-900 font-mono">
                    {Number(it.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
          {order.status === 'approved' && order.supplier_company_id && (
            <button
              onClick={() => pdfApi.downloadDeliveryNotePdf(String(order.order_number))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"
            >
              <FileText className="w-4 h-4" /> بوليصة تسليم
            </button>
          )}

          <div className="flex items-center gap-2">
            {order.status === 'draft' && (
              <>
                <button
                  onClick={onCancel}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> إلغاء
                </button>
                <button
                  onClick={onConfirm}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {actionLoading ? '...' : 'تأكيد واستلام'}
                </button>
              </>
            )}

            {order.status === 'pending_approval' && (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4" /> بانتظار موافقة المورد
                </span>
                <button
                  onClick={onCancel}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> سحب الطلب
                </button>
              </>
            )}

            {order.status === 'approved' && (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" /> وافق المورد — جاهز للاستلام
                </span>
                <button
                  onClick={onConfirm}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {actionLoading ? '...' : 'تأكيد واستلام المخزون'}
                </button>
              </>
            )}

            {order.status === 'confirmed' && (
              <button
                onClick={onCreateInvoice}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> تحويل إلى فاتورة
              </button>
            )}

            {order.status === 'cancelled' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
                <XCircle className="w-4 h-4" /> ملغاة
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};