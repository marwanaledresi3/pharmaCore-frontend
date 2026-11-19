// pages/settings/sections/HRLeavesSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Save, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Users, Shield, FileCheck,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

export const HRLeavesSection: React.FC = () => {
  const { hasPermission } = useAuth();

  const [defaultAnnualDays, setDefaultAnnualDays] = useState(30);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(30);
  const [minNoticeDays, setMinNoticeDays] = useState(1);
  const [maxPendingRequests, setMaxPendingRequests] = useState(5);
  const [requireAttachment, setRequireAttachment] = useState(false);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [autoApproveSick, setAutoApproveSick] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const all = await settingsApi.getAll();
      setDefaultAnnualDays(Number(all.hr_leave_default_annual_days ?? 30));
      setMaxConsecutiveDays(Number(all.hr_leave_max_consecutive_days ?? 30));
      setMinNoticeDays(Number(all.hr_leave_min_notice_days ?? 1));
      setMaxPendingRequests(Number(all.hr_leave_max_pending_requests ?? 5));
      setRequireAttachment(all.hr_leave_require_attachment ?? false);
      setAllowOverlap(all.hr_leave_allow_overlap ?? false);
      setAutoApproveSick(all.hr_leave_auto_approve_sick ?? false);
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
        hr_leave_default_annual_days: defaultAnnualDays,
        hr_leave_max_consecutive_days: maxConsecutiveDays,
        hr_leave_min_notice_days: minNoticeDays,
        hr_leave_max_pending_requests: maxPendingRequests,
        hr_leave_require_attachment: requireAttachment,
        hr_leave_allow_overlap: allowOverlap,
        hr_leave_auto_approve_sick: autoApproveSick,
      });
      setSuccess('✅ تم حفظ إعدادات الإجازات');
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
        <h3 className="text-sm font-black text-slate-900">إعدادات الإجازات</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          الحدود الافتراضية، قواعد الطلب، وسياسة الاعتماد
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

      {/* ─── Defaults ───────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">القيم الافتراضية</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              الإجازة السنوية الافتراضية (أيام)
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={defaultAnnualDays}
              onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              تُستخدم عند إنشاء نوع إجازة جديد
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              أقصى عدد أيام متتالية
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={maxConsecutiveDays}
              onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              حد أقصى في الطلب الواحد
            </p>
          </div>
        </div>
      </div>

      {/* ─── Request Rules ──────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">قواعد الطلب</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              أقل إشعار مسبق (أيام)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={minNoticeDays}
              onChange={(e) => setMinNoticeDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              يجب تقديم الطلب قبل {minNoticeDays} يوم على الأقل
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              أقصى طلبات معلقة
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxPendingRequests}
              onChange={(e) => setMaxPendingRequests(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              لكل موظف في وقت واحد
            </p>
          </div>
        </div>
      </div>

      {/* ─── Policies ───────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">السياسات</h4>
        </div>

        <label className="flex items-center justify-between gap-3 cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 transition">
          <div className="flex-1">
            <span className="block text-xs font-bold text-slate-900">اشتراط مرفق (شهادة طبية)</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              عند التفعيل، يجب رفع مستند مع طلب الإجازة (خاصة المرضية)
            </span>
          </div>
          <input
            type="checkbox"
            checked={requireAttachment}
            onChange={(e) => setRequireAttachment(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 transition">
          <div className="flex-1">
            <span className="block text-xs font-bold text-slate-900">السماح بتداخل الطلبات</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              عند التعطيل، يُرفض أي طلب يتداخل مع طلب آخر معلق أو معتمد
            </span>
          </div>
          <input
            type="checkbox"
            checked={allowOverlap}
            onChange={(e) => setAllowOverlap(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 transition">
          <div className="flex-1">
            <span className="block text-xs font-bold text-slate-900">اعتماد تلقائي للإجازة المرضية</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              عند التفعيل، تُعتمد الإجازات المرضية القصيرة تلقائياً
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoApproveSick}
            onChange={(e) => setAutoApproveSick(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
        <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">ملاحظة</p>
          <p className="leading-relaxed">
            الإعدادات هنا تُطبَّق على الطلبات <strong>الجديدة</strong> فقط.
            الطلبات الحالية لن تتأثر. تفاصيل أنواع الإجازات (سنوية، مرضية، إلخ)
            تُدار من صفحة <strong>"أنواع الإجازات"</strong> في وحدة HR.
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