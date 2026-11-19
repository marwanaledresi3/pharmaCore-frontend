// pages/hr/employees/EmployeesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, RefreshCw, Phone, Mail, Building2,
  Edit2, Trash2, Eye, UserCheck, UserX, Briefcase, Download,
} from 'lucide-react';
import { employeesApi } from '../../../api/hr/employeesApi';
import { departmentsApi } from '../../../api/hr/departmentsApi';
import { jobTitlesApi } from '../../../api/hr/jobTitlesApi';
import { Employee, Department, JobTitle, Pagination as PaginationType } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { EmploymentStatusBadge } from '../../../components/hr/EmploymentStatusBadge';
import { DepartmentPicker } from '../../../components/hr/DepartmentPicker';
import {
  EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, MARITAL_STATUS_LABELS,
} from '../constants';
import { formatMoney, formatDate, getInitials } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export const EmployeesPage: React.FC = () => {
  const { company, hasPermission } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0, pages: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // Load
  // ═══════════════════════════════════════════════════════════════════
  const loadEmployees = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await employeesApi.list({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        department_id: departmentFilter || undefined,
        page,
        limit: 15,
      });
      setEmployees(res.items);
      setPagination({
        page: res.pagination.page,
        limit: res.pagination.limit,
        total: res.pagination.total,
        pages: res.pagination.pages,
      });
    } catch (err: any) {
      setError(err.message || 'فشل تحميل قائمة الموظفين');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [depts, jts] = await Promise.all([
        departmentsApi.list(),
        jobTitlesApi.list(),
      ]);
      setDepartments(depts);
      setJobTitles(jts);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadEmployees(1);
  }, [statusFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmployees(1);
  };

  // ═══════════════════════════════════════════════════════════════════
  // Delete
  // ═══════════════════════════════════════════════════════════════════
  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموظف "${emp.full_name}"؟`)) return;
    try {
      await employeesApi.delete(emp.id);
      loadEmployees(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف الموظف');
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الموظفين</h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل الموظفين، الأقسام، المسميات، والرواتب
          </p>
        </div>

        {hasPermission('employees.create') && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setSelectedEmployee(null);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة موظف جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الموظف، أو الهوية..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">جميع الأقسام</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="on_leave">في إجازة</option>
            <option value="suspended">موقوف</option>
            <option value="terminated">منتهي الخدمة</option>
            <option value="resigned">مستقيل</option>
          </select>

          <button
            type="button"
            onClick={() => loadEmployees(pagination.page)}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadEmployees(pagination.page)} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب الموظفين..." fullHeight />
        ) : employees.length === 0 ? (
          <EmptyState
            title="لا يوجد موظفون مطابقون"
            description="لم يتم العثور على أي موظف بالبيانات المدخلة."
            actionLabel={hasPermission('employees.create') ? 'إضافة أول موظف' : undefined}
            onAction={hasPermission('employees.create') ? () => setIsAddOpen(true) : undefined}
            icon={<Users className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">القسم / الوظيفة</th>
                    <th className="py-3 px-4">الاتصال</th>
                    <th className="py-3 px-4">تاريخ التعيين</th>
                    <th className="py-3 px-4">الراتب الأساسي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(emp.full_name)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{emp.full_name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              #{emp.employee_number}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {emp.department_name || '-'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Briefcase className="w-3 h-3" />
                            {emp.job_title_name || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {emp.phone && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span dir="ltr">{emp.phone}</span>
                            </span>
                          )}
                          {emp.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span dir="ltr">{emp.email}</span>
                            </span>
                          )}
                          {!emp.phone && !emp.email && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {formatDate(emp.hire_date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                        {formatMoney(emp.basic_salary, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <EmploymentStatusBadge status={emp.status} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsViewOpen(true);
                            }}
                            title="عرض التفاصيل"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('employees.update') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setFormError(null);
                                setIsEditOpen(true);
                              }}
                              title="تعديل"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('employees.delete') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(emp)}
                              title="حذف"
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

            <Pagination pagination={pagination} onPageChange={loadEmployees} />
          </>
        )}
      </div>

      {/* Add / Edit Modals */}
      {(isAddOpen || isEditOpen) && (
        <EmployeeFormModal
          mode={isAddOpen ? 'create' : 'edit'}
          employee={isAddOpen ? null : selectedEmployee}
          departments={departments}
          jobTitles={jobTitles}
          currency={currency}
          onClose={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
            setSelectedEmployee(null);
            loadEmployees(isAddOpen ? 1 : pagination.page);
          }}
        />
      )}

      {/* View Modal */}
      {isViewOpen && selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          currency={currency}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Form Modal (Create + Edit)
// ═══════════════════════════════════════════════════════════════════════════
interface EmployeeFormModalProps {
  mode: 'create' | 'edit';
  employee: Employee | null;
  departments: Department[];
  jobTitles: JobTitle[];
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  mode, employee, departments, jobTitles, currency, onClose, onSuccess,
}) => {
  const isEdit = mode === 'edit';

  const [fullName, setFullName] = useState(employee?.full_name || '');
  const [fullNameEn, setFullNameEn] = useState(employee?.full_name_en || '');
  const [employeeNumber, setEmployeeNumber] = useState(employee?.employee_number || '');
  const [nationalId, setNationalId] = useState(employee?.national_id || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [hireDate, setHireDate] = useState(employee?.hire_date?.slice(0, 10) || '');
  const [departmentId, setDepartmentId] = useState<string | null>(employee?.department_id || null);
  const [jobTitleId, setJobTitleId] = useState<string | null>(employee?.job_title_id || null);
  const [employmentType, setEmploymentType] = useState(employee?.employment_type || 'full_time');
  const [status, setStatus] = useState(employee?.status || 'active');

  const [basicSalary, setBasicSalary] = useState(employee?.basic_salary ?? 0);
  const [housing, setHousing] = useState(employee?.housing_allowance ?? 0);
  const [transport, setTransport] = useState(employee?.transport_allowance ?? 0);
  const [other, setOther] = useState(employee?.other_allowances ?? 0);

  const [bankName, setBankName] = useState(employee?.bank_name || '');
  const [bankAccount, setBankAccount] = useState(employee?.bank_account || '');
  const [iban, setIban] = useState(employee?.iban || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('اسم الموظف مطلوب'); return; }
    if (!hireDate) { setError('تاريخ التعيين مطلوب'); return; }

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Employee> = {
        full_name: fullName.trim(),
        full_name_en: fullNameEn.trim() || null,
        employee_number: employeeNumber.trim() || undefined,
        national_id: nationalId.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        hire_date: hireDate,
        department_id: departmentId,
        job_title_id: jobTitleId,
        employment_type: employmentType as any,
        status: status as any,
        basic_salary: Number(basicSalary) || 0,
        housing_allowance: Number(housing) || 0,
        transport_allowance: Number(transport) || 0,
        other_allowances: Number(other) || 0,
        bank_name: bankName.trim() || null,
        bank_account: bankAccount.trim() || null,
        iban: iban.trim() || null,
      };

      if (isEdit && employee) {
        await employeesApi.update(employee.id, payload);
      } else {
        await employeesApi.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobTitles = departmentId
    ? jobTitles.filter((jt) => !jt.department_id || jt.department_id === departmentId)
    : jobTitles;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
    >
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* البيانات الأساسية */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider">البيانات الأساسية</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="محمد أحمد علي" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
              <input type="text" value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)}
                dir="ltr" placeholder="Mohammed Ahmed Ali" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموظف</label>
              <input type="text" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="EMP-0001 (تلقائي)" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهوية / الجواز</label>
              <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الهاتف</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr"
                placeholder="770000000" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
                placeholder="emp@company.com" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* الوظيفة */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider">الوظيفة</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
              <DepartmentPicker
                departments={departments}
                value={departmentId}
                onChange={(id) => { setDepartmentId(id); setJobTitleId(null); }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
              <select value={jobTitleId || ''} onChange={(e) => setJobTitleId(e.target.value || null)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
                <option value="">اختر المسمى</option>
                {filteredJobTitles.map((jt) => (
                  <option key={jt.id} value={jt.id}>{jt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع التوظيف</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
                <option value="contract">عقد</option>
                <option value="intern">متدرب</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التعيين *</label>
              <input type="date" required value={hireDate} onChange={(e) => setHireDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            {isEdit && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
                  <option value="active">نشط</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="suspended">موقوف</option>
                  <option value="terminated">منتهي الخدمة</option>
                  <option value="resigned">مستقيل</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* الراتب */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider">الراتب والبدلات ({currency})</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الأساسي *</label>
              <input type="number" min="0" step="0.01" value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بدل السكن</label>
              <input type="number" min="0" step="0.01" value={housing}
                onChange={(e) => setHousing(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بدل النقل</label>
              <input type="number" min="0" step="0.01" value={transport}
                onChange={(e) => setTransport(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بدلات أخرى</label>
              <input type="number" min="0" step="0.01" value={other}
                onChange={(e) => setOther(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* البنك */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider">بيانات البنك</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم البنك</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحساب</label>
              <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IBAN</label>
              <input type="text" value={iban} onChange={(e) => setIban(e.target.value)} dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث البيانات' : 'حفظ الموظف')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Detail Modal
// ═══════════════════════════════════════════════════════════════════════════
interface EmployeeDetailModalProps {
  employee: Employee;
  currency: string;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, currency, onClose }) => {
  return (
    <Modal isOpen onClose={onClose} title="تفاصيل الموظف">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg shrink-0">
            {getInitials(employee.full_name)}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-900">{employee.full_name}</h3>
            {employee.full_name_en && (
              <p className="text-[11px] text-slate-500">{employee.full_name_en}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-mono">#{employee.employee_number}</span>
              <EmploymentStatusBadge status={employee.status} />
            </div>
          </div>
        </div>

        {/* البيانات */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoRow label="القسم" value={employee.department_name || '-'} />
          <InfoRow label="المسمى الوظيفي" value={employee.job_title_name || '-'} />
          <InfoRow label="نوع التوظيف" value={EMPLOYMENT_TYPE_LABELS[employee.employment_type]} />
          <InfoRow label="تاريخ التعيين" value={formatDate(employee.hire_date)} />
          <InfoRow label="الجنس" value={employee.gender ? GENDER_LABELS[employee.gender] : '-'} />
          <InfoRow label="الحالة الاجتماعية" value={employee.marital_status ? MARITAL_STATUS_LABELS[employee.marital_status] : '-'} />
          <InfoRow label="الهاتف" value={employee.phone || '-'} mono dir="ltr" />
          <InfoRow label="البريد" value={employee.email || '-'} mono dir="ltr" />
          <InfoRow label="العنوان" value={employee.address || '-'} full />
          <InfoRow label="رقم الهوية" value={employee.national_id || '-'} mono />
          <InfoRow label="البنك" value={employee.bank_name || '-'} />
          <InfoRow label="رقم الحساب" value={employee.bank_account || '-'} mono dir="ltr" />
        </div>

        {/* الراتب */}
        <section className="space-y-2">
          <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">الراتب والبدلات</h4>
          <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
            <SummaryRow label="الراتب الأساسي" value={formatMoney(employee.basic_salary, currency)} />
            <SummaryRow label="بدل السكن" value={formatMoney(employee.housing_allowance, currency)} />
            <SummaryRow label="بدل النقل" value={formatMoney(employee.transport_allowance, currency)} />
            <SummaryRow label="بدلات أخرى" value={formatMoney(employee.other_allowances, currency)} />
            <div className="border-t border-slate-200 pt-2 mt-2">
              <SummaryRow
                label="الإجمالي الشهري"
                value={formatMoney(
                  Number(employee.basic_salary) +
                  Number(employee.housing_allowance) +
                  Number(employee.transport_allowance) +
                  Number(employee.other_allowances),
                  currency
                )}
                bold
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean; dir?: string; full?: boolean }> = ({ label, value, mono, dir, full }) => (
  <div className={`p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 ${full ? 'col-span-2' : ''}`}>
    <span className="text-slate-400 block mb-0.5 text-[10px]">{label}</span>
    <span className={`font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`} dir={dir}>{value}</span>
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div className="flex items-center justify-between">
    <span className={`text-slate-600 ${bold ? 'font-black text-slate-900' : ''}`}>{label}</span>
    <span className={`font-mono ${bold ? 'font-black text-emerald-700' : 'text-slate-800'}`}>{value}</span>
  </div>
);