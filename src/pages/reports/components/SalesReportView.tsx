import React from 'react';
import { SalesReport } from '../types';
import { fmtMoney, fmtDate, toNum, exportToCsv } from '../utils';
import { Download } from 'lucide-react';
import { NoData } from './NoData';

interface Props {
  data: SalesReport;
  baseCurrency: string;
}

export const SalesReportView: React.FC<Props> = ({ data, baseCurrency }) => {
  if (!data) {
    return <NoData />;
  }

  const totals = data.totals || {
    invoices_count: 0,
    total_sales: 0,
    total_paid: 0,
  };
  const by_date = Array.isArray(data.by_date) ? data.by_date : [];
  const by_customer = Array.isArray(data.by_customer) ? data.by_customer : [];
  const by_product = Array.isArray(data.by_product) ? data.by_product : [];

  // ... باقي الكود{

  const handleExport = () => {
    exportToCsv(
      by_date.map((r) => ({
        'الفترة': fmtDate(r.period),
        'عدد الفواتير': r.invoices_count,
        'إجمالي المبيعات': toNum(r.total_sales),
        'المدفوع': toNum(r.total_paid),
      })),
      'sales_report'
    );
  };

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-700 font-bold">عدد الفواتير</p>
          <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
            {totals.invoices_count}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-bold">إجمالي المبيعات</p>
          <p className="text-2xl font-black font-mono text-blue-900 mt-1">
            {fmtMoney(totals.total_sales, baseCurrency)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 font-bold">المحصّل</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">
            {fmtMoney(totals.total_paid, baseCurrency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            متبقي: {fmtMoney(totals.total_sales - totals.total_paid, baseCurrency)}
          </p>
        </div>
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" /> تصدير CSV
        </button>
      </div>

      {/* By Date */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">المبيعات حسب الفترة</h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">الفترة</th>
                <th className="py-2.5 px-3 text-center">عدد الفواتير</th>
                <th className="py-2.5 px-3 text-left">إجمالي المبيعات</th>
                <th className="py-2.5 px-3 text-left">المحصّل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {by_date.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono">{fmtDate(r.period)}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{r.invoices_count}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold">
                    {fmtMoney(r.total_sales)}
                  </td>
                  <td className="py-2.5 px-3 text-left font-mono text-emerald-700">
                    {fmtMoney(r.total_paid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Customer */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">أعلى العملاء</h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">العميل</th>
                <th className="py-2.5 px-3 text-center">عدد الفواتير</th>
                <th className="py-2.5 px-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {by_customer.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{c.invoices_count}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold">
                    {fmtMoney(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Product */}
      {by_product.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">أعلى المنتجات</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">المنتج</th>
                  <th className="py-2.5 px-3 text-center">SKU</th>
                  <th className="py-2.5 px-3 text-center">الكمية</th>
                  <th className="py-2.5 px-3 text-left">الإيراد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {by_product.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{p.sku}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{toNum(p.quantity_sold)}</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold">
                      {fmtMoney(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};