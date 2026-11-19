// pages/settings/sections/HRReportsSection.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3, Save, RefreshCw, AlertCircle, CheckCircle2,
  Download, FileSpreadsheet, Filter, Calendar, Info,
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

export const HRReportsSection: React.FC = () => {
  const { hasPermission } = useAuth();

  // ─── Export Settings ──────────────────────────────────────
  const [defaultFormat, setDefaultFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [includeCompanyHeader, setIncludeCompanyHeader] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  // ─── Report Defaults ──────────────────────────────────────
  const [defaultPeriod, setDefaultPeriod] = useState<'current_month' | 'last_month' | 'current_year' | 'custom'>('current_month');
  const [defaultEmployeesScope, setDefaultEmployeesScope] = useState<'all' | 'active' | 'on_leave'>('active');

  // ─── Attendance Report ────────────────────────────────────
  const [attendanceIncludeWeekends, setAttendanceIncludeWeekends] = useState(false);
  const [attendanceIncludeAbsent, setAttendanceIncludeAbsent] = useState(true);

  // ─── Leave Report ─────────────────────────────────────────
  const [leaveIncludeCancelled, setLeaveIncludeCancelled] = useState(false);

  // ─── Payroll Report ───────────────────────────────────────
  const [payrollIncludeDrafts, setPayrollIncludeDrafts] = useState(false);

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

      setDefaultFormat(all.hr_reports_default_format ?? 'csv');
      setIncludeCompanyHeader(all.hr_reports_include_company_header ?? true);
      setIncludeLogo(all.hr_reports_include_logo ?? true);
      setIncludePageNumbers(all.hr_reports_include_page_numbers ?? true);
      setIncludeTimestamp(all.hr_reports_include_timestamp ?? true);

      setDefaultPeriod(all.hr_reports_default_period ?? 'current_month');
      setDefaultEmployeesScope(all.hr_reports_employees_scope ?? 'active');

      setAttendanceIncludeWeekends(all.hr_reports_attendance_include_weekends ?? false);
      setAttendanceIncludeAbsent(all.hr_reports_attendance_include_absent ?? true);

      setLeaveIncludeCancelled(all.hr_reports_leave_include_cancelled ?? false);

      setPayrollIncludeDrafts(all.hr_reports_payroll_include_drafts ?? false);
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
        hr_reports_default_format: defaultFormat,
        hr_reports_include_company_header: includeCompanyHeader,
        hr_reports_include_logo: includeLogo,
        hr_reports_include_page_numbers: includePageNumbers,
        hr_reports_include_timestamp: includeTimestamp,

        hr_reports_default_period: defaultPeriod,
        hr_reports_employees_scope: defaultEmployeesScope,

        hr_reports_attendance_include_weekends: attendanceIncludeWeekends,
        hr_reports_attendance_include_absent: attendanceIncludeAbsent,

        hr_reports_leave_include_cancelled: leaveIncludeCancelled,

        hr_reports_payroll_include_drafts: payrollIncludeDrafts,
      });
      setSuccess('✅ تم حفظ إعدادات التقارير');
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

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-black text-slate-900">إعدادات تقارير الموارد البشرية</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          التنسيق الافتراضي، التصدير، والفلاتر الافتراضية
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

      {/* ─── Export Format ──────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Download className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">تنسيق التصدير الافتراضي</h4>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-2">
            الصيغة الافتراضية عند النقر على "تصدير"
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setDefaultFormat(fmt)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  defaultFormat === fmt
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {fmt === 'csv' && 'CSV'}
                {fmt === 'xlsx' && 'Excel (XLSX)'}
                {fmt === 'pdf' && 'PDF'}
              </button>
            ))}
          </div>
          {defaultFormat === 'xlsx' && (
            <p className="text-[10px] text-amber-700 mt-2">
              ⚠️ Excel يتطلب مكتبة `xlsx` في الباك إند. تأكد من تثبيتها.
            </p>
          )}
          {defaultFormat === 'pdf' && (
            <p className="text-[10px] text-amber-700 mt-2">
              ⚠️ PDF يتطلب خدمة `pdfService` في الباك إند. تأكد من تثبيتها.
            </p>
          )}
        </div>
      </div>

      {/* ─── Export Options ─────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">خيارات التصدير</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="تضمين ترويسة الشركة"
            description="اسم الشركة، الرقم الضريبي، العنوان في أعلى التقرير"
            checked={includeCompanyHeader}
            onChange={setIncludeCompanyHeader}
          />
          <ToggleRow
            label="تضمين شعار الشركة"
            description="شعار الشركة في الترويسة"
            checked={includeLogo}
            onChange={setIncludeLogo}
          />
          <ToggleRow
            label="تضمين أرقام الصفحات"
            description="ترقيم الصفحات في أسفل كل صفحة"
            checked={includePageNumbers}
            onChange={setIncludePageNumbers}
          />
          <ToggleRow
            label="تضمين التاريخ والوقت"
            description="تاريخ ووقت إنتاج التقرير في التذييل"
            checked={includeTimestamp}
            onChange={setIncludeTimestamp}
          />
        </div>
      </div>

      {/* ─── Default Period & Scope ─────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">الفترة والنطاق الافتراضيان</h4>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            الفترة الزمنية الافتراضية
          </label>
          <select
            value={defaultPeriod}
            onChange={(e) => setDefaultPeriod(e.target.value as any)}
            className="w-full max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="current_month">الشهر الحالي</option>
            <option value="last_month">الشهر السابق</option>
            <option value="current_year">السنة الحالية</option>
            <option value="custom">اختيار مخصص</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            عند فتح أي تقرير، سيتم عرض هذه الفترة افتراضياً.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            نطاق الموظفين الافتراضي
          </label>
          <select
            value={defaultEmployeesScope}
            onChange={(e) => setDefaultEmployeesScope(e.target.value as any)}
            className="w-full max-w-xs rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الموظفين</option>
            <option value="active">النشطون فقط</option>
            <option value="on_leave">النشطون + في إجازة</option>
          </select>
        </div>
      </div>

      {/* ─── Attendance Report ──────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">تقرير الحضور</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="تضمين أيام العطل الأسبوعية"
            description="عرض أيام الجمعة/السبت في التقرير (بدلاً من تخطيها)"
            checked={attendanceIncludeWeekends}
            onChange={setAttendanceIncludeWeekends}
          />
          <ToggleRow
            label="تضمين الغائبين"
            description="عرض الموظفين الذين لم يسجّلوا حضوراً (status = absent)"
            checked={attendanceIncludeAbsent}
            onChange={setAttendanceIncludeAbsent}
          />
        </div>
      </div>

      {/* ─── Leave Report ───────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">تقرير الإجازات</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="تضمين الطلبات الملغاة"
            description="عرض الطلبات بحالة cancelled في التقرير"
            checked={leaveIncludeCancelled}
            onChange={setLeaveIncludeCancelled}
          />
        </div>
      </div>

      {/* ─── Payroll Report ─────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">تقرير الرواتب</h4>
        </div>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="تضمين المسيرات المسودة"
            description="عرض مسيرات رواتب لم تُرحّل بعد (draft)"
            checked={payrollIncludeDrafts}
            onChange={setPayrollIncludeDrafts}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">ملاحظة</p>
          <p className="leading-relaxed">
            هذه الإعدادات تُطبَّق على <strong>التقارير الجديدة</strong> فقط.
            يمكن للمستخدم تجاوزها في كل تقرير على حدة من صفحة التقارير.
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