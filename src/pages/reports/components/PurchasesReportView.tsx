import React from 'react';
import { PurchasesReport } from '../types';
import { fmtMoney, fmtDate, exportToCsv } from '../utils';
import { Download } from 'lucide-react';
import { NoData } from './NoData';
interface Props {
  data: PurchasesReport;
  baseCurrency: string;
}

export const PurchasesReportView: React.FC<Props> = ({ data, baseCurrency }) => {
  if (!data) {
    return <NoData />;
  }

  const totals = data.totals || {
    invoices_count: 0,
    total_purchases: 0,
    total_paid: 0,
  };
  const by_date = Array.isArray(data.by_date) ? data.by_date : [];
  const by_supplier = Array.isArray(data.by_supplier) ? data.by_supplier : [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-bold">عدد الفواتير</p>
          <p className="text-2xl font-black font-mono text-blue-900 mt-1">
            {totals.invoices_count}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <p className="text-xs text-rose-700 font-bold">إجمالي المشتريات</p>
          <p className="text-2xl font-black font-mono text-rose-900 mt-1">
            {fmtMoney(totals.total_purchases, baseCurrency)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 font-bold">المدفوع</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">
            {fmtMoney(totals.total_paid, baseCurrency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            متبقي: {fmtMoney(totals.total_purchases - totals.total_paid, baseCurrency)}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() =>
            exportToCsv(
              by_date.map((r) => ({
                'الفترة': fmtDate(r.period),
                'عدد الفواتير': r.invoices_count,
                'إجمالي المشتريات': Number(r.total_purchases),
                'المدفوع': Number(r.total_paid),
              })),
              'purchases_report'
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" /> تصدير CSV
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">المشتريات حسب الفترة</h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">الفترة</th>
                <th className="py-2.5 px-3 text-center">عدد الفواتير</th>
                <th className="py-2.5 px-3 text-left">إجمالي المشتريات</th>
                <th className="py-2.5 px-3 text-left">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {by_date.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono">{fmtDate(r.period)}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{r.invoices_count}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold">
                    {fmtMoney(r.total_purchases)}
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

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">المشتريات حسب المورد</h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">المورد</th>
                <th className="py-2.5 px-3 text-center">عدد الفواتير</th>
                <th className="py-2.5 px-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {by_supplier.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{s.invoices_count}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold">
                    {fmtMoney(s.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};