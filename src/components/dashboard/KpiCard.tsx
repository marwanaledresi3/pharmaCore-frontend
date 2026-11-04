interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'gray';
  loading?: boolean;
}

const tones: Record<NonNullable<KpiCardProps['tone']>, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  green:   'bg-green-50 text-green-700 border-green-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  red:     'bg-red-50 text-red-700 border-red-100',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-100',
  gray:    'bg-gray-50 text-gray-700 border-gray-100',
};

export function KpiCard({ label, value, hint, icon, tone = 'blue', loading }: KpiCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80">{label}</p>
          {loading ? (
            <div className="h-7 w-24 bg-white/60 animate-pulse rounded mt-2" />
          ) : (
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          )}
          {hint && <p className="text-xs opacity-70 mt-1">{hint}</p>}
        </div>
        {icon && <div className="text-2xl opacity-70">{icon}</div>}
      </div>
    </div>
  );
}