import React from 'react';
import { fmtMoney } from '../utils';

interface Props {
  data: any;
  baseCurrency: string;
}

export const BalanceSheetView: React.FC<Props> = ({ data, baseCurrency }) => {
  const assets = data.assets || [];
  const liabilities = data.liabilities || [];
  const equity = data.equity || [];
  const totals = data.totals || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Assets */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
          الأصول
        </h3>
        {assets.map((a: any) => (
          <div key={a.code} className="flex justify-between text-xs py-1">
            <span className="text-slate-700">
              <span className="font-mono text-slate-400 ml-2">{a.code}</span>
              {a.name}
            </span>
            <span className="font-mono font-semibold">{fmtMoney(a.balance)}</span>
          </div>
        ))}
        <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-xs text-emerald-800">
          <span>إجمالي الأصول</span>
          <span className="font-mono text-sm">{fmtMoney(totals.assets, baseCurrency)}</span>
        </div>
      </div>

      {/* Liabilities & Equity */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
          الالتزامات وحقوق الملكية
        </h3>
        {liabilities.map((l: any) => (
          <div key={l.code} className="flex justify-between text-xs py-1">
            <span className="text-slate-700">
              <span className="font-mono text-slate-400 ml-2">{l.code}</span>
              {l.name}
            </span>
            <span className="font-mono font-semibold">{fmtMoney(l.balance)}</span>
          </div>
        ))}
        {equity.map((e: any) => (
          <div key={e.code} className="flex justify-between text-xs py-1">
            <span className="text-slate-700">
              <span className="font-mono text-slate-400 ml-2">{e.code}</span>
              {e.name}
            </span>
            <span className="font-mono font-semibold">{fmtMoney(e.balance)}</span>
          </div>
        ))}
        <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-xs text-slate-900">
          <span>إجمالي الالتزامات + الملكية</span>
          <span className="font-mono text-sm">
            {fmtMoney(totals.liabilities_plus_equity, baseCurrency)}
          </span>
        </div>
        {!totals.balanced && (
          <p className="text-[10px] text-rose-600 mt-2">
            ⚠ الميزانية غير متوازنة — فرق: {fmtMoney(Math.abs(totals.assets - totals.liabilities_plus_equity))}
          </p>
        )}
      </div>
    </div>
  );
};