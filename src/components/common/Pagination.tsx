import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Pagination as PaginationType } from '../../types';

export interface PaginationProps {
  pagination?: PaginationType;
  currentPage?: number;
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  currentPage,
  page: pageProp,
  totalPages: totalPagesProp,
  total: totalProp,
  limit: limitProp,
  onPageChange,
}) => {
  const activePage = pagination?.page ?? currentPage ?? pageProp ?? 1;
  const activeLimit = pagination?.limit ?? limitProp ?? 20;
  const activeTotal = pagination?.total ?? totalProp ?? 0;
  const totalPages =
    totalPagesProp ??
    Math.max(1, Math.ceil(activeTotal / (activeLimit || 20)));

  if (totalPages <= 1) return null;

  return (
    <div
      dir="rtl"
      className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 rounded-b-2xl sm:px-6"
    >
      <div className="flex items-center text-xs text-slate-500">
        {activeTotal > 0 && (
          <span>
            عرض <span className="font-semibold text-slate-800">{(activePage - 1) * activeLimit + 1}</span> إلى{' '}
            <span className="font-semibold text-slate-800">{Math.min(activePage * activeLimit, activeTotal)}</span> من أصل{' '}
            <span className="font-semibold text-slate-800">{activeTotal}</span> سجل
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        <span className="px-3 py-1 text-xs font-bold text-slate-800 bg-slate-100 rounded-lg">
          صفحة {activePage} من {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
