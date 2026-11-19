// pages/hr/departments/DepartmentsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, RefreshCw, Edit2, Trash2, Users,
} from 'lucide-react';
import { departmentsApi } from '../../../api/hr/departmentsApi';
import { employeesApi } from '../../../api/hr/employeesApi';
import { Department, Employee } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';

export const DepartmentsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, emps] = await Promise.all([
        departmentsApi.list(),
        employeesApi.list({ limit: 500, status: 'active' }).catch(() => ({ items: [] as Employee[] } as any)),
      ]);
      setDepartments(depts);
      setEmployees(emps.items || []);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الأقسام');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${dept.name}"؟`)) return;
    try {
      await departmentsApi.delete(dept.id);
      load();
    } catch (err: any) {
      alert(err.message || 'فشل حذف القسم');
    }
  };

  // إحصاءات لكل قسم
  const employeeCount = (deptId: string) =>
    employees.filter((e) => e.department_id === deptId).length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">الأقسام</h1>
          <p className="text-xs text-slate-500 mt-1">
            {departments.length} قسم — {employees.length} موظف نشط
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('departments.create') && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept(null);
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {isLoading ? (
        <LoadingSpinner message="جاري تحميل الأقسام..." fullHeight />
      ) : departments.length === 0 ? (
        <EmptyState
          title="لا توجد أقسام"
          description="لم يتم إنشاء أي قسم بعد."
          actionLabel={hasPermission('departments.create') ? 'إضافة أول قسم' : undefined}
          onAction={hasPermission('departments.create') ? () => setIsAddOpen(true) : undefined}
          icon={<Building2 className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{dept.name}</h3>
                    {dept.code && (
                      <span className="text-[10px] text-slate-400 font-mono">#{dept.code}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                  dept.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {dept.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    عدد الموظفين
                  </span>
                  <span className="font-bold text-slate-800">{employeeCount(dept.id)}</span>
                </div>
                {dept.manager_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">المدير</span>
                    <span className="font-bold text-slate-800">{dept.manager_name}</span>
                  </div>
                )}
                {dept.parent_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">القسم الأب</span>
                    <span className="font-bold text-slate-800">{dept.parent_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                {hasPermission('departments.update') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDept(dept);
                      setIsEditOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                )}
                {hasPermission('departments.delete') && (
                  <button
                    type="button"
                    onClick={() => handleDelete(dept)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddOpen || isEditOpen) && (
        <DepartmentFormModal
          mode={isAddOpen ? 'create' : 'edit'}
          department={isAddOpen ? null : selectedDept}
          departments={departments}
          employees={employees}
          onClose={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
            setSelectedDept(null);
          }}
          onSuccess={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
            setSelectedDept(null);
            load();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Department Form Modal
// ═══════════════════════════════════════════════════════════════════════════
interface FormModalProps {
  mode: 'create' | 'edit';
  department: Department | null;
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const DepartmentFormModal: React.FC<FormModalProps> = ({
  mode, department, departments, employees, onClose, onSuccess,
}) => {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(department?.name || '');
  const [code, setCode] = useState(department?.code || '');
  const [parentId, setParentId] = useState<string | null>(department?.parent_id || null);
  const [managerId, setManagerId] = useState<string | null>(department?.manager_id || null);
  const [isActive, setIsActive] = useState(department?.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('اسم القسم مطلوب'); return; }

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Department> = {
        name: name.trim(),
        code: code.trim() || null,
        parent_id: parentId,
        manager_id: managerId,
        is_active: isActive,
      };

      if (isEdit && department) {
        await departmentsApi.update(department.id, payload);
      } else {
        await departmentsApi.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const parentOptions = departments.filter((d) => !department || d.id !== department.id);

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'تعديل قسم' : 'إضافة قسم جديد'}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم *</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="مثال: المبيعات"
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الكود</label>
            <input
              type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="SALES"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">القسم الأب</label>
            <select
              value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">بدون (قسم رئيسي)</option>
              {parentOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">مدير القسم</label>
          <select
            value={managerId || ''} onChange={(e) => setManagerId(e.target.value || null)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="">بدون مدير</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} ({e.employee_number})
              </option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="dept_active" checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="dept_active" className="text-xs font-bold text-slate-700">
              قسم نشط
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث' : 'حفظ القسم')}
          </button>
        </div>
      </form>
    </Modal>
  );
};