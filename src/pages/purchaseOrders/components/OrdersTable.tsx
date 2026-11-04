import React from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { PurchaseOrder, Supplier, Pagination as PaginationType } from '../../../types';
import { PaymentType } from '../../../api/ordersApi';
import { PAYMENT_TYPE_LABELS } from '../constants';
import { StatusBadge } from '../../../components/common/Badge';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import { SupplierKindBadge } from './SupplierKindBadge';

interface Props {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  isLoading: boolean;
  pagination: PaginationType;
  baseCurrency: string;
  canOpenCreate: boolean;
  onCreate: () => void;
  onOpenDetails: (order: PurchaseOrder) => void;
  onPageChange: (page: number) => void;
}

export const OrdersTable: React.FC<Props> = ({
  orders,
  suppliers,
  isLoading,
  pagination,
  baseCurrency,
  canOpenCreate,
  onCreate,
  onOpenDetails,
  onPageChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {isLoading ? (
        <LoadingSpinner message="جاري جلب أوامر الشراء..." fullHeight />
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد أوامر شراء"
          description="يمكنك البدء بإنشاء طلب شراء للمورد."
          actionLabel={canOpenCreate ? 'إنشاء أول أمر شراء' : undefined}
          onAction={canOpenCreate ? onCreate : undefined}
          icon={<ShoppingBag className="w-8 h-8" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-4">رقم الأمر</th>
                  <th className="py-3 px-4">المورد</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4 text-center">الإجمالي</th>
                  <th className="py-3 px-4 text-center">الدفع</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const sup = suppliers.find(
                    (s) => s.id === o.supplier_id || s.name === o.supplier_name
                  );
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        PO#{o.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{o.supplier_name || 'مورد عام'}</span>
                          <SupplierKindBadge supplier={sup} />
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
                            {PAYMENT_TYPE_LABELS[o.payment_type as PaymentType]}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <button
                          onClick={() => onOpenDetails(o)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        </>
      )}
    </div>
  );
};