import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'slate';
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-500 text-white',
    text: 'text-emerald-700',
  },
  blue: {
    bg: 'bg-sky-50/70',
    border: 'border-sky-100',
    iconBg: 'bg-sky-500 text-white',
    text: 'text-sky-700',
  },
  amber: {
    bg: 'bg-amber-50/70',
    border: 'border-amber-100',
    iconBg: 'bg-amber-500 text-white',
    text: 'text-amber-700',
  },
  rose: {
    bg: 'bg-rose-50/70',
    border: 'border-rose-100',
    iconBg: 'bg-rose-500 text-white',
    text: 'text-rose-700',
  },
  indigo: {
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-100',
    iconBg: 'bg-indigo-500 text-white',
    text: 'text-indigo-700',
  },
  slate: {
    bg: 'bg-slate-50/70',
    border: 'border-slate-100',
    iconBg: 'bg-slate-700 text-white',
    text: 'text-slate-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'emerald',
}) => {
  const c = colorMap[color];

  return (
    <div
      dir="rtl"
      className={`rounded-2xl border ${c.border} ${c.bg} p-5 shadow-xs transition hover:shadow-md hover:border-slate-300`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${c.iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            {subtitle && <span>{subtitle}</span>}
            {trend && <span className={`font-medium ${c.text}`}>{trend}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
