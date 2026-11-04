import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  RefreshCw,
  Printer,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck,
} from 'lucide-react';
import { accountsApi } from '../api/accountsApi';
import { JournalEntry, Account, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

export const JournalEntriesPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Postable accounts list for lines selection
  const [postableAccounts, setPostableAccounts] = useState<Account[]>([]);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('قيد تسوية يدوي');
  const [lines, setLines] = useState<
    Array<{
      account_id: string;
      debit: number;
      credit: number;
      description: string;
    }>
  >([]);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Details Modal
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Trial Balance Modal
  const [isTbOpen, setIsTbOpen] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
  const [tbLoading, setTbLoading] = useState(false);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam =
        statusFilter === 'all' ? undefined : (statusFilter as 'draft' | 'posted');

      const [entriesRes, accountsRes] = await Promise.all([
        accountsApi.listJournalEntries({ status: statusParam, page, limit: 15 }),
        accountsApi.listPostable(),
      ]);

      setEntries(entriesRes.items);
      setPagination(entriesRes.pagination);
      setPostableAccounts(accountsRes);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل القيود اليومية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [statusFilter]);

  const openCreateModal = () => {
    const acc1 = postableAccounts[0]?.id || '';
    const acc2 = postableAccounts[1]?.id || acc1;

    setEntryDate(new Date().toISOString().slice(0, 10));
    setDescription('قيد تسوية يدوي');
    setLines([
      { account_id: acc1, debit: 1000, credit: 0, description: 'طرف مدين' },
      { account_id: acc2, debit: 0, credit: 1000, description: 'طرف دائن' },
    ]);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const addLine = () => {
    const firstAcc = postableAccounts[0]?.id || '';
    setLines((prev) => [
      ...prev,
      { account_id: firstAcc, debit: 0, credit: 0, description: '' },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: any) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l))
    );
  };

  const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setFormError('القيد غير متوازن! يجب أن يتساوى إجمالي المدين مع إجمالي الدائن تماماً.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await accountsApi.createJournalEntry({
        entry_date: entryDate,
        description,
        lines,
      });
      setIsCreateOpen(false);
      loadData(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء القيد اليومي');
    } finally {
      setFormLoading(false);
    }
  };

  const openDetailsModal = async (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
    try {
      const detailed = await accountsApi.getJournalEntry(entry.id);
      setSelectedEntry(detailed);
    } catch {
      //
    }
  };

  const handlePostEntry = async () => {
    if (!selectedEntry) return;
    if (!window.confirm('هل أنت متأكد من ترحيل القيد إلى دفاتر الأستاذ نهائياً؟')) return;
    setActionLoading(true);
    try {
      await accountsApi.postJournalEntry(selectedEntry.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل ترحيل القيد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpostEntry = async () => {
    if (!selectedEntry) return;
    if (!window.confirm('هل أنت متأكد من إلغاء ترحيل هذا القيد وإعادته كمسودة؟')) return;
    setActionLoading(true);
    try {
      await accountsApi.unpostJournalEntry(selectedEntry.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء ترحيل القيد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
    try {
      await accountsApi.deleteJournalEntry(id);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف القيد (لا يمكن حذف القيود المرحّلة)');
    }
  };

  const openTrialBalanceModal = async () => {
    setIsTbOpen(true);
    setTbLoading(true);
    try {
      const res = await accountsApi.getTrialBalance();
      setTrialBalanceData(Array.isArray(res) ? res : []);
    } catch {
      setTrialBalanceData([]);
    } finally {
      setTbLoading(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل القيود اليومية</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة القيود المالية الآلية واليدوية، ترحيل العمليات، وميزان المراجعة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openTrialBalanceModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Scale className="w-4 h-4" />
            ميزان المراجعة
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إنشاء قيد يدوي
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع القيود</option>
            <option value="posted">القيود المرحّلة فقط</option>
            <option value="draft">المسودات غير المرحّلة</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadData(pagination.page)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadData(pagination.page)} />}

      {/* Entries Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب القيود اليومية..." fullHeight />
        ) : entries.length === 0 ? (
          <EmptyState
            title="لا توجد قيود مسجلة"
            description="يتم توليد القيود تلقائياً عند تأكيد المبيعات والمشتريات، أو يمكنك إنشاء قيد يدوي."
            icon={<Scale className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">البيان والشرح</th>
                    <th className="py-3 px-4 text-center">المصدر</th>
                    <th className="py-3 px-4 text-center">إجمالي المدين</th>
                    <th className="py-3 px-4 text-center">إجمالي الدائن</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{e.entry_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {String(e.entry_date).slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{e.description}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                          {e.source_type || 'يدوي'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {Number(e.total_debit || 0).toLocaleString()} {baseCurrency}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {Number(e.total_credit || 0).toLocaleString()} {baseCurrency}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDetailsModal(e)}
                            title="عرض أطراف القيد"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(e.id)}
                              title="حذف القيد"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={loadData} />
          </>
        )}
      </div>

      {/* Create Journal Entry Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="إنشاء قيد محاسبي يدوي" maxWidth="4xl">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ القيد *</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بيان وشرح القيد *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-800">أطراف القيد المحاسبي</h4>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة طرف
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">الحساب المالي</th>
                    <th className="p-2.5 text-center w-32">مدين ({baseCurrency})</th>
                    <th className="p-2.5 text-center w-32">دائن ({baseCurrency})</th>
                    <th className="p-2.5">البيان الخاص بالطرف</th>
                    <th className="p-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <select
                          required
                          value={l.account_id}
                          onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-1.5 text-xs"
                        >
                          {postableAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.debit}
                          onChange={(e) => updateLine(idx, 'debit', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 p-1 text-xs text-center font-mono"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.credit}
                          onChange={(e) => updateLine(idx, 'credit', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 p-1 text-xs text-center font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={l.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          placeholder="شرح البند"
                          className="w-full rounded-lg border border-slate-300 p-1 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Balance check indicator */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2 text-xs">
              <div className="flex gap-4 font-mono font-bold">
                <span>
                  إجمالي المدين: <span className="text-emerald-700">{totalDebit.toFixed(2)}</span>
                </span>
                <span>
                  إجمالي الدائن: <span className="text-slate-900">{totalCredit.toFixed(2)}</span>
                </span>
                <span>
                  الفرق:{' '}
                  <span
                    className={isBalanced ? 'text-emerald-600' : 'text-rose-600 font-black'}
                  >
                    {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </span>
                </span>
              </div>
              <div>
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    القيد متوازن وجاهز
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    القيد غير متوازن
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading || !isBalanced}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ القيد كمسودة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      {selectedEntry && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`تفاصيل القيد المحاسبي: #${selectedEntry.entry_number}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">البيان</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEntry.description}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono text-slate-800">
                  {String(selectedEntry.entry_date).slice(0, 10)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedEntry.status} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">رمز الحساب</th>
                    <th className="p-2.5">اسم الحساب</th>
                    <th className="p-2.5 text-center">مدين</th>
                    <th className="p-2.5 text-center">دائن</th>
                    <th className="p-2.5">البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedEntry.lines || []).map((l, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{l.account_code}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{l.account_name}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                        {Number(l.debit || 0) > 0 ? Number(l.debit).toLocaleString() : '-'}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                        {Number(l.credit || 0) > 0 ? Number(l.credit).toLocaleString() : '-'}
                      </td>
                      <td className="p-2.5 text-slate-500">{l.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                طباعة سند القيد
              </button>

              <div className="flex items-center gap-2">
                {selectedEntry.status === 'draft' ? (
                  <button
                    type="button"
                    onClick={handlePostEntry}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading ? 'جاري الترحيل...' : 'ترحيل القيد نهائياً'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnpostEntry}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'جاري الإلغاء...' : 'إلغاء الترحيل'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Trial Balance Modal */}
      <Modal isOpen={isTbOpen} onClose={() => setIsTbOpen(false)} title="ميزان المراجعة المحاسبي" maxWidth="4xl">
        <div className="space-y-4">
          {tbLoading ? (
            <LoadingSpinner message="جاري احتساب ميزان المراجعة من كافة القيود المرحّلة..." />
          ) : trialBalanceData.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">لا توجد بيانات لميزان المراجعة</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">رمز الحساب</th>
                    <th className="p-2.5">اسم الحساب</th>
                    <th className="p-2.5 text-center">مجموع المدين</th>
                    <th className="p-2.5 text-center">مجموع الدائن</th>
                    <th className="p-2.5 text-center">الرصيد النهائي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalanceData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{row.code}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{row.name}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                        {Number(row.total_debit || 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                        {Number(row.total_credit || 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-blue-700">
                        {Number(row.balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTbOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Modal>

      {/* Print Voucher Modal */}
      {selectedEntry && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="سند قيد محاسبي يومي"
          documentType="قيد يومية"
          documentNumber={selectedEntry.entry_number}
          documentDate={String(selectedEntry.entry_date).slice(0, 10)}
          partyTitle="البيان والشرح"
          partyName={selectedEntry.description}
          currencyCode={baseCurrency}
          company={company}
          summary={[
            {
              label: 'إجمالي طرف المدين',
              value: Number(selectedEntry.total_debit || 0),
            },
            {
              label: 'إجمالي طرف الدائن',
              value: Number(selectedEntry.total_credit || 0),
              isTotal: true,
            },
          ]}
        />
      )}
    </div>
  );
};
