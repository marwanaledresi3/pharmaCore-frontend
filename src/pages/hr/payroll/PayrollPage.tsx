// pages/hr/payroll/PayrollPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Wallet, Plus, RefreshCw, Eye, CheckCircle2, Trash2, Calendar, TrendingUp, Users,
} from 'lucide-react';
import { payrollApi } from '../../../api/hr/payrollApi';
import { PayrollRun, Pagination as PaginationType, PayrollRunStatus } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS } from '../constants';
import { formatMoney, formatDate, monthName } from '../utils';
import { pdfApi } from '../../../api/pdfApi1';
import { FileText,Download } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { company, hasPermission } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const load = async (page = 1) => {
    setIsLoading(true); setError(null);
    try {
      const res = await payrollApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page, limit: 15,
      });
      setRuns(res.items);
      setPagination({ page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total, pages: res.pagination.pages });
    } catch (err: any) {
      setError(err.message || 'فشل تحميل المسيرات');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { load(1); }, [statusFilter]);

  const handlePost = async (run: PayrollRun) => {
    if (!window.confirm(`ترحيل مسير ${run.run_number}؟ سيتم إنشاء قيد محاسبي ولا يمكن التراجع بسهولة.`)) return;
    try {
      await payrollApi.post(run.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الترحيل');
    }
  };

  const handleDelete = async (run: PayrollRun) => {
    if (!window.confirm(`حذف مسير ${run.run_number}؟`)) return;
    try {
      await payrollApi.delete(run.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  const stats = {
    totalPaid: runs.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.total_net), 0),
    totalDraft: runs.filter((r) => r.status === 'draft').reduce((s, r) => s + Number(r.total_net), 0),
    count: runs.length,
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">مسيرات الرواتب</h1>
          <p className="text-xs text-slate-500 mt-1">
            {pagination.total} مسير
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(pagination.page)} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('payroll.create') && (
            <button type="button" onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
              <Plus className="w-4 h-4" />
              حساب مسير جديد
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="مسودات" value={formatMoney(stats.totalDraft, currency)} icon={<Calendar className="w-5 h-5" />} color="amber" />
        <StatCard label="مدفوع" value={formatMoney(stats.totalPaid, currency)} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
        <StatCard label="عدد المسيرات" value={String(stats.count)} icon={<Users className="w-5 h-5" />} color="blue" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
          <option value="all">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="approved">معتمد</option>
          <option value="paid">مدفوع</option>
          <option value="cancelled">ملغى</option>
        </select>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => load(pagination.page)} />}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل المسيرات..." fullHeight />
        ) : runs.length === 0 ? (
          <EmptyState
            title="لا توجد مسيرات رواتب"
            description="لم يتم إنشاء أي مسير بعد."
            actionLabel={hasPermission('payroll.create') ? 'حساب أول مسير' : undefined}
            onAction={hasPermission('payroll.create') ? () => setIsAddOpen(true) : undefined}
            icon={<Wallet className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم المسير</th>
                    <th className="py-3 px-4">الفترة</th>
                    <th className="py-3 px-4">تاريخ الدفع</th>
                    <th className="py-3 px-4">إجمالي</th>
                    <th className="py-3 px-4">خصومات</th>
                    <th className="py-3 px-4">صافي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">#{run.run_number}</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-semibold text-slate-800">
                        {monthName(run.period_year, run.period_month)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatDate(run.payment_date)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatMoney(run.total_gross, currency)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-rose-700">{formatMoney(run.total_deductions, currency)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] font-black text-emerald-700">{formatMoney(run.total_net, currency)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${PAYROLL_STATUS_COLORS[run.status]}`}>
                          {PAYROLL_STATUS_LABELS[run.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => { setSelectedRun(run); setIsViewOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="عرض التفاصيل">
                            <Eye className="w-4 h-4" />
                          </button>
                          {run.status === 'draft' && hasPermission('payroll.post') && (
                            <button type="button" onClick={() => handlePost(run)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="ترحيل">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {run.status === 'draft' && hasPermission('payroll.delete') && (
                            <button type="button" onClick={() => handleDelete(run)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              try {
                                pdfApi.previewPayrollReport(run.id, false);
                              } catch (err: any) {
                                alert(err.message || 'فشل المعاينة');
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="معاينة تقرير PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              try {
                                pdfApi.downloadPayrollReportPdf(run.id, run.run_number, true);
                              } catch (err: any) {
                                alert(err.message || 'فشل التحميل');
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="تحميل تقرير مفصّل PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={load} />
          </>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <CalculatePayrollModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => { setIsAddOpen(false); load(1); }}
        />
      )}

      {/* View Modal */}
      {isViewOpen && selectedRun && (
        <PayrollDetailModal
          run={selectedRun}
          currency={currency}
          onClose={() => { setIsViewOpen(false); setSelectedRun(null); }}
          onRefresh={() => { setIsViewOpen(false); setSelectedRun(null); load(pagination.page); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// StatCard
// ═══════════════════════════════════════════════════════════════════════════
const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: 'emerald' | 'amber' | 'blue' }> = ({ label, value, icon, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold opacity-75">{label}</p>
          <p className="text-lg font-black mt-1 font-mono">{value}</p>
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Calculate Modal
// ═══════════════════════════════════════════════════════════════════════════
const CalculatePayrollModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [paymentDate, setPaymentDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 25).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await payrollApi.calculate({ year, month, payment_date: paymentDate });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل حساب المسير');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="حساب مسير رواتب جديد">
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <p className="font-bold mb-1">📋 ماذا يفعل؟</p>
          <p className="text-[11px] leading-relaxed">
            يحسب رواتب جميع الموظفين النشطين للشهر المحدد، بما في ذلك:
            البدلات، خصم الغياب، التأمينات، ضريبة الدخل.
            يُنشأ المسير كـ <strong>مسودة</strong> — يمكنك مراجعته وتعديله قبل الترحيل.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">السنة *</label>
            <input type="number" min="2000" max="2100" value={year}
              onChange={(e) => setYear(Number(e.target.value))} required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الشهر *</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{monthName(year, i + 1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الدفع *</label>
          <input type="date" required value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">إلغاء</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحساب...' : 'حساب المسير'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Detail Modal (مع إدارة البنود)
// ═══════════════════════════════════════════════════════════════════════════
const PayrollDetailModal: React.FC<{
  run: PayrollRun;
  currency: string;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ run, currency, onClose, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>(run.items || []);
  const [loading, setLoading] = useState(!run.items);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [bonusItem, setBonusItem] = useState<any | null>(null);

  const isDraft = run.status === 'draft';

  const loadItems = async () => {
    setLoading(true); setError(null);
    try {
      const data = await payrollApi.listItems(run.id);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل البنود');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!run.items) loadItems();
  }, []);

  const totals = items.reduce(
    (acc, it) => ({
      gross: acc.gross + Number(it.gross_salary || 0),
      deductions: acc.deductions + Number(it.total_deductions || 0),
      net: acc.net + Number(it.net_salary || 0),
    }),
    { gross: 0, deductions: 0, net: 0 }
  );

  return (
    <Modal isOpen onClose={onClose} title={`مسير ${run.run_number}`}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {/* Header */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoRow label="الفترة" value={monthName(run.period_year, run.period_month)} />
            <InfoRow label="تاريخ الدفع" value={formatDate(run.payment_date)} />
            <InfoRow label="إجمالي" value={formatMoney(totals.gross || run.total_gross, currency)} mono />
            <InfoRow label="خصومات" value={formatMoney(totals.deductions || run.total_deductions, currency)} mono />
            <div className="col-span-2 pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-0.5 text-[10px]">صافي الرواتب</span>
              <span className="font-black text-lg text-emerald-700 font-mono">
                {formatMoney(totals.net || run.total_net, currency)}
              </span>
            </div>
          </div>
          {run.status === 'paid' && (
            <p className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              ✅ هذا المسير مُرحّل محاسبياً (قيد #{run.journal_entry_id?.slice(0, 8)})
            </p>
          )}
        </div>

        {/* Items */}
        {loading ? (
          <LoadingSpinner message="جاري تحميل البنود..." />
        ) : error ? (
          <ErrorAlert error={error} onRetry={loadItems} />
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">لا توجد بنود</div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-right text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">الموظف</th>
                  <th className="py-2 px-3 text-center">أساسي</th>
                  <th className="py-2 px-3 text-center">بدلات</th>
                  <th className="py-2 px-3 text-center">إضافي</th>
                  <th className="py-2 px-3 text-center">إجمالي</th>
                  <th className="py-2 px-3 text-center">خصومات</th>
                  <th className="py-2 px-3 text-center">صافي</th>
                  {isDraft && <th className="py-2 px-3 text-left">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it: any) => (
                  <tr key={it.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3">
                      <span className="block font-bold text-slate-900">{it.full_name || '-'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{it.employee_number}</span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono">{formatMoney(it.basic_salary, currency)}</td>
                    <td className="py-2 px-3 text-center font-mono text-blue-700">
                      {formatMoney(
                        Number(it.housing_allowance) + Number(it.transport_allowance) + Number(it.other_allowances),
                        currency
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-purple-700">
                      {formatMoney(Number(it.overtime_amount) + Number(it.bonus_amount), currency)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold">{formatMoney(it.gross_salary, currency)}</td>
                    <td className="py-2 px-3 text-center font-mono text-rose-700">{formatMoney(it.total_deductions, currency)}</td>
                    <td className="py-2 px-3 text-center font-mono font-black text-emerald-700">{formatMoney(it.net_salary, currency)}</td>
                    {isDraft && hasPermission('payroll_items.update') && (
                      <td className="py-2 px-3 text-left">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setEditItem(it)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="تعديل">
                            ✏️
                          </button>
                          {hasPermission('payroll_items.bonus') && (
                            <button type="button" onClick={() => setBonusItem(it)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition" title="مكافأة">
                              🎁
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إغلاق
          </button>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editItem && (
        <EditPayrollItemModal
          runId={run.id}
          item={editItem}
          currency={currency}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setEditItem(null); loadItems(); onRefresh(); }}
        />
      )}

      {/* Bonus Modal */}
      {bonusItem && (
        <AddBonusModal
          runId={run.id}
          item={bonusItem}
          currency={currency}
          onClose={() => setBonusItem(null)}
          onSuccess={() => { setBonusItem(null); loadItems(); onRefresh(); }}
        />
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Edit Item Modal
// ═══════════════════════════════════════════════════════════════════════════
const EditPayrollItemModal: React.FC<{
  runId: string;
  item: any;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ runId, item, currency, onClose, onSuccess }) => {
  const [values, setValues] = useState({
    basic_salary: Number(item.basic_salary || 0),
    housing_allowance: Number(item.housing_allowance || 0),
    transport_allowance: Number(item.transport_allowance || 0),
    other_allowances: Number(item.other_allowances || 0),
    overtime_amount: Number(item.overtime_amount || 0),
    bonus_amount: Number(item.bonus_amount || 0),
    absence_deduction: Number(item.absence_deduction || 0),
    tax_deduction: Number(item.tax_deduction || 0),
    social_insurance: Number(item.social_insurance || 0),
    loan_deduction: Number(item.loan_deduction || 0),
    other_deductions: Number(item.other_deductions || 0),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ ...values, [k]: Number(e.target.value) || 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await payrollApi.updateItem(runId, item.id, values);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل التعديل');
    } finally { setLoading(false); }
  };

  const gross = values.basic_salary + values.housing_allowance + values.transport_allowance + values.other_allowances + values.overtime_amount + values.bonus_amount;
  const deductions = values.absence_deduction + values.tax_deduction + values.social_insurance + values.loan_deduction + values.other_deductions;
  const net = gross - deductions;

  return (
    <Modal isOpen onClose={onClose} title={`تعديل بند — ${item.full_name}`}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <section>
          <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">الإيرادات ({currency})</h4>
          <div className="grid grid-cols-2 gap-3">
            {(['basic_salary', 'housing_allowance', 'transport_allowance', 'other_allowances', 'overtime_amount', 'bonus_amount'] as const).map((k) => (
              <div key={k}>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{labels[k]}</label>
                <input type="number" min="0" step="0.01" value={(values as any)[k]} onChange={set(k)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider mb-2">الخصومات ({currency})</h4>
          <div className="grid grid-cols-2 gap-3">
            {(['absence_deduction', 'tax_deduction', 'social_insurance', 'loan_deduction', 'other_deductions'] as const).map((k) => (
              <div key={k}>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{labels[k]}</label>
                <input type="number" min="0" step="0.01" value={(values as any)[k]} onChange={set(k)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
            ))}
          </div>
        </section>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <Row label="الإجمالي" value={formatMoney(gross, currency)} />
          <Row label="إجمالي الخصومات" value={formatMoney(deductions, currency)} />
          <div className="border-t border-slate-200 pt-1.5">
            <Row label="الصافي" value={formatMoney(net, currency)} bold />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">إلغاء</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'تحديث'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const labels: Record<string, string> = {
  basic_salary: 'الراتب الأساسي',
  housing_allowance: 'بدل السكن',
  transport_allowance: 'بدل النقل',
  other_allowances: 'بدلات أخرى',
  overtime_amount: 'العمل الإضافي',
  bonus_amount: 'المكافآت',
  absence_deduction: 'خصم الغياب',
  tax_deduction: 'ضريبة الدخل',
  social_insurance: 'التأمينات',
  loan_deduction: 'خصم السلف',
  other_deductions: 'خصومات أخرى',
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div className="flex justify-between">
    <span className={bold ? 'font-black text-slate-900' : 'text-slate-600'}>{label}</span>
    <span className={`font-mono ${bold ? 'font-black text-emerald-700 text-sm' : 'text-slate-800'}`}>{value}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Add Bonus Modal
// ═══════════════════════════════════════════════════════════════════════════
const AddBonusModal: React.FC<{
  runId: string;
  item: any;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ runId, item, currency, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { setError('المبلغ يجب أن يكون > 0'); return; }
    setLoading(true); setError(null);
    try {
      await payrollApi.addBonus(runId, item.id, amount);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الإضافة');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={`إضافة مكافأة — ${item.full_name}`}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-xl">
          المكافأة الحالية: <strong className="font-mono">{formatMoney(item.bonus_amount, currency)}</strong>
        </p>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإضافي ({currency})</label>
          <input type="number" min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(Number(e.target.value))} required autoFocus
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">إلغاء</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <span className="text-slate-500 block mb-0.5 text-[10px]">{label}</span>
    <span className={`font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);