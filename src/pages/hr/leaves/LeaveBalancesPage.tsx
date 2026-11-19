// pages/hr/leaves/LeaveBalancesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Wallet, RefreshCw, Plus, Calendar, RotateCw, Trash2, Edit2,
} from 'lucide-react';
import { leaveBalancesApi, leaveTypesApi } from '../../../api/hr/leavesApi';
import { employeesApi } from '../../../api/hr/employeesApi';
import { LeaveBalance, LeaveType, Employee } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { getInitials } from '../utils';

const CURRENT_YEAR = new Date().getFullYear();

export const LeaveBalancesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [yearFilter, setYearFilter] = useState<number>(CURRENT_YEAR);
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await leaveBalancesApi.list({
        year: yearFilter,
        employee_id: employeeFilter || undefined,
      });
      setBalances(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الأرصدة');
    } finally { setIsLoading(false); }
  };

  const loadRefs = async () => {
    try {
      const [lts, emps] = await Promise.all([
        leaveTypesApi.list({ is_active: true }),
        employeesApi.list({ limit: 500, status: 'active' }).catch(() => ({ items: [] as Employee[] } as any)),
      ]);
      setLeaveTypes(lts);
      setEmployees(emps.items || []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { load(); }, [yearFilter, employeeFilter]);

  const handleDelete = async (bal: LeaveBalance) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرصيد؟')) return;
    try {
      await leaveBalancesApi.delete(bal.id);
      load();
    } catch (err: any) { alert(err.message || 'فشل الحذف'); }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">أرصدة الإجازات</h1>
          <p className="text-xs text-slate-500 mt-1">
            {balances.length} رصيد — سنة {yearFilter}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('leave_balances.create') && (
            <>
              <button type="button" onClick={() => { setSelectedBalance(null); setIsAddOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
                <Plus className="w-4 h-4" /> رصيد يدوي
              </button>
              <button type="button" onClick={() => setIsResetOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition">
                <RotateCw className="w-4 h-4" /> سنة جديدة
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
            {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none mr-auto">
          <option value="">كل الموظفين</option>
          {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name}</option>))}
        </select>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {isLoading ? (
        <LoadingSpinner message="جاري تحميل الأرصدة..." fullHeight />
      ) : balances.length === 0 ? (
        <EmptyState
          title="لا توجد أرصدة"
          description="لم يتم العثور على أي رصيد للسنة أو الموظف المحدد."
          icon={<Wallet className="w-8 h-8" />}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">نوع الإجازة</th>
                  <th className="py-3 px-4 text-center">المستحق</th>
                  <th className="py-3 px-4 text-center">المرحّل</th>
                  <th className="py-3 px-4 text-center">المستخدم</th>
                  <th className="py-3 px-4 text-center">المتبقي</th>
                  <th className="py-3 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map((bal) => {
                  const available = Number(bal.available_days ?? (Number(bal.entitled_days) + Number(bal.carried_days) - Number(bal.used_days)));
                  return (
                    <tr key={bal.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {getInitials(bal.full_name || '؟')}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{bal.full_name || '-'}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">#{bal.employee_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 text-[11px]">{bal.leave_type_name}</td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-700">{Number(bal.entitled_days)}</td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-blue-700">{Number(bal.carried_days)}</td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-rose-700">{Number(bal.used_days)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-black font-mono ${
                          available > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {available}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('leave_balances.update') && (
                            <button type="button" onClick={() => { setSelectedBalance(bal); setIsEditOpen(true); }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('leave_balances.delete') && (
                            <button type="button" onClick={() => handleDelete(bal)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddOpen && (
        <CreateBalanceModal
          leaveTypes={leaveTypes}
          employees={employees}
          defaultYear={yearFilter}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => { setIsAddOpen(false); load(); }}
        />
      )}

      {isEditOpen && selectedBalance && (
        <EditBalanceModal
          balance={selectedBalance}
          onClose={() => { setIsEditOpen(false); setSelectedBalance(null); }}
          onSuccess={() => { setIsEditOpen(false); setSelectedBalance(null); load(); }}
        />
      )}

      {isResetOpen && (
        <ResetYearModal
          employees={employees}
          defaultYear={yearFilter + 1}
          onClose={() => setIsResetOpen(false)}
          onSuccess={() => { setIsResetOpen(false); load(); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Create Manual Balance
// ═══════════════════════════════════════════════════════════════════════════
const CreateBalanceModal: React.FC<{
  leaveTypes: LeaveType[];
  employees: Employee[];
  defaultYear: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ leaveTypes, employees, defaultYear, onClose, onSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [year, setYear] = useState(defaultYear);
  const [entitled, setEntitled] = useState(0);
  const [used, setUsed] = useState(0);
  const [carried, setCarried] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !leaveTypeId) { setError('الموظف والنوع مطلوبان'); return; }
    setLoading(true); setError(null);
    try {
      await leaveBalancesApi.create({
        employee_id: employeeId, leave_type_id: leaveTypeId, year,
        entitled_days: Number(entitled) || 0,
        used_days: Number(used) || 0,
        carried_days: Number(carried) || 0,
      });
      onSuccess();
    } catch (err: any) { setError(err.message || 'فشل الإنشاء'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="إضافة رصيد يدوي">
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">الموظف *</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
              <option value="">اختر الموظف</option>
              {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name} — #{e.employee_number}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإجازة *</label>
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
              <option value="">اختر النوع</option>
              {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">السنة</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المستحق</label>
            <input type="number" min="0" step="0.5" value={entitled}
              onChange={(e) => setEntitled(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المرحّل</label>
            <input type="number" min="0" step="0.5" value={carried}
              onChange={(e) => setCarried(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">المستخدم</label>
            <input type="number" min="0" step="0.5" value={used}
              onChange={(e) => setUsed(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            <p className="text-[10px] text-slate-400 mt-1">
              ⚠️ عادةً يُدار used_days تلقائياً عبر اعتماد طلبات الإجازة. استخدمه فقط للتصحيح اليدوي.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">إلغاء</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Edit Balance (entitled/carried only)
// ═══════════════════════════════════════════════════════════════════════════
const EditBalanceModal: React.FC<{ balance: LeaveBalance; onClose: () => void; onSuccess: () => void }> = ({ balance, onClose, onSuccess }) => {
  const [entitled, setEntitled] = useState(Number(balance.entitled_days));
  const [carried, setCarried] = useState(Number(balance.carried_days));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await leaveBalancesApi.update(balance.id, {
        entitled_days: Number(entitled),
        carried_days: Number(carried),
      });
      onSuccess();
    } catch (err: any) { setError(err.message || 'فشل الحفظ'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="تعديل رصيد الإجازة">
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <p className="font-bold text-slate-900">{balance.full_name} — {balance.leave_type_name}</p>
          <p className="text-slate-500 mt-0.5">سنة {balance.year}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المستحق</label>
            <input type="number" min="0" step="0.5" value={entitled}
              onChange={(e) => setEntitled(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المرحّل</label>
            <input type="number" min="0" step="0.5" value={carried}
              onChange={(e) => setCarried(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>
        <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg">
          ⚠️ <strong>المستخدم</strong> لا يُعدَّل يدوياً — يُدار تلقائياً عبر اعتماد/إلغاء طلبات الإجازة.
        </p>
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

// ═══════════════════════════════════════════════════════════════════════════
// Reset Year Modal
// ═══════════════════════════════════════════════════════════════════════════
const ResetYearModal: React.FC<{
  employees: Employee[];
  defaultYear: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ employees, defaultYear, onClose, onSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [year, setYear] = useState(defaultYear);
  const [carryOver, setCarryOver] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) { setError('اختر الموظف'); return; }
    setLoading(true); setError(null);
    try {
      const res = await leaveBalancesApi.resetForYear(employeeId, { year, carry_over: carryOver });
      alert(`تم إنشاء ${res.created ?? 0} رصيد`);
      onSuccess();
    } catch (err: any) { setError(err.message || 'فشل الإنشاء'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="إنشاء أرصدة سنة جديدة">
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <p className="font-bold mb-1">📅 ماذا يفعل هذا؟</p>
          <p className="text-[11px] leading-relaxed">
            يُنشئ رصيداً للسنة المحددة لكل نوع إجازة نشط للموظف.
            إذا كان النوع يسمح بالترحيل، يُرحّل الرصيد المتبقي من السنة السابقة (حتى الحد الأقصى).
            يتخطى الأنواع التي لها رصيد بالفعل.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">الموظف *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
            <option value="">اختر الموظف</option>
            {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name} — #{e.employee_number}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">السنة</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2.5">
              <input type="checkbox" checked={carryOver} onChange={(e) => setCarryOver(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
              ترحيل الرصيد المتبقي
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">إلغاء</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الإنشاء...' : 'إنشاء الأرصدة'}
          </button>
        </div>
      </form>
    </Modal>
  );
};