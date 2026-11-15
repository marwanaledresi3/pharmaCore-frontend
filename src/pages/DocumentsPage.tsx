import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Search, RefreshCw, X, ExternalLink,
  TrendingUp, TrendingDown, CreditCard, Receipt, Undo2, BookOpen,
  Truck, ArrowLeftRight, ClipboardCheck, FileSignature,
} from 'lucide-react';
import {
  documentsApi,
  DocumentItem,
  DocumentType,
  DocumentCategory,
} from '../api/documentsApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

// ═══════════════════════════════════════════════════════════════════════════
// Icon Map
// ═══════════════════════════════════════════════════════════════════════════

const ICON_MAP: Record<string, React.ReactNode> = {
  invoice_sales:        <FileText className="w-4 h-4 text-blue-600" />,
  invoice_purchase:     <FileText className="w-4 h-4 text-purple-600" />,
  payment_receive:      <TrendingUp className="w-4 h-4 text-emerald-600" />,
  payment_pay:          <TrendingDown className="w-4 h-4 text-rose-600" />,
  payment_refund:       <Undo2 className="w-4 h-4 text-amber-600" />,
  payment_credit_apply: <CreditCard className="w-4 h-4 text-sky-600" />,
  expense:              <Receipt className="w-4 h-4 text-orange-600" />,
  return_sale:          <Undo2 className="w-4 h-4 text-rose-500" />,
  return_purchase:      <Undo2 className="w-4 h-4 text-purple-500" />,
  journal_entry:        <BookOpen className="w-4 h-4 text-slate-600" />,
  note_credit:          <TrendingDown className="w-4 h-4 text-emerald-600" />,
  note_debit:           <TrendingUp className="w-4 h-4 text-rose-600" />,
  delivery_note:        <Truck className="w-4 h-4 text-sky-600" />,
  stock_transfer:       <ArrowLeftRight className="w-4 h-4 text-cyan-600" />,
  stock_adjustment:     <ClipboardCheck className="w-4 h-4 text-indigo-600" />,
};

// ═══════════════════════════════════════════════════════════════════════════
// Label Map
// ═══════════════════════════════════════════════════════════════════════════

const LABEL_MAP: Record<string, string> = {
  invoice_sales:        'فاتورة بيع',
  invoice_purchase:     'فاتورة شراء',
  payment_receive:      'سند قبض',
  payment_pay:          'سند صرف',
  payment_refund:       'سند استرداد',
  payment_credit_apply: 'تخصيص رصيد',
  expense:              'مصروف',
  return_sale:          'مرتجع بيع',
  return_purchase:      'مرتجع شراء',
  journal_entry:        'قيد يومية',
  note_credit:          'إشعار دائن',
  note_debit:           'إشعار مدين',
  delivery_note:        'مذكرة تسليم',
  stock_transfer:       'إذن تحويل',
  stock_adjustment:     'تسوية جرد',
};

// ═══════════════════════════════════════════════════════════════════════════
// Status Map
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:      { label: 'مسودة',     color: 'bg-slate-100 text-slate-700' },
  posted:     { label: 'مرحّل',     color: 'bg-emerald-50 text-emerald-700' },
  confirmed:  { label: 'مؤكد',      color: 'bg-emerald-50 text-emerald-700' },
  dispatched: { label: 'مُرسل',     color: 'bg-sky-50 text-sky-700' },
  delivered:  { label: 'تم التسليم', color: 'bg-emerald-50 text-emerald-700' },
  invoiced:   { label: 'مفوتر',     color: 'bg-purple-50 text-purple-700' },
  unpaid:     { label: 'غير مدفوع', color: 'bg-amber-50 text-amber-700' },
  partial:    { label: 'جزئي',      color: 'bg-sky-50 text-sky-700' },
  paid:       { label: 'مدفوع',     color: 'bg-emerald-50 text-emerald-700' },
  cancelled:  { label: 'ملغي',      color: 'bg-rose-50 text-rose-700' },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const DocumentsPage: React.FC = () => {
  // ─── Data ───
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);

  // ─── UI ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Types ───
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // ─── Filters ───
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ─── Load types once ───
  useEffect(() => {
    (async () => {
      try {
        const res = await documentsApi.types();
        setTypes(res.types);
        setCategories(res.categories);
        setStatuses(res.statuses);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // ─── Load data ───
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.list({
        document_type: filterType || undefined,
        status: filterStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search.trim() || undefined,
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  // ─── Debounce load ───
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ─── Derived ───
  const filteredTypes = useMemo(() => {
    if (!filterCategory) return types;
    return types.filter((t) => t.category === filterCategory);
  }, [types, filterCategory]);

  const hasFilters = !!(
    search ||
    filterType ||
    filterCategory ||
    filterStatus ||
    dateFrom ||
    dateTo
  );

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterCategory('');
    setFilterStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // ─── Helpers ───
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return d;
    }
  };

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n || 0);

  // ─── Detail link ───
  const getDetailLink = (doc: DocumentItem): string | null => {
    const t = doc.document_type;
    const id = doc.document_id;

    if (t.startsWith('invoice_')) return `/invoices/${id}`;
    if (t.startsWith('payment_')) return `/payments/${id}`;
    if (t === 'expense') return `/expenses/${id}`;
    if (t.startsWith('return_')) return `/returns/${id}`;
    if (t === 'journal_entry') return `/journal-entries/${id}`;
    if (t.startsWith('note_')) return `/notes/${id}`;
    if (t === 'delivery_note') return `/delivery-notes/${id}`;
    if (t === 'stock_transfer') return `/stock-transfers/${id}`;
    if (t === 'stock_adjustment') return `/stock-adjustments/${id}`;
    return null;
  };

  // ─── Render ───
  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600" />
            المستندات
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            كل المستندات المالية والمخزنية في مكان واحد ({total} مستند)
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالرقم أو الطرف..."
              className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterType('');
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="">كل الأنواع</option>
            {filteredTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="">كل الحالات</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_MAP[s]?.label || s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">من</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <label className="text-xs font-bold text-slate-600">إلى</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="جاري تحميل المستندات..." />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">لا توجد مستندات</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasFilters ? 'جرّب تغيير الفلاتر' : 'لم تُنشئ أي مستندات بعد'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-bold text-slate-700">النوع</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الرقم</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">التاريخ</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الطرف / الجهة</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">المبلغ</th>
                <th className="text-center px-4 py-3 font-bold text-slate-700">الحالة</th>
                <th className="text-center px-4 py-3 font-bold text-slate-700">روابط</th>
              </tr>
            </thead>
            <tbody>
              {items.map((doc) => {
                const s = STATUS_MAP[doc.status] || {
                  label: doc.status,
                  color: 'bg-slate-100 text-slate-700',
                };
                const detailLink = getDetailLink(doc);
                return (
                  <tr
                    key={`${doc.document_type}-${doc.document_id}`}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ICON_MAP[doc.document_type] || <FileText className="w-4 h-4" />}
                        <span className="font-bold text-slate-800">
                          {LABEL_MAP[doc.document_type] || doc.document_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.document_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(doc.document_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {doc.party_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-left font-bold text-slate-800 font-mono">
                      {doc.amount > 0 ? formatAmount(doc.amount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {doc.journal_entry_id && (
                          <a
                            href={`/journal-entries/${doc.journal_entry_id}`}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="عرض القيد"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {detailLink && (
                          <a
                            href={detailLink}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                            title="عرض المستند"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
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
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-slate-600">
            صفحة {page} من {pages} ({total} مستند)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              السابق
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || loading}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};