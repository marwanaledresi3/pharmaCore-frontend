import React from 'react';
import { fmtMoney } from '../utils';

interface Props {
  data: any;
  dateFrom: string;
  dateTo: string;
  baseCurrency: string;
}

export const IncomeStatementView: React.FC<Props> = ({ data, dateFrom, dateTo, baseCurrency }) => {
  const revenues = data.revenues || [];
  const expenses = data.expenses || [];
  const totals = data.totals || { revenue: 0, expense: 0, net_profit: 0 };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center pb-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">قائمة الدخل</h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          من {dateFrom} إلى {dateTo}
        </p>
      </div>

      {/* Revenues */}
      <div>
        <h4 className="text-sm font-bold text-emerald-800 mb-2">الإيرادات</h4>
        <div className="space-y-1">
          {revenues.map((r: any) => (
            <div key={r.code} className="flex justify-between py-1.5 px-3 text-xs border-b border-slate-100">
              <span className="text-slate-700">
                <span className="font-mono text-slate-400 ml-2">{r.code}</span>
                {r.name}
              </span>
              <span className="font-mono font-semibold text-emerald-700">
                {fmtMoney(r.balance)}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 bg-emerald-50 rounded-lg mt-2 font-bold text-sm text-emerald-900">
            <span>إجمالي الإيرادات</span>
            <span className="font-mono">{fmtMoney(totals.revenue, baseCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h4 className="text-sm font-bold text-rose-800 mb-2">المصروفات</h4>
        <div className="space-y-1">
          {expenses.map((e: any) => (
            <div key={e.code} className="flex justify-between py-1.5 px-3 text-xs border-b border-slate-100">
              <span className="text-slate-700">
                <span className="font-mono text-slate-400 ml-2">{e.code}</span>
                {e.name}
              </span>
              <span className="font-mono font-semibold text-rose-700">
                {fmtMoney(e.balance)}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 bg-rose-50 rounded-lg mt-2 font-bold text-sm text-rose-900">
            <span>إجمالي المصروفات</span>
            <span className="font-mono">{fmtMoney(totals.expense, baseCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Net */}
      <div
        className={`p-5 rounded-2xl shadow-sm text-white ${
          totals.net_profit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      >
        <div className="flex justify-between items-center font-black text-base">
          <span>{totals.net_profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</span>
          <span className="font-mono text-lg">
            {fmtMoney(Math.abs(totals.net_profit), baseCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
};