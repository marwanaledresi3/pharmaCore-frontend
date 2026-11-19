// pages/settings/sections/HRLeaveBalanceSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Save, RefreshCw, Clock, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { settingsApi, HrJobsStatus } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

export const HRLeaveBalanceSection: React.FC = () => {
  const { hasPermission } = useAuth();

  const [autoReset, setAutoReset] = useState(true);
  const [resetMonth, setResetMonth] = useState(1);
  const [resetDay, setResetDay] = useState(1);
  const [resetHour, setResetHour] = useState(0);
  const [carryOver, setCarryOver] = useState(true);

  const [jobStatus, setJobStatus] = useState<HrJobsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // Load
  // ═══════════════════════════════════════════════════════════════
  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [all, status] = await Promise.all([
        settingsApi.getAll(),
        settingsApi.hrJobsStatus().catch(() => null),
      ]);

      setAutoReset(all.hr_leave_balance_auto_reset ?? true);
      setResetMonth(Number(all.hr_leave_balance_reset_month ?? 1));
      setResetDay(Number(all.hr_leave_balance_reset_day ?? 1));
      setResetHour(Number(all.hr_leave_balance_reset_hour ?? 0));
      setCarryOver(all.hr_leave_balance_carry_over ?? true);
      setJobStatus(status);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ═══════════════════════════════════════════════════════════════
  // Save + reload jobs
  // ═══════════════════════════════════════════════════════════════
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await settingsApi.updateMany({
        hr_leave_balance_auto_reset: autoReset,
        hr_leave_balance_reset_month: resetMonth,
        hr_leave_balance_reset_day: resetDay,
        hr_leave_balance_reset_hour: resetHour,
        hr_leave_balance_carry_over: carryOver,
      });

      // الباك إند يُعيد تحميل jobs تلقائياً، لكن نؤكد
      try {
        await settingsApi.reloadHrJobs();
      } catch { /* silent */ }

      setSuccess('✅ تم حفظ الإعدادات وإعادة تحميل المهام');
      await load(); // reload status
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Manual reload
  // ═══════════════════════════════════════════════════════════════
  const handleReloadJobs = async () => {
    setIsReloading(true);
    setError(null);
    setSuccess(null);
    try {
      await settingsApi.reloadHrJobs();
      setSuccess('✅ تم إعادة تحميل المهام');
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل إعادة التحميل');
    } finally {
      setIsReloading(false);
    }
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

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">إعادة تعيين أرصدة الإجازات</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            يتم إنشاء رصيد جديد لكل موظف في بداية السنة تلقائياً
          </p>
        </div>
        <button
          type="button"
          onClick={handleReloadJobs}
          disabled={isReloading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          title="إعادة تحميل المهام"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
          إعادة تحميل
        </button>
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

      {/* Enable toggle */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="block text-xs font-bold text-slate-900">تفعيل إعادة التعيين التلقائية</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              إذا كان معطلاً، يمكنك إنشاء الأرصدة يدوياً من صفحة الأرصدة
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoReset}
            onChange={(e) => setAutoReset(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      {/* Schedule */}
      {autoReset && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-900">التوقيت</h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الشهر</label>
              <select
                value={resetMonth}
                onChange={(e) => setResetMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {months.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">اليوم</label>
              <input
                type="number"
                min="1"
                max="28"
                value={resetDay}
                onChange={(e) => setResetDay(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الساعة (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={resetHour}
                onChange={(e) => setResetHour(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[11px] text-emerald-900">
              سيعمل تلقائياً في <strong>{resetDay}/{resetMonth}</strong> الساعة <strong>{String(resetHour).padStart(2, '0')}:05</strong> من كل سنة
            </span>
          </div>
        </div>
      )}

      {/* Carry over */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="block text-xs font-bold text-slate-900">ترحيل الرصيد المتبقي</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              يُرحّل الرصيد غير المستخدم من السنة السابقة (بحد أقصى حسب نوع الإجازة)
            </span>
          </div>
          <input
            type="checkbox"
            checked={carryOver}
            onChange={(e) => setCarryOver(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      {/* Job Status */}
      {jobStatus && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-700" />
            <h4 className="text-xs font-black text-blue-900">حالة المهمة</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-blue-600 block text-[10px]">الحالة</span>
              <span className={`font-bold ${jobStatus.enabled ? 'text-emerald-700' : 'text-rose-700'}`}>
                {jobStatus.enabled ? '✅ مفعّلة' : '⏸️ معطّلة'}
              </span>
            </div>
            <div>
              <span className="text-blue-600 block text-[10px]">الجدولة</span>
              <span className="font-bold text-blue-900">{jobStatus.schedule}</span>
            </div>
            <div className="col-span-2">
              <span className="text-blue-600 block text-[10px]">التشغيل القادم</span>
              <span className="font-bold text-blue-900 font-mono">
                {new Date(jobStatus.next_run).toLocaleString('ar-EG', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

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