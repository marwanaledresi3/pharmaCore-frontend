// pages/settings/sections/HRAttendanceSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Clock, Save, RefreshCw, AlertCircle, CheckCircle2, Calendar,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

const WEEK_DAYS = [
  { id: 'saturday', label: 'السبت' },
  { id: 'sunday', label: 'الأحد' },
  { id: 'monday', label: 'الاثنين' },
  { id: 'tuesday', label: 'الثلاثاء' },
  { id: 'wednesday', label: 'الأربعاء' },
  { id: 'thursday', label: 'الخميس' },
  { id: 'friday', label: 'الجمعة' },
];

export const HRAttendanceSection: React.FC = () => {
  const { hasPermission } = useAuth();

  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [standardHours, setStandardHours] = useState(8);
  const [workDays, setWorkDays] = useState(6);
  const [weekendDays, setWeekendDays] = useState<string[]>(['friday']);
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [autoAbsent, setAutoAbsent] = useState(true);
  const [allowRemote, setAllowRemote] = useState(true);
  const [requireLocation, setRequireLocation] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const all = await settingsApi.getAll();
      setWorkStart(all.hr_work_start_time ?? '09:00');
      setWorkEnd(all.hr_work_end_time ?? '17:00');
      setStandardHours(Number(all.hr_standard_work_hours ?? 8));
      setWorkDays(Number(all.hr_work_days_per_week ?? 6));
      setWeekendDays(Array.isArray(all.hr_weekend_days) ? all.hr_weekend_days : ['friday']);
      setGraceMinutes(Number(all.hr_late_grace_minutes ?? 15));
      setOvertimeRate(Number(all.hr_overtime_rate ?? 1.5));
      setAutoAbsent(all.hr_attendance_auto_absent ?? true);
      setAllowRemote(all.hr_attendance_allow_remote ?? true);
      setRequireLocation(all.hr_attendance_require_location ?? false);
      setRequirePhoto(all.hr_attendance_require_photo ?? false);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleWeekend = (dayId: string) => {
    setWeekendDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await settingsApi.updateMany({
        hr_work_start_time: workStart,
        hr_work_end_time: workEnd,
        hr_standard_work_hours: standardHours,
        hr_work_days_per_week: workDays,
        hr_weekend_days: weekendDays,
        hr_late_grace_minutes: graceMinutes,
        hr_overtime_rate: overtimeRate,
        hr_attendance_auto_absent: autoAbsent,
        hr_attendance_allow_remote: allowRemote,
        hr_attendance_require_location: requireLocation,
        hr_attendance_require_photo: requirePhoto,
      });
      setSuccess('✅ تم حفظ إعدادات الحضور');
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
      <div>
        <h3 className="text-sm font-black text-slate-900">إعدادات الحضور والدوام</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          ساعات العمل، أيام الأسبوع، العمل الإضافي، التسجيل التلقائي
        </p>
      </div>

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

      {/* Working Hours */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">ساعات الدوام</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">بداية الدوام</label>
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">نهاية الدوام</label>
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">ساعات معيارية</label>
            <input type="number" min="1" max="24" step="0.5" value={standardHours}
              onChange={(e) => setStandardHours(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">سماح التأخير (دقيقة)</label>
            <input type="number" min="0" max="120" value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Work Week */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">أيام العمل والعطل</h4>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">أيام العمل في الأسبوع</label>
          <select value={workDays} onChange={(e) => setWorkDays(Number(e.target.value))}
            className="w-full max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
            <option value={5}>5 أيام</option>
            <option value={6}>6 أيام</option>
            <option value={7}>7 أيام</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-2">أيام العطلة الأسبوعية</label>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleWeekend(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  weekendDays.includes(d.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            هذه الأيام لن تُحسب ضمن أيام العمل ولن يُسجَّل فيها غياب تلقائي.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">معامل سعر الساعة الإضافية</label>
          <input type="number" min="1" max="5" step="0.1" value={overtimeRate}
            onChange={(e) => setOvertimeRate(Number(e.target.value))}
            className="w-full max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          <p className="text-[10px] text-slate-500 mt-1">
            مثال: 1.5 = الساعة الإضافية = 1.5 × سعر الساعة الأساسي
          </p>
        </div>
      </div>

      {/* Auto Absent */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <h4 className="text-xs font-black text-slate-900">تسجيل الغياب التلقائي</h4>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="block text-xs font-bold text-slate-900">تسجيل غياب تلقائي</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              يسجّل غياباً للموظفين الذين لم يسجّلوا حضوراً في نهاية اليوم
            </span>
          </div>
          <input type="checkbox" checked={autoAbsent} onChange={(e) => setAutoAbsent(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0" />
        </label>
      </div>

      {/* Remote work */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <h4 className="text-xs font-black text-slate-900">العمل عن بُعد</h4>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-slate-700">السماح بالحضور عن بُعد</span>
          <input type="checkbox" checked={allowRemote} onChange={(e) => setAllowRemote(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5" />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-slate-700">اشتراط الموقع الجغرافي (GPS)</span>
          <input type="checkbox" checked={requireLocation} onChange={(e) => setRequireLocation(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5" />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-slate-700">اشتراط صورة (سيلفي)</span>
          <input type="checkbox" checked={requirePhoto} onChange={(e) => setRequirePhoto(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5" />
        </label>
      </div>

      {/* Save */}
      {hasPermission('settings.update') && (
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
};