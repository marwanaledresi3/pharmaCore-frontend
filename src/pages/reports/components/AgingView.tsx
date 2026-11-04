import React from 'react';
import { AgingReport } from '../types';
import { fmtMoney, toNum } from '../utils';
import { NoData } from './NoData';
interface Props {
  data: AgingReport;
  baseCurrency: string;
  type: 'ar' | 'ap';
}

export const AgingView: React.FC<Props> = ({
  data,
  baseCurrency,
  type,
}) => {
  if (!data) return <NoData />;

  const parties =
    (type === 'ar' ? data.customers : data.suppliers) ?? [];

  const totals = {
    current: toNum(data.totals?.current),
    days_1_30: toNum(data.totals?.days_1_30),
    days_31_60: toNum(data.totals?.days_31_60),
    days_61_90: toNum(data.totals?.days_61_90),
    days_over_90: toNum(data.totals?.days_over_90),
    total: toNum(data.totals?.total),
  };

  const partyName = (p: any) =>
    type === 'ar' ? p.customer_name : p.supplier_name;

  const partyId = (p: any) =>
    type === 'ar' ? p.customer_id : p.supplier_id;

  const label = type === 'ar' ? 'العميل' : 'المورد';
  
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          أعمار {type === 'ar' ? 'ديون العملاء' : 'ذمم الموردين'} كما في {data.as_of_date}
        </h3>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-[10px] text-emerald-700 font-bold">غير مستحق</p>
          <p className="text-sm font-black font-mono text-emerald-900 mt-0.5">
            {fmtMoney(data.totals.current)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
          <p className="text-[10px] text-yellow-700 font-bold">1-30 يوم</p>
          <p className="text-sm font-black font-mono text-yellow-900 mt-0.5">
            {fmtMoney(data.totals.days_1_30)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-[10px] text-orange-700 font-bold">31-60</p>
          <p className="text-sm font-black font-mono text-orange-900 mt-0.5">
            {fmtMoney(data.totals.days_31_60)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
          <p className="text-[10px] text-rose-700 font-bold">61-90</p>
          <p className="text-sm font-black font-mono text-rose-900 mt-0.5">
            {fmtMoney(data.totals.days_61_90)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-red-100 border border-red-300">
          <p className="text-[10px] text-red-800 font-bold">+90 يوم</p>
          <p className="text-sm font-black font-mono text-red-900 mt-0.5">
            {fmtMoney(data.totals.days_over_90)}
          </p>
        </div>
      </div>

      {/* Total row */}
      <div className="p-4 rounded-xl bg-slate-800 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">إجمالي المديونية</span>
          <span className="text-lg font-black font-mono">
            {fmtMoney(data.totals.total, baseCurrency)}
          </span>
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">{label}</th>
              <th className="py-2.5 px-3 text-left">غير مستحق</th>
              <th className="py-2.5 px-3 text-left">1-30</th>
              <th className="py-2.5 px-3 text-left">31-60</th>
              <th className="py-2.5 px-3 text-left">61-90</th>
              <th className="py-2.5 px-3 text-left">+90</th>
              <th className="py-2.5 px-3 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parties.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  لا توجد أرصدة مستحقة
                </td>
              </tr>
            ) : (
              parties.map((p: any) => (
                <tr key={partyId(p)} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{partyName(p)}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{fmtMoney(p.current)}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{fmtMoney(p.days_1_30)}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{fmtMoney(p.days_31_60)}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{fmtMoney(p.days_61_90)}</td>
                  <td className="py-2.5 px-3 text-left font-mono font-bold text-red-700">
                    {fmtMoney(p.days_over_90)}
                  </td>
                  <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900">
                    {fmtMoney(p.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {parties.length > 0 && (
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr className="font-black text-slate-900">
                <td className="py-3 px-3">الإجمالي</td>
                <td className="py-3 px-3 text-left font-mono">{fmtMoney(data.totals.current)}</td>
                <td className="py-3 px-3 text-left font-mono">{fmtMoney(data.totals.days_1_30)}</td>
                <td className="py-3 px-3 text-left font-mono">{fmtMoney(data.totals.days_31_60)}</td>
                <td className="py-3 px-3 text-left font-mono">{fmtMoney(data.totals.days_61_90)}</td>
                <td className="py-3 px-3 text-left font-mono text-red-800">
                  {fmtMoney(data.totals.days_over_90)}
                </td>
                <td className="py-3 px-3 text-left font-mono">{fmtMoney(data.totals.total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};