// pages/settings/sections/HRNotificationsSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Bell, Save, RefreshCw, AlertCircle, CheckCircle2,
  Calendar, Wallet, FileText, UserCheck,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 transition">
    <div className="flex-1 min-w-0">
      <span className="block text-xs font-bold text-slate-900">{label}</span>
      {description && (
        <span className="block text-[10px] text-slate-500 mt-0.5">{description}</span>
      )}
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
    />
  </label>
);

export const HRNotificationsSection: React.FC = () => {
  const { hasPermission } = useAuth();

  // ─── Leave Notifications ──────────────────────────────────
  const [notifyLeaveRequest, setNotifyLeaveRequest] = useState(true);
  const [notifyLeaveApproved, setNotifyLeaveApproved] = useState(true);

  // ─── Payroll Notifications ────────────────────────────────
  const [notifyPayrollReady, setNotifyPayrollReady] = useState(true);

  // ─── Attendance Notifications ─────────────────────────────
  const [notifyAttendanceMissing, setNotifyAttendanceMissing] = useState(true);

  // ─── Contract Notifications ───────────────────────────────
  const [notifyContractExpiry, setNotifyContractExpiry] = useState(true);
  const [contractNotifyDays, setContractNotifyDays] = useState(30);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const all = await settingsApi.getAll();
      setNotifyLeaveRequest(all.hr_notify_leave_request ?? true);
      setNotifyLeaveApproved(all.hr_notify_leave_approved ?? true);
      setNotifyPayrollReady(all.hr_notify_payroll_ready ?? true);
      setNotifyAttendanceMissing(all.hr_notify_attendance_missing ?? true);
      setNotifyContractExpiry(all.hr_notify_contract_expiry ?? true);
      setContractNotifyDays(Number(all.hr_contract_expiry_notify_days ?? 30));
    } catch (err: any) {
      setError(err.message || 'فشل التحميل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await settingsApi.updateMany({
        hr_notify_leave_request: notifyLeaveRequest,
        hr_notify_leave_approved: notifyLeaveApproved,
        hr_notify_payroll_ready: notifyPayrollReady,
        hr_notify_attendance_missing: notifyAttendanceMissing,
        hr_notify_contract_expiry: notifyContractExpiry,
        hr_contract_expiry_notify_days: contractNotifyDays,
      });
      setSuccess('✅ تم حفظ إعدادات الإشعارات');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

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
        <h3 className="text-sm font-black text-slate-900">إشعارات الموارد البشرية</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          تحكم في الإشعارات التي تصل للمستخدمين عند أحداث HR
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

      {/* ─── Leave Notifications ────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">إشعارات الإجازات</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="إشعار عند طلب إجازة جديدة"
            description="يُرسل للمدير المسؤول عند إنشاء طلب إجازة"
            checked={notifyLeaveRequest}
            onChange={setNotifyLeaveRequest}
          />
          <ToggleRow
            label="إشعار عند اعتماد/رفض الإجازة"
            description="يُرسل للموظف عند اعتماد أو رفض طلبه"
            checked={notifyLeaveApproved}
            onChange={setNotifyLeaveApproved}
          />
        </div>
      </div>

      {/* ─── Payroll Notifications ──────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">إشعارات الرواتب</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="إشعار عند جاهزية المسير"
            description="يُرسل للمحاسب/المدير عند حساب مسير رواتب جديد (draft)"
            checked={notifyPayrollReady}
            onChange={setNotifyPayrollReady}
          />
        </div>
      </div>

      {/* ─── Attendance Notifications ───────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">إشعارات الحضور</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="إشعار عند عدم تسجيل الحضور"
            description="يُرسل للموظف نهاية اليوم إذا لم يسجّل حضوره"
            checked={notifyAttendanceMissing}
            onChange={setNotifyAttendanceMissing}
          />
        </div>
      </div>

      {/* ─── Contract Expiry ────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">إشعارات انتهاء العقود</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="تنبيه قبل انتهاء العقد"
            description="يُرسل تنبيه للمدير قبل انتهاء عقود الموظفين"
            checked={notifyContractExpiry}
            onChange={setNotifyContractExpiry}
          />
        </div>
        {notifyContractExpiry && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              عدد الأيام قبل الانتهاء
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={contractNotifyDays}
              onChange={(e) => setContractNotifyDays(Number(e.target.value))}
              className="w-full max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              يُرسل التنبيه قبل {contractNotifyDays} يوم من تاريخ انتهاء العقد
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
        <Bell className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">ملاحظة</p>
          <p className="leading-relaxed">
            هذه الإشعارات تُرسل عبر نظام الإشعارات المركزي. قنوات الإرسال (بريد، SMS، WhatsApp) تُضبط من
            <strong> قسم "الإشعارات" العام </strong>
            في إعدادات النظام.
          </p>
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