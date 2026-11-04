import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSubmit: (range: DateRange) => void;
  initialFrom?: string;
  initialTo?: string;
  submitLabel?: string;
  loading?: boolean;
}

/* ─────────────── helpers ─────────────── */
const pad = (n: number) => String(n).padStart(2, '0');

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfYear(d = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1);
}

type Preset = 'this_month' | 'last_month' | 'this_year' | 'last_90' | 'all' | 'custom';

function presetRange(preset: Preset): DateRange {
  const now = new Date();
  switch (preset) {
    case 'this_month':
      return { from: toISO(startOfMonth(now)), to: toISO(endOfMonth(now)) };
    case 'last_month': {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: toISO(startOfMonth(prev)), to: toISO(endOfMonth(prev)) };
    }
    case 'this_year':
      return { from: toISO(startOfYear(now)), to: toISO(now) };
    case 'last_90': {
      const from = new Date(now);
      from.setDate(now.getDate() - 90);
      return { from: toISO(from), to: toISO(now) };
    }
    case 'all':
    default:
      return {};
  }
}

/* ─────────────── Component ─────────────── */
export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  title = 'اختر الفترة الزمنية',
  description = 'حدد من/إلى لتوليد كشف الحساب عن الفترة المطلوبة',
  onSubmit,
  initialFrom,
  initialTo,
  submitLabel = 'توليد PDF',
  loading = false,
}) => {
  const [preset, setPreset] = useState<Preset>('this_month');
  const [from, setFrom] = useState<string>(initialFrom ?? '');
  const [to, setTo] = useState<string>(initialTo ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (initialFrom || initialTo) {
      setFrom(initialFrom ?? '');
      setTo(initialTo ?? '');
      setPreset('custom');
    } else {
      const r = presetRange('this_month');
      setPreset('this_month');
      setFrom(r.from ?? '');
      setTo(r.to ?? '');
    }
  }, [isOpen, initialFrom, initialTo]);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === 'custom') return;
    const r = presetRange(p);
    setFrom(r.from ?? '');
    setTo(r.to ?? '');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (from && to && from > to) {
      setError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }
    if (preset === 'custom' && !from && !to) {
      setError('حدد تاريخ البداية أو النهاية على الأقل، أو اختر "كل الفترات"');
      return;
    }

    onSubmit({
      from: from || undefined,
      to: to || undefined,
    });
  };

  const summary = useMemo(() => {
    if (preset === 'all' || (!from && !to)) return 'كل الفترات';
    if (from && to) return `${from} → ${to}`;
    if (from) return `من ${from}`;
    if (to) return `حتى ${to}`;
    return '—';
  }, [preset, from, to]);

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'this_month', label: 'هذا الشهر' },
    { key: 'last_month', label: 'الشهر الماضي' },
    { key: 'this_year', label: 'هذا العام' },
    { key: 'last_90', label: 'آخر 90 يوماً' },
    { key: 'all', label: 'كل الفترات' },
    { key: 'custom', label: 'مخصص' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {description && (
          <p className="text-xs text-slate-500 -mt-1">{description}</p>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            اختصارات سريعة
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition ${
                  preset === p.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              من تاريخ
            </label>
            <div className="relative">
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset('custom');
                  setError(null);
                }}
                max={to || undefined}
                className="w-full rounded-xl border border-slate-300 p-2.5 pl-9 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              إلى تاريخ
            </label>
            <div className="relative">
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset('custom');
                  setError(null);
                }}
                min={from || undefined}
                className="w-full rounded-xl border border-slate-300 p-2.5 pl-9 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
          <span className="text-slate-500">الفترة المختارة: </span>
          <span className="font-bold text-slate-800">{summary}</span>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'جارٍ التوليد...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};