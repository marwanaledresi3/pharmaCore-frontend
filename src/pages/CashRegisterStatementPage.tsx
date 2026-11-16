import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  RefreshCw,
  Printer,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Search,
  Landmark,
} from 'lucide-react';
import {
  cashRegistersApi,
  CashStatementResponse,
  CashMovementItem,
} from '../api/cashRegistersApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

const REFERENCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  payment: { label: 'سند قبض / صرف', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  sales_order: { label: 'مبيعات نقدية', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  invoice: { label: 'فاتورة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  purchase_order: { label: 'مشتريات نقدية', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  expense: { label: 'مصروف تشغيلي', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  transfer: { label: 'تحويل بين الصناديق', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  manual: { label: 'قيد يدوي', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CashRegisterStatementPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  /* ---------- Registers List ---------- */
  const [registers, setRegisters] = useState<any[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('');

  /* ---------- Filters ---------- */
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toLocaleDateString('en-CA');
  const today = new Date().toLocaleDateString('en-CA');

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out'>('all');

  /* ---------- Statement Data ---------- */
  const [statement, setStatement] = useState<CashStatementResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);

  /* ============================================================
   * Load Available Cash Registers
   * ============================================================ */
  useEffect(() => {
    (async () => {
      try {
        const res = await cashRegistersApi.list({ is_active: true });
        const items = Array.isArray(res) ? res : (res as any)?.items || [];
        setRegisters(items);
        if (items.length > 0) {
          setSelectedRegisterId(items[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || 'فشل تحميل قائمة الصناديق النقدية');
        setIsLoading(false);
      }
    })();
  }, []);

  /* ============================================================
   * Load Statement for Selected Register
   * ============================================================ */
  const loadStatement = useCallback(async () => {
    if (!selectedRegisterId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await cashRegistersApi.getStatement(selectedRegisterId, {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setStatement(data);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل كشف حساب الصندوق');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegisterId, dateFrom, dateTo]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  /* ============================================================
   * Compute Running Balance & Apply Local Filters
   * ============================================================ */
  const movementsWithRunningBalance = useMemo(() => {
    if (!statement) return [];
    let running = Number(statement.opening_balance || 0);

    return (statement.movements || []).map((m) => {
      const debit = Number(m.debit || 0);
      const credit = Number(m.credit || 0);
      running = running + debit - credit;
      return {
        ...m,
        debit,
        credit,
        running_balance: m.balance !== undefined ? Number(m.balance) : running,
      };
    });
  }, [statement]);

  const filteredMovements = useMemo(() => {
    return movementsWithRunningBalance.filter((m) => {
      if (directionFilter === 'in' && m.debit <= 0) return false;
      if (directionFilter === 'out' && m.credit <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = m.description?.toLowerCase().includes(q);
        const matchRef = m.reference_number?.toLowerCase().includes(q);
        const matchEntry = m.entry_number?.toLowerCase().includes(q);
        return matchDesc || matchRef || matchEntry;
      }
      return true;
    });
  }, [movementsWithRunningBalance, directionFilter, searchQuery]);

  const currency = statement?.register?.currency_code || baseCurrency;

  /* ============================================================
   * CSV Export
   * ============================================================ */
  const handleExportCsv = () => {
    if (!statement) return;
    const rows = filteredMovements.map((m) => ({
      التاريخ: m.entry_date ? String(m.entry_date).slice(0, 10) : '',
      'رقم القيد / المرجع': m.reference_number || m.entry_number || '',
      'نوع الحركة': REFERENCE_TYPE_LABELS[m.reference_type || '']?.label || 'حركة مالية',
      البيان: m.description || '',
      'وارد (مدين)': m.debit,
      'منصرف (دائن)': m.credit,
      'الرصيد التراكمي': m.running_balance,
    }));
    exportToCsv(rows, `cash_statement_${statement.register.name}_${dateFrom}_${dateTo}`);
  };

  /* ============================================================
   * Render
   * ============================================================ */
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            كشف حساب الصندوق النقدي
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة المقبوضات والمدفوعات النقدية والرصيد التراكمي التفصيلي لكل خزينة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!statement || filteredMovements.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> تصدير CSV
          </button>
          <button
            type="button"
            onClick={() => setIsPrintOpen(true)}
            disabled={!statement}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> طباعة الكشف
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* اختيار الصندوق */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الصندوق النقدي *</label>
            <select
              value={selectedRegisterId}
              onChange={(e) => setSelectedRegisterId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
            >
              {registers.length === 0 && <option value="">لا توجد صناديق نشطة</option>}
              {registers.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} {reg.code ? `(${reg.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* من تاريخ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">من تاريخ</label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* إلى تاريخ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>

          {/* بحث سريع */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">بحث في البيان أو المرجع</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="رقم سند، فاتورة، بيان..."
                  className="w-full rounded-xl border border-slate-300 pr-9 pl-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={loadStatement}
                disabled={isLoading}
                className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Direction Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 ml-1">تصفية الحركة:</span>
          <button
            type="button"
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              directionFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الحركات
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('in')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              directionFilter === 'in'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الوارد فقط (مقبوضات)
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('out')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              directionFilter === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المنصرف فقط (مدفوعات)
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadStatement} />}

      {/* Summary KPI Cards */}
      {statement && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 block mb-1">الرصيد الافتتاحي للفترة</span>
            <span className="text-lg font-black font-mono text-slate-800">
              {Number(statement.opening_balance || 0).toLocaleString()} {currency}
            </span>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-800">إجمالي الوارد (مقبوضات)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-lg font-black font-mono text-emerald-700">
              +{Number(statement.total_debit || 0).toLocaleString()} {currency}
            </span>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-800">إجمالي المنصرف (مدفوعات)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-lg font-black font-mono text-rose-700">
              -{Number(statement.total_credit || 0).toLocaleString()} {currency}
            </span>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-300">الرصيد الختامي الحالي</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-black font-mono text-emerald-400">
              {Number(statement.closing_balance || 0).toLocaleString()} {currency}
            </span>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل كشف حساب الصندوق..." fullHeight />
        ) : !statement || filteredMovements.length === 0 ? (
          <EmptyState
            title="لا توجد حركات مالية"
            description="لم يتم تسجيل أي حركات نقدية على هذا الصندوق خلال الفترة المحددة."
            icon={<Calendar className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">المرجع / القيد</th>
                  <th className="py-3 px-4">نوع الحركة</th>
                  <th className="py-3 px-4">البيان</th>
                  <th className="py-3 px-4 text-center text-emerald-700">وارد (+)</th>
                  <th className="py-3 px-4 text-center text-rose-700">منصرف (-)</th>
                  <th className="py-3 px-4 text-left">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* صف الرصيد الافتتاحي */}
                <tr className="bg-slate-50/60 font-semibold text-slate-600">
                  <td className="py-2.5 px-4 font-mono">{dateFrom || '—'}</td>
                  <td className="py-2.5 px-4">—</td>
                  <td className="py-2.5 px-4">رصيد افتتاحي</td>
                  <td className="py-2.5 px-4">رصيد ما قبل الفترة المحددة</td>
                  <td className="py-2.5 px-4 text-center font-mono">—</td>
                  <td className="py-2.5 px-4 text-center font-mono">—</td>
                  <td className="py-2.5 px-4 text-left font-mono font-bold text-slate-800">
                    {Number(statement.opening_balance || 0).toLocaleString()} {currency}
                  </td>
                </tr>

                {/* الحركات */}
                {filteredMovements.map((m: CashMovementItem & { running_balance: number }) => {
                  const badge = REFERENCE_TYPE_LABELS[m.reference_type || ''] || {
                    label: 'حركة نقدية',
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {m.entry_date ? String(m.entry_date).slice(0, 10) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {m.reference_number || m.entry_number || `#${m.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={m.description}>
                        {m.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {m.debit > 0 ? `+${m.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                        {m.credit > 0 ? `-${m.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-black text-slate-900 whitespace-nowrap">
                        {m.running_balance.toLocaleString()} {currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {statement && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`كشف حساب صندوق: ${statement.register.name}`}
          documentType="CASH STATEMENT"
          documentNumber={statement.register.code || statement.register.id.slice(0, 8)}
          documentDate={`${dateFrom} إلى ${dateTo}`}
          partyTitle="اسم الخزينة"
          partyName={statement.register.name}
          currencyCode={currency}
          company={company}
          items={filteredMovements.map((m) => ({
            name: `${String(m.entry_date).slice(0, 10)} | ${m.description}`,
            sku: m.reference_number || m.entry_number,
            quantity: 1,
            unit_price: m.debit > 0 ? m.debit : -m.credit,
            total: m.running_balance,
          }))}
          summary={[
            { label: 'الرصيد الافتتاحي', value: Number(statement.opening_balance || 0) },
            { label: 'إجمالي الوارد (مدين)', value: Number(statement.total_debit || 0) },
            { label: 'إجمالي المنصرف (دائن)', value: Number(statement.total_credit || 0) },
            {
              label: 'الرصيد الختامي',
              value: Number(statement.closing_balance || 0),
              isTotal: true,
            },
          ]}
          hasBackendPdf={false}
        />
      )}
    </div>
  );
};

export default CashRegisterStatementPage;