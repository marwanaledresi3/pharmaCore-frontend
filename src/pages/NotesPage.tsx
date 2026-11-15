import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, RefreshCw, Eye, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, ArrowRightLeft,
} from 'lucide-react';
import { notesApi, Note, NoteType } from '../api/notesApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { CreateNoteModal } from './notes/CreateNoteModal';
import { NoteDetailPage } from './notes/NoteDetailPage';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'مسودة',   color: 'bg-slate-100 text-slate-700',   icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: 'مؤكد',    color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'ملغي',    color: 'bg-rose-50 text-rose-700',       icon: <XCircle className="w-3 h-3" /> },
};

const REASON_LABEL: Record<string, string> = {
  return: 'مرتجع',
  discount: 'خصم',
  correction: 'تصحيح',
  price_diff: 'فرق سعر',
  shipping: 'شحن',
  other: 'أخرى',
};

export const NotesPage: React.FC = () => {
  const [items, setItems] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<NoteType | ''>('');
  const [filterStatus, setFilterStatus] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notesApi.list({
        note_type: (filterType || undefined) as any,
        status: filterStatus || undefined,
        search: search.trim() || undefined,
        page,
        limit: 20,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterStatus]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (selectedId) {
    return (
      <NoteDetailPage
        noteId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadData();
        }}
      />
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n || 0);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ArrowRightLeft className="w-7 h-7 text-emerald-600" />
            إشعارات المدين والدائن
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            تسويات مالية بدون حركة مخزون ({total} إشعار)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            إشعار جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الإشعار..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
        >
          <option value="">كل الأنواع</option>
          <option value="credit">إشعار دائن</option>
          <option value="debit">إشعار مدين</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
        >
          <option value="">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="confirmed">مؤكد</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12"><LoadingSpinner message="جاري التحميل..." /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">لا توجد إشعارات</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الرقم</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">النوع</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">التاريخ</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الطرف</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">السبب</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">المبلغ</th>
                <th className="text-center px-4 py-3 font-bold text-slate-700">الحالة</th>
                <th className="text-center px-4 py-3 font-bold text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const s = STATUS_MAP[n.status];
                const isCredit = n.note_type === 'credit';
                return (
                  <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {n.note_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isCredit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <TrendingDown className="w-3 h-3" />
                          دائن
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          <TrendingUp className="w-3 h-3" />
                          مدين
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(n.note_date)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {n.party_type === 'customer' ? n.customer_name : n.supplier_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {REASON_LABEL[n.reason] || n.reason}
                    </td>
                    <td className="px-4 py-3 text-left font-mono font-bold text-slate-800">
                      {formatMoney(Number(n.total))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${s.color}`}>
                        {s.icon}
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedId(n.id)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        title="عرض"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            صفحة {page} من {pages} ({total})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              السابق
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || loading}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      <CreateNoteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newId?: string) => {
          setIsCreateOpen(false);
          if (newId) setSelectedId(newId);
          else loadData();
        }}
      />
    </div>
  );
};