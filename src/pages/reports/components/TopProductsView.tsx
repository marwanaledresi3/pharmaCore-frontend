import React from 'react';
import { TopProduct } from '../types';
import { fmtMoney, toNum } from '../utils';

interface Props {
  data: TopProduct[];
  baseCurrency: string;
}

export const TopProductsView: React.FC<Props> = ({ data, baseCurrency }) => {
  const products = Array.isArray(data) ? data : [];

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-slate-400">
        لا توجد بيانات مبيعات للفترة المحددة
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map((p) => toNum(p.revenue)), 1);


  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800">المنتجات الأكثر مبيعاً</h3>
      <div className="space-y-2">
        {data.map((p, idx) => {
          const revenue = toNum(p.revenue);
          const pct = (revenue / maxRevenue) * 100;
          return (
            <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.sku}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono font-black text-emerald-700">
                    {fmtMoney(p.revenue, baseCurrency)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {toNum(p.quantity_sold)} وحدة × {fmtMoney(p.avg_price)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};