import { useEffect, useState } from 'react';
import { dashboardApi, type RecentDocument } from '../api/dashboardApi';
import { pdfApi } from '../api/pdfApi1';

const TYPE_META: Record<
  RecentDocument['type'],
  { label: string; icon: string; tone: string }
> = {
  invoice: { label: 'فاتورة', icon: '🧾', tone: 'bg-blue-50 text-blue-700' },
  payment: { label: 'سند', icon: '💵', tone: 'bg-green-50 text-green-700' },
  expense: { label: 'مصروف', icon: '📤', tone: 'bg-amber-50 text-amber-700' },
};

export function RecentDocumentsCard() {
  const [items, setItems] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .recentDocuments(4)
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'فشل تحميل المستندات'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openPdf = async (doc: RecentDocument) => {
    setBusyId(doc.id);
    try {
      if (doc.type === 'invoice') await pdfApi.downloadInvoicePdf(doc.id);
      else if (doc.type === 'payment') await pdfApi.downloadPaymentPdf(doc.id);
      else if (doc.type === 'expense') await pdfApi.downloadExpensePdf(doc.id);
    } catch (e: any) {
      alert(e?.message ?? 'فشل فتح PDF');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">📥 آخر المستندات</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            اطبع أو نزّل آخر 4 مستندات
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-500 py-8 text-sm">
          لا توجد مستندات بعد
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((d) => {
            const meta = TYPE_META[d.type];
            return (
              <div
                key={d.id}
                className="rounded-xl border bg-white p-3 hover:shadow-sm transition flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${meta.tone}`}
                  >
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(d.date).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <p className="font-semibold text-sm mt-2 truncate" title={d.number || ''}>
                  {d.number || '—'}
                </p>
                {d.party_name && (
                  <p className="text-xs text-gray-500 truncate">{d.party_name}</p>
                )}
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {new Intl.NumberFormat('ar-SA', {
                    maximumFractionDigits: 2,
                  }).format(d.amount)}{' '}
                  <span className="text-xs font-normal text-gray-500">YER</span>
                </p>

                <button
                  onClick={() => openPdf(d)}
                  disabled={busyId === d.id}
                  className="mt-3 w-full py-1.5 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busyId === d.id ? 'جارٍ...' : '📄 فتح PDF'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}