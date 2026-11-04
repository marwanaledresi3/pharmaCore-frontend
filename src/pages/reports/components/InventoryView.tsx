import React, { useState } from 'react';
import { InventoryReport } from '../types';
import { fmtMoney, fmtDate, toNum } from '../utils';
import { AlertTriangle, Clock } from 'lucide-react';
import { unwrap } from '../unwrap';

interface Props {
  data: InventoryReport;
  baseCurrency: string;
}

export const InventoryView: React.FC<Props> = ({ data, baseCurrency }) => {
  const d = unwrap<InventoryReport>(data);
  const [tab, setTab] = useState<'items' | 'expiring' | 'low'>('items');

  if (!d) {
    return (
      <div className="text-center py-12 text-xs text-slate-400">
        لا توجد بيانات مخزون
      </div>
    );
  }

  // التأكد من أن البيانات تخص تقرير المخزون فعلًا
  const hasInventoryShape =
    Array.isArray(d.items) ||
    Array.isArray(d.expiring_soon) ||
    Array.isArray(d.low_stock) ||
    !!d.summary;

  if (!hasInventoryShape) {
    return (
      <div className="text-center py-12 text-sm text-amber-700">
        البيانات المستلمة ليست بيانات تقرير المخزون.
        يرجى مراجعة طلب API الخاص بالمخزون.
      </div>
    );
  }

  const summary = d.summary ?? {
    products_count: 0,
    total_value: 0,
    total_units: 0,
  };

  const items = Array.isArray(d.items) ? d.items : [];
  const expiringSoon = Array.isArray(d.expiring_soon)
    ? d.expiring_soon
    : [];
  const lowStock = Array.isArray(d.low_stock) ? d.low_stock : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-bold">عدد المنتجات</p>
          <p className="text-2xl font-black font-mono text-blue-900 mt-1">
            {toNum(summary.products_count).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-700 font-bold">قيمة المخزون</p>
          <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
            {fmtMoney(toNum(summary.total_value), baseCurrency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 font-bold">إجمالي الوحدات</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">
            {toNum(summary.total_units).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab('items')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl ${
            tab === 'items'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          الأصناف ({items.length})
        </button>

        <button
          onClick={() => setTab('expiring')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 ${
            tab === 'expiring'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          <Clock className="w-3 h-3" />
          قرب الانتهاء ({expiringSoon.length})
        </button>

        <button
          onClick={() => setTab('low')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 ${
            tab === 'low'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          تحت الحد ({lowStock.length})
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        {tab === 'items' && (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">المنتج</th>
                <th className="py-2.5 px-3 text-center">SKU</th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-center">عدد الدفعات</th>
                <th className="py-2.5 px-3 text-left">القيمة</th>
                <th className="py-2.5 px-3 text-center">أقرب انتهاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={`${it.id}-${it.warehouse_id}`} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{it.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">{it.sku}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    {toNum(it.total_quantity)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {toNum(it.batches_count)}
                  </td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700">
                    {fmtMoney(toNum(it.total_value), baseCurrency)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {fmtDate(it.nearest_expiry)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    لا توجد أصناف مخزنية لعرضها
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === 'expiring' && (
          <table className="w-full text-right text-xs">
            <thead className="bg-amber-50 text-amber-800 font-bold border-b border-amber-200">
              <tr>
                <th className="py-2.5 px-3">المنتج</th>
                <th className="py-2.5 px-3 text-center">التشغيلة</th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-center">تاريخ الانتهاء</th>
                <th className="py-2.5 px-3 text-center">الأيام المتبقية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiringSoon.map((b) => (
                <tr key={b.id} className="hover:bg-amber-50/30">
                  <td className="py-2.5 px-3 font-semibold">{b.product_name}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {b.batch_number}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {toNum(b.quantity)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {fmtDate(b.expiry_date)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                    {b.days_left} يوم
                  </td>
                </tr>
              ))}
              {expiringSoon.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    لا توجد دفعات قريبة الانتهاء
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === 'low' && (
          <table className="w-full text-right text-xs">
            <thead className="bg-rose-50 text-rose-800 font-bold border-b border-rose-200">
              <tr>
                <th className="py-2.5 px-3">المنتج</th>
                <th className="py-2.5 px-3 text-center">SKU</th>
                <th className="py-2.5 px-3 text-center">الحد الأدنى</th>
                <th className="py-2.5 px-3 text-center">الحالي</th>
                <th className="py-2.5 px-3 text-center">النقص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStock.map((p) => {
                const deficit = Math.max(
                  0,
                  toNum(p.min_stock_level) - toNum(p.current_quantity)
                );
                return (
                  <tr key={p.id} className="hover:bg-rose-50/30">
                    <td className="py-2.5 px-3 font-semibold">{p.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{p.sku}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {toNum(p.min_stock_level)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {toNum(p.current_quantity)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                      {deficit.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {lowStock.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    لا توجد منتجات تحت الحد الأدنى
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
