// pages/settings/sections/HRGeneralSection.tsx
import React, { useState, useEffect } from 'react';
import {
  UserCog, Save, RefreshCw, AlertCircle, CheckCircle2,
  Hash, IdCard, FileText, Fingerprint, Info,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

export const HRGeneralSection: React.FC = () => {
  const { hasPermission } = useAuth();

  // ═══════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════
  const [hrEnabled, setHrEnabled] = useState(true);

  // Employee numbering
  const [empPrefix, setEmpPrefix] = useState('EMP-');
  const [empPadding, setEmpPadding] = useState(4);

  // Payroll numbering
  const [payPrefix, setPayPrefix] = useState('PAY-');
  const [payPadding, setPayPadding] = useState(4);

  // Leave request numbering
  const [leavePrefix, setLeavePrefix] = useState('LR-');
  const [leavePadding, setLeavePadding] = useState(4);

  // Attendance numbering
  const [attPrefix, setAttPrefix] = useState('ATT-');
  const [attPadding, setAttPadding] = useState(4);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // Load
  // ═══════════════════════════════════════════════════════════════
  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const all = await settingsApi.getAll();
      setHrEnabled(all.hr_enabled ?? true);

      setEmpPrefix(all.hr_employee_number_prefix ?? 'EMP-');
      setEmpPadding(Number(all.hr_employee_number_padding ?? 4));

      setPayPrefix(all.hr_payroll_number_prefix ?? 'PAY-');
      setPayPadding(Number(all.hr_payroll_number_padding ?? 4));

      setLeavePrefix(all.numbering_leave_request_prefix ?? 'LR-');
      setLeavePadding(Number(all.numbering_padding ?? 4));

      setAttPrefix(all.numbering_attendance_prefix ?? 'ATT-');
      setAttPadding(Number(all.numbering_padding ?? 4));
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ═══════════════════════════════════════════════════════════════
  // Save
  // ═══════════════════════════════════════════════════════════════
  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await settingsApi.updateMany({
        hr_enabled: hrEnabled,

        hr_employee_number_prefix: empPrefix,
        hr_employee_number_padding: empPadding,

        hr_payroll_number_prefix: payPrefix,
        hr_payroll_number_padding: payPadding,

        numbering_leave_request_prefix: leavePrefix,
        numbering_attendance_prefix: attPrefix,
      });

      setSuccess('✅ تم حفظ الإعدادات');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Preview helper
  // ═══════════════════════════════════════════════════════════════
  const preview = (prefix: string, padding: number): string => {
    const safePad = Math.max(1, Math.min(10, Number(padding) || 4));
    return `${prefix}${String(1).padStart(safePad, '0')}`;
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-black text-slate-900">إعدادات الموارد البشرية العامة</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          تفعيل الوحدة، ترقيم المستندات، والبادئات
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Master toggle */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-emerald-50 to-white border border-emerald-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-black text-slate-900">تفعيل وحدة الموارد البشرية</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                عند التعطيل، تُخفى جميع قوائم HR من الواجهة
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={hrEnabled}
            onChange={(e) => setHrEnabled(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">كيف تعمل البادئات؟</p>
          <p className="leading-relaxed">
            رقم الموظف = <span className="font-mono">{preview(empPrefix, empPadding)}</span> ·
            رقم المسير = <span className="font-mono">{preview(payPrefix, payPadding)}</span> ·
            رقم الطلب = <span className="font-mono">{preview(leavePrefix, leavePadding)}</span>
          </p>
          <p className="text-[10px] opacity-75 mt-1">
            مثال: EMP-0001، PAY-0001، LR-0001
          </p>
        </div>
      </div>

      {/* ─── Employee Numbering ───────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <IdCard className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">ترقيم الموظفين</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">البادئة</label>
            <input
              type="text"
              value={empPrefix}
              onChange={(e) => setEmpPrefix(e.target.value.toUpperCase())}
              maxLength={10}
              placeholder="EMP-"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">عدد الأصفار</label>
            <input
              type="number"
              min="1"
              max="10"
              value={empPadding}
              onChange={(e) => setEmpPadding(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-700">
            المثال: <span className="font-mono font-bold">{preview(empPrefix, empPadding)}</span>
          </span>
        </div>

        <p className="text-[10px] text-slate-500">
          ⚠️ التغيير يؤثر على الموظفين الجدد فقط — الأرقام الحالية لن تتغير.
        </p>
      </div>

      {/* ─── Payroll Numbering ────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">ترقيم مسيرات الرواتب</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">البادئة</label>
            <input
              type="text"
              value={payPrefix}
              onChange={(e) => setPayPrefix(e.target.value.toUpperCase())}
              maxLength={10}
              placeholder="PAY-"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">عدد الأصفار</label>
            <input
              type="number"
              min="1"
              max="10"
              value={payPadding}
              onChange={(e) => setPayPadding(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-700">
            المثال: <span className="font-mono font-bold">{preview(payPrefix, payPadding)}</span>
          </span>
        </div>
      </div>

      {/* ─── Other Prefixes ────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Fingerprint className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">بادئات أخرى</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              بادئة طلبات الإجازة
            </label>
            <input
              type="text"
              value={leavePrefix}
              onChange={(e) => setLeavePrefix(e.target.value.toUpperCase())}
              maxLength={10}
              placeholder="LR-"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              مثال: {preview(leavePrefix, leavePadding)}
            </span>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              بادئة سجلات الحضور
            </label>
            <input
              type="text"
              value={attPrefix}
              onChange={(e) => setAttPrefix(e.target.value.toUpperCase())}
              maxLength={10}
              placeholder="ATT-"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              مثال: {preview(attPrefix, attPadding)}
            </span>
          </div>
        </div>
      </div>

      {/* Save */}
      {hasPermission('settings.update') && (
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
};