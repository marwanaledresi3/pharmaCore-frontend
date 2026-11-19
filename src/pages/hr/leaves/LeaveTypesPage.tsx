// pages/hr/leaves/LeaveTypesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, RefreshCw, Edit2, Trash2, Wallet, CheckCircle2, XCircle, ArrowRightLeft,
} from 'lucide-react';
import { leaveTypesApi } from '../../../api/hr/leavesApi';
import { LeaveType } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';

export const LeaveTypesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [types, setTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await leaveTypesApi.list();
      setTypes(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل أنواع الإجازات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (type: LeaveType) => {
    if (!window.confirm(`هل أنت متأكد من حذف نوع الإجازة "${type.name}"؟`)) return;
    try {
      await leaveTypesApi.delete(type.id);
      load();
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">أنواع الإجازات</h1>
          <p className="text-xs text-slate-500 mt-1">
            {types.length} نوع — {types.filter((t) => t.is_active).length} نشط
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('leave_types.create') && (
            <button type="button" onClick={() => { setSelectedType(null); setIsAddOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition">
              <Plus className="w-4 h-4" />
              إضافة نوع
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {isLoading ? (
        <LoadingSpinner message="جاري تحميل الأنواع..." fullHeight />
      ) : types.length === 0 ? (
        <EmptyState
          title="لا توجد أنواع إجازات"
          description="لم يتم إنشاء أي نوع بعد."
          actionLabel={hasPermission('leave_types.create') ? 'إضافة أول نوع' : undefined}
          onAction={hasPermission('leave_types.create') ? () => setIsAddOpen(true) : undefined}
          icon={<CalendarDays className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <div key={type.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{type.name}</h3>
                    {type.code && <span className="text-[10px] text-slate-400 font-mono">#{type.code}</span>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                  type.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {type.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">الأيام السنوية</span>
                  <span className="font-bold text-slate-800 font-mono">{type.annual_days} يوم</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    {type.is_paid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    مدفوعة؟
                  </span>
                  <span className={`font-bold ${type.is_paid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {type.is_paid ? 'نعم' : 'لا'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                    ترحيل الرصيد
                  </span>
                  <span className={`font-bold ${type.carry_over_allowed ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {type.carry_over_allowed ? `حتى ${type.max_carry_over_days} يوم` : 'غير مسموح'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    يتطلب موافقة
                  </span>
                  <span className="font-bold text-slate-800">{type.requires_approval ? 'نعم' : 'لا'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                {hasPermission('leave_types.update') && (
                  <button type="button" onClick={() => { setSelectedType(type); setIsEditOpen(true); }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                    <Edit2 className="w-3.5 h-3.5" /> تعديل
                  </button>
                )}
                {hasPermission('leave_types.delete') && (
                  <button type="button" onClick={() => handleDelete(type)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAddOpen || isEditOpen) && (
        <LeaveTypeFormModal
          mode={isAddOpen ? 'create' : 'edit'}
          leaveType={isAddOpen ? null : selectedType}
          onClose={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedType(null); }}
          onSuccess={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedType(null); load(); }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Form Modal
// ═══════════════════════════════════════════════════════════════════════════
interface FormProps {
  mode: 'create' | 'edit';
  leaveType: LeaveType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LeaveTypeFormModal: React.FC<FormProps> = ({ mode, leaveType, onClose, onSuccess }) => {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(leaveType?.name || '');
  const [code, setCode] = useState(leaveType?.code || '');
  const [annualDays, setAnnualDays] = useState(leaveType?.annual_days ?? 0);
  const [isPaid, setIsPaid] = useState(leaveType?.is_paid ?? true);
  const [requiresApproval, setRequiresApproval] = useState(leaveType?.requires_approval ?? true);
  const [carryOver, setCarryOver] = useState(leaveType?.carry_over_allowed ?? false);
  const [maxCarry, setMaxCarry] = useState(leaveType?.max_carry_over_days ?? 0);
  const [isActive, setIsActive] = useState(leaveType?.is_active ?? true);
const [isSickLeave, setIsSickLeave] = useState(leaveType?.is_sick_leave ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('اسم النوع مطلوب'); return; }
    setLoading(true); setError(null);
    try {
      const payload: Partial<LeaveType> = {
        name: name.trim(), code: code.trim() || null,
        annual_days: Number(annualDays) || 0,
        is_paid: isPaid, requires_approval: requiresApproval,
        carry_over_allowed: carryOver,
        max_carry_over_days: Number(maxCarry) || 0,
        is_sick_leave: isSickLeave,
        is_active: isActive,
      };
      if (isEdit && leaveType) await leaveTypesApi.update(leaveType.id, payload);
      else await leaveTypesApi.create(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'تعديل نوع إجازة' : 'إضافة نوع إجازة'}>
      {error && <ErrorAlert error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم النوع *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إجازة سنوية"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الكود</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="ANNUAL"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الأيام السنوية</label>
            <input type="number" min="0" step="0.5" value={annualDays}
              onChange={(e) => setAnnualDays(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-slate-50">
          <CheckboxRow label="مدفوعة الأجر" checked={isPaid} onChange={setIsPaid} />
          <CheckboxRow label="تتطلب موافقة" checked={requiresApproval} onChange={setRequiresApproval} />
          <CheckboxRow label="يُسمح بترحيل الرصيد" checked={carryOver} onChange={setCarryOver} />
          <CheckboxRow label="إجازة مرضية (للاعتماد التلقائي)" checked={isSickLeave} onChange={setIsSickLeave} />
          {carryOver && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للترحيل (أيام)</label>
              <input type="number" min="0" step="0.5" value={maxCarry}
                onChange={(e) => setMaxCarry(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
          )}
          {isEdit && <CheckboxRow label="نشط" checked={isActive} onChange={setIsActive} />}
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

const CheckboxRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
    <label className="text-xs font-bold text-slate-700">{label}</label>
  </div>
);