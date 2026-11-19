// pages/hr/jobTitles/JobTitlesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, RefreshCw, Edit2, Trash2, Building2,
} from 'lucide-react';
import { jobTitlesApi } from '../../../api/hr/jobTitlesApi';
import { departmentsApi } from '../../../api/hr/departmentsApi';
import { JobTitle, Department } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { DepartmentPicker } from '../../../components/hr/DepartmentPicker';

export const JobTitlesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedJT, setSelectedJT] = useState<JobTitle | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [jts, depts] = await Promise.all([
        jobTitlesApi.list(),
        departmentsApi.list(),
      ]);
      setJobTitles(jts);
      setDepartments(depts);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل المسميات الوظيفية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (jt: JobTitle) => {
    if (!window.confirm(`هل أنت متأكد من حذف المسمى "${jt.name}"؟`)) return;
    try {
      await jobTitlesApi.delete(jt.id);
      load();
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  // تجميع حسب القسم
  const grouped = jobTitles.reduce<Record<string, JobTitle[]>>((acc, jt) => {
    const key = jt.department_id || 'none';
    if (!acc[key]) acc[key] = [];
    acc[key].push(jt);
    return acc;
  }, {});

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return 'بدون قسم';
    return departments.find((d) => d.id === deptId)?.name || 'غير معروف';
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">المسميات الوظيفية</h1>
          <p className="text-xs text-slate-500 mt-1">
            {jobTitles.length} مسمى وظيفي موزّعة على {Object.keys(grouped).length} قسم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('job_titles.create') && (
            <button type="button" onClick={() => { setSelectedJT(null); setIsAddOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
              <Plus className="w-4 h-4" />
              إضافة مسمى
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {isLoading ? (
        <LoadingSpinner message="جاري تحميل المسميات..." fullHeight />
      ) : jobTitles.length === 0 ? (
        <EmptyState
          title="لا توجد مسميات وظيفية"
          description="لم يتم إنشاء أي مسمى بعد."
          actionLabel={hasPermission('job_titles.create') ? 'إضافة أول مسمى' : undefined}
          onAction={hasPermission('job_titles.create') ? () => setIsAddOpen(true) : undefined}
          icon={<Briefcase className="w-8 h-8" />}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([deptId, jts]) => (
            <div key={deptId} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-black text-slate-700">{getDeptName(deptId === 'none' ? null : deptId)}</h3>
                <span className="text-[10px] text-slate-400 mr-auto">({jts.length})</span>
              </div>
              <div className="divide-y divide-slate-100">
                {jts.map((jt) => (
                  <div key={jt.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900">{jt.name}</h4>
                        {jt.description && (
                          <p className="text-[11px] text-slate-500 truncate">{jt.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                        jt.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {jt.is_active ? 'نشط' : 'معطل'}
                      </span>
                      {hasPermission('job_titles.update') && (
                        <button type="button" onClick={() => { setSelectedJT(jt); setIsEditOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasPermission('job_titles.delete') && (
                        <button type="button" onClick={() => handleDelete(jt)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAddOpen || isEditOpen) && (
        <JobTitleFormModal
          mode={isAddOpen ? 'create' : 'edit'}
          jobTitle={isAddOpen ? null : selectedJT}
          departments={departments}
          onClose={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedJT(null); }}
          onSuccess={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedJT(null); load(); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// JobTitle Form Modal
// ═══════════════════════════════════════════════════════════════════════════
interface FormModalProps {
  mode: 'create' | 'edit';
  jobTitle: JobTitle | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

const JobTitleFormModal: React.FC<FormModalProps> = ({
  mode, jobTitle, departments, onClose, onSuccess,
}) => {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(jobTitle?.name || '');
  const [departmentId, setDepartmentId] = useState<string | null>(jobTitle?.department_id || null);
  const [description, setDescription] = useState(jobTitle?.description || '');
  const [isActive, setIsActive] = useState(jobTitle?.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('اسم المسمى مطلوب'); return; }

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<JobTitle> = {
        name: name.trim(),
        department_id: departmentId,
        description: description.trim() || null,
        is_active: isActive,
      };

      if (isEdit && jobTitle) {
        await jobTitlesApi.update(jobTitle.id, payload);
      } else {
        await jobTitlesApi.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'تعديل مسمى وظيفي' : 'إضافة مسمى وظيفي'}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">اسم المسمى *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مندوب مبيعات"
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
          <DepartmentPicker departments={departments} value={departmentId} onChange={setDepartmentId} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="وصف مختصر للمهام..."
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none resize-none" />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="jt_active" checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
            <label htmlFor="jt_active" className="text-xs font-bold text-slate-700">مسمى نشط</label>
          </div>
        )}

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