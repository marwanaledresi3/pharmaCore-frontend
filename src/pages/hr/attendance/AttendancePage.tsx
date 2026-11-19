// pages/hr/attendance/AttendancePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, RefreshCw, Edit2, Trash2, Clock, LogIn, LogOut,
  CheckCircle2, XCircle, AlertTriangle, Filter,
} from 'lucide-react';
import { attendanceApi } from '../../../api/hr/attendanceApi';
import { employeesApi } from '../../../api/hr/employeesApi';
import { AttendanceRecord, Employee, Pagination as PaginationType, AttendanceStatus } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import { useAuth } from '../../../context/AuthContext';
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS,
} from '../constants';
import { formatDate, formatTime, formatHours, todayISO, getInitials } from '../utils';

export const AttendancePage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 20, total: 0, pages: 0 });

  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const load = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.list({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        employee_id: employeeFilter || undefined,
        page,
        limit: 20,
      });
      setRecords(res.items);
      setPagination({ page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total, pages: res.pagination.pages });
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الحضور');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await employeesApi.list({ limit: 500, status: 'active' });
      setEmployees(res.items);
    } catch { /* silent */ }
  };

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { load(1); }, [dateFrom, dateTo, statusFilter, employeeFilter]);

  const handleDelete = async (rec: AttendanceRecord) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل الحضور؟')) return;
    try {
      await attendanceApi.delete(rec.id);
      load(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  const setToday = () => {
    setDateFrom(todayISO());
    setDateTo(todayISO());
  };

  // إحصاءات سريعة
  const stats = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">الحضور والانصراف</h1>
          <p className="text-xs text-slate-500 mt-1">
            {pagination.total} سجل — {stats.present} حاضر، {stats.absent} غائب، {stats.late} متأخر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(pagination.page)} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('attendance.upsert') && (
            <button type="button" onClick={() => { setSelectedRecord(null); setIsAddOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
              <Plus className="w-4 h-4" />
              تسجيل حضور
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="حاضرون" value={stats.present} color="emerald" icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatBox label="غائبون" value={stats.absent} color="rose" icon={<XCircle className="w-5 h-5" />} />
        <StatBox label="متأخرون" value={stats.late} color="amber" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none" />
          <span className="text-slate-400 text-xs">إلى</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none" />
          <button type="button" onClick={setToday}
            className="px-2.5 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition whitespace-nowrap">
            اليوم
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:mr-auto">
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
            <option value="">كل الموظفين</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
            <option value="all">كل الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="late">متأخر</option>
            <option value="leave">إجازة</option>
            <option value="holiday">عطلة</option>
            <option value="remote">عن بُعد</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => load(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل الحضور..." fullHeight />
        ) : records.length === 0 ? (
          <EmptyState
            title="لا توجد سجلات حضور"
            description="لم يتم العثور على أي سجل في الفترة المحددة."
            actionLabel={hasPermission('attendance.upsert') ? 'تسجيل حضور' : undefined}
            onAction={hasPermission('attendance.upsert') ? () => setIsAddOpen(true) : undefined}
            icon={<Calendar className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">الحضور</th>
                    <th className="py-3 px-4">الانصراف</th>
                    <th className="py-3 px-4">ساعات العمل</th>
                    <th className="py-3 px-4">إضافي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {getInitials(rec.full_name || '؟')}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{rec.full_name || '-'}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">#{rec.employee_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatDate(rec.work_date)}</td>
                      <td className="py-3 px-4 text-[11px]">
                        {rec.check_in ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <LogIn className="w-3 h-3" />
                            {formatTime(rec.check_in)}
                          </span>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {rec.check_out ? (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <LogOut className="w-3 h-3" />
                            {formatTime(rec.check_out)}
                          </span>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{formatHours(rec.worked_hours)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-purple-700">
                        {rec.overtime_hours > 0 ? formatHours(rec.overtime_hours) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${ATTENDANCE_STATUS_COLORS[rec.status]}`}>
                          {ATTENDANCE_STATUS_LABELS[rec.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('attendance.upsert') && (
                            <button type="button" onClick={() => { setSelectedRecord(rec); setIsEditOpen(true); }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('attendance.delete') && (
                            <button type="button" onClick={() => handleDelete(rec)}
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

      {(isAddOpen || isEditOpen) && (
        <AttendanceFormModal
          mode={isAddOpen ? 'create' : 'edit'}
          record={isAddOpen ? null : selectedRecord}
          employees={employees}
          onClose={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedRecord(null); }}
          onSuccess={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedRecord(null); load(pagination.page); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// StatBox
// ═══════════════════════════════════════════════════════════════════════════
const StatBox: React.FC<{ label: string; value: number; color: 'emerald' | 'rose' | 'amber'; icon: React.ReactNode }> = ({
  label, value, color, icon,
}) => {
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
// Attendance Form Modal
// ═══════════════════════════════════════════════════════════════════════════
interface FormModalProps {
  mode: 'create' | 'edit';
  record: AttendanceRecord | null;
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const AttendanceFormModal: React.FC<FormModalProps> = ({
  mode, record, employees, onClose, onSuccess,
}) => {
  const isEdit = mode === 'edit';

  const [employeeId, setEmployeeId] = useState(record?.employee_id || '');
  const [workDate, setWorkDate] = useState(record?.work_date?.slice(0, 10) || todayISO());
  const [checkIn, setCheckIn] = useState(record?.check_in ? toLocalInput(record.check_in) : '');
  const [checkOut, setCheckOut] = useState(record?.check_out ? toLocalInput(record.check_out) : '');
  const [status, setStatus] = useState<AttendanceStatus>(record?.status || 'present');
  const [notes, setNotes] = useState(record?.notes || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toLocalInput(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) { setError('اختر الموظف'); return; }
    if (!workDate) { setError('اختر التاريخ'); return; }

    setLoading(true);
    setError(null);
    try {
      await attendanceApi.upsert({
        employee_id: employeeId,
        work_date: workDate,
        check_in: checkIn ? new Date(checkIn).toISOString() : null,
        check_out: checkOut ? new Date(checkOut).toISOString() : null,
        status,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'تعديل سجل حضور' : 'تسجيل حضور'}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">الموظف *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required
            disabled={isEdit}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-50">
            <option value="">اختر الموظف</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} — #{e.employee_number}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
            <input type="date" required value={workDate} onChange={(e) => setWorkDate(e.target.value)}
              disabled={isEdit}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
              <option value="late">متأخر</option>
              <option value="leave">إجازة</option>
              <option value="holiday">عطلة</option>
              <option value="weekend">نهاية الأسبوع</option>
              <option value="remote">عن بُعد</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وقت الحضور</label>
            <input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانصراف</label>
            <input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث' : 'حفظ')}
          </button>
        </div>
      </form>
    </Modal>
  );
};