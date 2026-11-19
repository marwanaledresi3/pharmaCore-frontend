// pages/hr/leaves/LeaveRequestsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, RefreshCw, CheckCircle2, XCircle, Clock, Trash2, Eye, AlertCircle,
} from 'lucide-react';
import { leaveRequestsApi, leaveTypesApi } from '../../../api/hr/leavesApi';
import { employeesApi } from '../../../api/hr/employeesApi';
import { LeaveRequest, LeaveType, Employee, Pagination as PaginationType, LeaveRequestStatus } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '../constants';
import { formatDate, formatDateArabic, getInitials, daysBetween, todayISO } from '../utils';

export const LeaveRequestsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 20, total: 0, pages: 0 });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await leaveRequestsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        leave_type_id: typeFilter || undefined,
        employee_id: employeeFilter || undefined,
        page,
        limit: 20,
      });
      setRequests(res.items);
      setPagination({ page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total, pages: res.pagination.pages });
    } catch (err: any) {
      setError(err.message || 'فشل تحميل طلبات الإجازة');
    } finally {
      setIsLoading(false);
    }
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
  useEffect(() => { load(1); }, [statusFilter, typeFilter, employeeFilter]);

  const handleApprove = async (req: LeaveRequest) => {
    if (!window.confirm(`اعتماد إجازة ${req.full_name} من ${formatDate(req.start_date)} إلى ${formatDate(req.end_date)}؟`)) return;
    try {
      await leaveRequestsApi.approve(req.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الاعتماد');
    }
  };

  const handleReject = async (req: LeaveRequest) => {
    const reason = window.prompt('سبب الرفض (اختياري):');
    if (reason === null) return;
    try {
      await leaveRequestsApi.reject(req.id, reason.trim() || undefined);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الرفض');
    }
  };

  const handleCancel = async (req: LeaveRequest) => {
    if (!window.confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
    try {
      await leaveRequestsApi.cancel(req.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الإلغاء');
    }
  };

  const handleDelete = async (req: LeaveRequest) => {
    if (!window.confirm('هل أنت متأكد من حذف الطلب؟')) return;
    try {
      await leaveRequestsApi.delete(req.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  // Stats
  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">طلبات الإجازة</h1>
          <p className="text-xs text-slate-500 mt-1">
            {pagination.total} طلب — {stats.pending} قيد المراجعة، {stats.approved} معتمد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(pagination.page)} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('leave_requests.create') && (
            <button type="button" onClick={() => { setSelectedRequest(null); setIsAddOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
              <Plus className="w-4 h-4" />
              طلب إجازة جديد
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="قيد المراجعة" value={stats.pending} color="amber" icon={<Clock className="w-5 h-5" />} />
        <StatBox label="معتمد" value={stats.approved} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatBox label="مرفوض" value={stats.rejected} color="rose" icon={<XCircle className="w-5 h-5" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
          <option value="all">كل الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="rejected">مرفوض</option>
          <option value="cancelled">ملغى</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
          <option value="">كل الأنواع</option>
          {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
        </select>

        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none mr-auto">
          <option value="">كل الموظفين</option>
          {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name}</option>))}
        </select>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => load(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل الطلبات..." fullHeight />
        ) : requests.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات إجازة"
            description="لم يتم العثور على أي طلب مطابق."
            actionLabel={hasPermission('leave_requests.create') ? 'إنشاء طلب جديد' : undefined}
            onAction={hasPermission('leave_requests.create') ? () => setIsAddOpen(true) : undefined}
            icon={<CalendarDays className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">نوع الإجازة</th>
                    <th className="py-3 px-4">من</th>
                    <th className="py-3 px-4">إلى</th>
                    <th className="py-3 px-4">الأيام</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {getInitials(req.full_name || '؟')}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{req.full_name || '-'}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">#{req.employee_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className="font-semibold text-slate-800">{req.leave_type_name || '-'}</span>
                        {req.is_paid === false && (
                          <span className="block text-[10px] text-rose-600">بدون راتب</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatDate(req.start_date)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatDate(req.end_date)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-900">
                        {req.days_count} يوم
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${LEAVE_STATUS_COLORS[req.status]}`}>
                          {LEAVE_STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => { setSelectedRequest(req); setIsViewOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="عرض">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {req.status === 'pending' && hasPermission('leave_requests.approve') && (
                            <>
                              <button type="button" onClick={() => handleApprove(req)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="اعتماد">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleReject(req)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="رفض">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(req.status === 'pending' || req.status === 'approved') && hasPermission('leave_requests.cancel') && (
                            <button type="button" onClick={() => handleCancel(req)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="إلغاء">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {req.status === 'pending' && hasPermission('leave_requests.delete') && (
                            <button type="button" onClick={() => handleDelete(req)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
        <CreateLeaveRequestModal
          leaveTypes={leaveTypes}
          employees={employees}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => { setIsAddOpen(false); load(1); }}
        />
      )}

      {/* View Modal */}
      {isViewOpen && selectedRequest && (
        <ViewLeaveRequestModal
          request={selectedRequest}
          onClose={() => { setIsViewOpen(false); setSelectedRequest(null); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// StatBox
// ═══════════════════════════════════════════════════════════════════════════
const StatBox: React.FC<{ label: string; value: number; color: 'emerald' | 'rose' | 'amber'; icon: React.ReactNode }> = ({ label, value, color, icon }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold opacity-75">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Create Modal
// ═══════════════════════════════════════════════════════════════════════════
const CreateLeaveRequestModal: React.FC<{
  leaveTypes: LeaveType[];
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ leaveTypes, employees, onClose, onSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) { setError('اختر الموظف'); return; }
    if (!leaveTypeId) { setError('اختر نوع الإجازة'); return; }
    if (new Date(endDate) < new Date(startDate)) { setError('تاريخ النهاية قبل البداية'); return; }

    setLoading(true); setError(null);
    try {
      await leaveRequestsApi.create({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الطلب');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="طلب إجازة جديد">
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
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
            {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name} ({lt.annual_days} يوم/سنة)</option>))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">من تاريخ *</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">إلى تاريخ *</label>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-900">
            عدد الأيام: <span className="font-mono text-base">{days}</span> يوم
            {selectedType && (
              <span className="block text-[10px] font-normal text-emerald-700 mt-1">
                الحد السنوي: {selectedType.annual_days} يوم
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">السبب / الملاحظات</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'حفظ الطلب'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// View Modal
// ═══════════════════════════════════════════════════════════════════════════
const ViewLeaveRequestModal: React.FC<{ request: LeaveRequest; onClose: () => void }> = ({ request, onClose }) => (
  <Modal isOpen onClose={onClose} title="تفاصيل طلب الإجازة">
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
          {getInitials(request.full_name || '؟')}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-slate-900">{request.full_name}</h3>
          <span className="text-[10px] text-slate-400 font-mono">#{request.employee_number}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${LEAVE_STATUS_COLORS[request.status]}`}>
          {LEAVE_STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <InfoRow label="نوع الإجازة" value={request.leave_type_name || '-'} />
        <InfoRow label="عدد الأيام" value={`${request.days_count} يوم`} mono />
        <InfoRow label="من تاريخ" value={formatDateArabic(request.start_date)} full />
        <InfoRow label="إلى تاريخ" value={formatDateArabic(request.end_date)} full />
        {request.reason && <InfoRow label="السبب" value={request.reason} full />}
        {request.approved_by_name && <InfoRow label="بواسطة" value={request.approved_by_name} />}
        {request.approved_at && <InfoRow label="تاريخ الاعتماد" value={formatDate(request.approved_at)} />}
        {request.rejection_reason && <InfoRow label="سبب الرفض" value={request.rejection_reason} full />}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
          إغلاق
        </button>
      </div>
    </div>
  </Modal>
);

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean; full?: boolean }> = ({ label, value, mono, full }) => (
  <div className={`p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 ${full ? 'col-span-2' : ''}`}>
    <span className="text-slate-400 block mb-0.5 text-[10px]">{label}</span>
    <span className={`font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);