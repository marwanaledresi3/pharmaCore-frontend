// pages/hr/reports/HRReportsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Download, Users, Calendar, Wallet, RefreshCw, Filter,
  FileSpreadsheet, FileText, AlertCircle, CheckCircle2, Info,
} from 'lucide-react';
import { employeesApi } from '../../../api/hr/employeesApi';
import { leaveRequestsApi } from '../../../api/hr/leavesApi';
import { payrollApi } from '../../../api/hr/payrollApi';
import { departmentsApi } from '../../../api/hr/departmentsApi';
import { attendanceApi } from '../../../api/hr/attendanceApi';
import { settingsApi } from '../../../api/settingsApi';
import { Employee, Department } from '../../../types/hr';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { formatMoney, formatDate, formatHours, todayISO, monthName } from '../utils';
import { EMPLOYEE_STATUS_LABELS, PAYROLL_STATUS_LABELS } from '../constants';
import { hrReportsApi } from '../../../api/hr/reportsApi'
// ═══════════════════════════════════════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════════════════════════════════════
type ReportType = 'employees' | 'attendance' | 'leaves' | 'payroll';
type ExportFormat = 'csv' | 'xlsx' | 'pdf';
type PeriodDefault = 'current_month' | 'last_month' | 'current_year' | 'custom';
type EmployeesScope = 'all' | 'active' | 'on_leave';

interface ReportSettings {
  default_format: ExportFormat;
  include_company_header: boolean;
  include_logo: boolean;
  include_page_numbers: boolean;
  include_timestamp: boolean;
  default_period: PeriodDefault;
  employees_scope: EmployeesScope;
  attendance_include_weekends: boolean;
  attendance_include_absent: boolean;
  leave_include_cancelled: boolean;
  payroll_include_drafts: boolean;
}

const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  default_format: 'csv',
  include_company_header: true,
  include_logo: true,
  include_page_numbers: true,
  include_timestamp: true,
  default_period: 'current_month',
  employees_scope: 'active',
  attendance_include_weekends: false,
  attendance_include_absent: true,
  leave_include_cancelled: false,
  payroll_include_drafts: false,
};

const REPORTS = [
  { id: 'employees',  label: 'الموظفون', icon: <Users className="w-4 h-4" /> },
  { id: 'attendance', label: 'الحضور',   icon: <Calendar className="w-4 h-4" /> },
  { id: 'leaves',     label: 'الإجازات', icon: <Calendar className="w-4 h-4" /> },
  { id: 'payroll',    label: 'الرواتب',  icon: <Wallet className="w-4 h-4" /> },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers — التاريخ والفترة
// ═══════════════════════════════════════════════════════════════════════════
const getPeriodFromDefault = (period: PeriodDefault, now = new Date()) => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  switch (period) {
    case 'current_month':
      return { year: currentYear, month: currentMonth };
    case 'last_month':
      return currentMonth === 1
        ? { year: currentYear - 1, month: 12 }
        : { year: currentYear, month: currentMonth - 1 };
    case 'current_year':
      return { year: currentYear, month: currentMonth };
    default:
      return { year: currentYear, month: currentMonth };
  }
};

const getDateRange = (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate, lastDay };
};

const formatTimestamp = (includeTime = true) => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  if (!includeTime) return date;
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `${date}_${time}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// CSV / Excel Export
// ═══════════════════════════════════════════════════════════════════════════
const exportToCsv = (
  rows: any[],
  headers: string[],
  filename: string,
  options: { includeHeader?: boolean; headerRow?: string } = {}
) => {
  if (rows.length === 0) return;

  const lines: string[] = [];

  // ترويسة الشركة
  if (options.includeHeader && options.headerRow) {
    lines.push(`"${options.headerRow}"`);
    lines.push(''); // سطر فارغ
  }

  // رأس الجدول
  lines.push(headers.map((h) => `"${h}"`).join(','));

  // البيانات
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }

  const csv = '\uFEFF' + lines.join('\n'); // BOM للعربية
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
export const HRReportsPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  // ─── Settings ───────────────────────────────────────────────
  const [reportSettings, setReportSettings] = useState<ReportSettings>(DEFAULT_REPORT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ─── Report State ───────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>('employees');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  // ─── Filters ────────────────────────────────────────────────
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  // ═══════════════════════════════════════════════════════════════════
  // Load settings
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const all = await settingsApi.getAll();

        const s: ReportSettings = {
          default_format:                 all.hr_reports_default_format ?? 'csv',
          include_company_header:         all.hr_reports_include_company_header ?? true,
          include_logo:                   all.hr_reports_include_logo ?? true,
          include_page_numbers:           all.hr_reports_include_page_numbers ?? true,
          include_timestamp:              all.hr_reports_include_timestamp ?? true,
          default_period:                 all.hr_reports_default_period ?? 'current_month',
          employees_scope:                all.hr_reports_employees_scope ?? 'active',
          attendance_include_weekends:    all.hr_reports_attendance_include_weekends ?? false,
          attendance_include_absent:      all.hr_reports_attendance_include_absent ?? true,
          leave_include_cancelled:        all.hr_reports_leave_include_cancelled ?? false,
          payroll_include_drafts:         all.hr_reports_payroll_include_drafts ?? false,
        };

        setReportSettings(s);
        setSettingsLoaded(true);

        // تطبيق الفترة الافتراضية
        const period = getPeriodFromDefault(s.default_period);
        setYear(period.year);
        setMonth(period.month);
      } catch {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
    departmentsApi.list().then(setDepartments).catch(() => {});
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Load data based on reportType + filters
  // ═══════════════════════════════════════════════════════════════════
  const load = async () => {
    setIsLoading(true);
    setError(null);
    setData([]);

    try {
      const { startDate, endDate } = getDateRange(year, month);

      switch (reportType) {
        case 'employees': {
          // تطبيق نطاق الموظفين
          const scope = reportSettings.employees_scope;
          const statusParam =
            scope === 'active' ? 'active' :
            scope === 'on_leave' ? 'on_leave' :
            undefined; // 'all'

          const res = await employeesApi.list({
            department_id: departmentId || undefined,
            status: statusParam,
            limit: 500,
          });
          setData(res.items);
          break;
        }

        case 'attendance': {
          const res = await attendanceApi.list({
            date_from: startDate,
            date_to: endDate,
            limit: 1000,
          });
          setData(res.items);
          break;
        }

        case 'leaves': {
          const res = await leaveRequestsApi.list({
            date_from: startDate,
            date_to: endDate,
            limit: 500,
          });
          setData(res.items);
          break;
        }

        case 'payroll': {
          const res = await payrollApi.list({ limit: 100 });
          setData(res.items);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحميل التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تحميل عند تغيير الفلاتر أو الإعدادات
  useEffect(() => {
    if (settingsLoaded) load();
  }, [reportType, year, month, departmentId, settingsLoaded]);

  // ═══════════════════════════════════════════════════════════════════
  // Filtered data (تُطبق إعدادات التقارير)
  // ═══════════════════════════════════════════════════════════════════
  const filteredData = useMemo(() => {
    if (reportType === 'attendance') {
      let result = [...data];

      // استبعاد الغائبين إذا كان الإعداد معطلاً
      if (!reportSettings.attendance_include_absent) {
        result = result.filter((r) => r.status !== 'absent');
      }

      // استبعاد أيام العطل إذا كان الإعداد معطلاً
      if (!reportSettings.attendance_include_weekends) {
        result = result.filter((r) => r.status !== 'weekend' && r.status !== 'holiday');
      }

      return result;
    }

    if (reportType === 'leaves') {
      let result = [...data];
      if (!reportSettings.leave_include_cancelled) {
        result = result.filter((r) => r.status !== 'cancelled');
      }
      return result;
    }

    if (reportType === 'payroll') {
      let result = [...data];
      if (!reportSettings.payroll_include_drafts) {
        result = result.filter((r) => r.status !== 'draft');
      }
      return result;
    }

    return data;
  }, [data, reportType, reportSettings]);

  

// ═══════════════════════════════════════════════════════════════
// Export — محدّث (PDF عبر /pdf/hr/report)
// ═══════════════════════════════════════════════════════════════
const handleExport = async (format?: ExportFormat) => {
  if (filteredData.length === 0) return;

  const fmt = format || reportSettings.default_format;
  const timestamp = formatTimestamp(reportSettings.include_timestamp);
  const filename = `hr-${reportType}-${year}-${String(month).padStart(2, '0')}-${timestamp}`;
  const reportLabel = REPORTS.find((r) => r.id === reportType)?.label || reportType;
  const subtitle = monthName(year, month);

  // بناء headers + rows + columnTypes
  let headers: string[] = [];
  let rows: any[] = [];
  let columnTypes: Record<string, 'arabic' | 'text' | 'number' | 'money' | 'date'> = {};

  switch (reportType) {
    case 'employees':
      headers = ['رقم الموظف', 'الاسم', 'القسم', 'المسمى', 'الهاتف', 'تاريخ التعيين', 'الراتب الأساسي', 'الحالة'];
      rows = filteredData.map((r) => ({
        'رقم الموظف': r.employee_number,
        'الاسم': r.full_name,
        'القسم': r.department_name || '-',
        'المسمى': r.job_title_name || '-',
        'الهاتف': r.phone || '-',
        'تاريخ التعيين': r.hire_date,
        'الراتب الأساسي': r.basic_salary,
        'الحالة': EMPLOYEE_STATUS_LABELS[r.status as keyof typeof EMPLOYEE_STATUS_LABELS] || r.status,
      }));
      columnTypes = {
        'رقم الموظف': 'text',
        'الاسم': 'arabic',
        'القسم': 'arabic',
        'المسمى': 'arabic',
        'الهاتف': 'text',
        'تاريخ التعيين': 'date',
        'الراتب الأساسي': 'money',
        'الحالة': 'arabic',
      };
      break;

    case 'attendance':
      headers = ['الموظف', 'التاريخ', 'الحضور', 'الانصراف', 'ساعات العمل', 'الحالة'];
      rows = filteredData.map((r) => ({
        'الموظف': r.full_name,
        'التاريخ': r.work_date,
        'الحضور': r.check_in || '-',
        'الانصراف': r.check_out || '-',
        'ساعات العمل': r.worked_hours || 0,
        'الحالة': r.status,
      }));
      columnTypes = {
        'الموظف': 'arabic',
        'التاريخ': 'date',
        'الحضور': 'text',
        'الانصراف': 'text',
        'ساعات العمل': 'number',
        'الحالة': 'arabic',
      };
      break;

    case 'leaves':
      headers = ['الموظف', 'النوع', 'من', 'إلى', 'الأيام', 'الحالة'];
      rows = filteredData.map((r) => ({
        'الموظف': r.full_name,
        'النوع': r.leave_type_name,
        'من': r.start_date,
        'إلى': r.end_date,
        'الأيام': r.days_count,
        'الحالة': r.status,
      }));
      columnTypes = {
        'الموظف': 'arabic',
        'النوع': 'arabic',
        'من': 'date',
        'إلى': 'date',
        'الأيام': 'number',
        'الحالة': 'arabic',
      };
      break;

    case 'payroll':
      headers = ['رقم المسير', 'الفترة', 'الإجمالي', 'الخصومات', 'الصافي', 'الحالة'];
      rows = filteredData.map((r) => ({
        'رقم المسير': r.run_number,
        'الفترة': `${r.period_month}/${r.period_year}`,
        'الإجمالي': r.total_gross,
        'الخصومات': r.total_deductions,
        'الصافي': r.total_net,
        'الحالة': PAYROLL_STATUS_LABELS[r.status as keyof typeof PAYROLL_STATUS_LABELS] || r.status,
      }));
      columnTypes = {
        'رقم المسير': 'text',
        'الفترة': 'text',
        'الإجمالي': 'money',
        'الخصومات': 'money',
        'الصافي': 'money',
        'الحالة': 'arabic',
      };
      break;
  }

  // ملخص
  const summary: Array<{ label: string; value: string; isTotal?: boolean }> = [];
  if (reportType === 'payroll' && totalPayrollNet > 0) {
    summary.push({
      label: 'إجمالي صافي الرواتب',
      value: formatMoney(totalPayrollNet, currency),
      isTotal: true,
    });
  }
  if (reportType === 'employees') {
    summary.push({
      label: 'عدد الموظفين',
      value: String(filteredData.length),
      isTotal: true,
    });
  }

  try {
    if (fmt === 'csv') {
      exportToCsv(rows, headers, `${filename}.csv`, {
        includeHeader: reportSettings.include_company_header,
        headerRow: company
          ? `${company.name} — ${reportLabel} — ${subtitle}`
          : undefined,
      });
    } else if (fmt === 'xlsx') {
      await hrReportsApi.exportXlsx({
        filename,
        sheets: [{ name: reportLabel, headers, rows }],
      });
    } else if (fmt === 'pdf') {
      await hrReportsApi.exportPdf({
        filename,
        title: reportLabel,
        titleEn: reportLabel,
        subtitle,
        headers,
        rows,
        summary,
        columnTypes,
        currencyCode: currency,
        landscape: headers.length > 5,
      });
    }
  } catch (err: any) {
    console.error('Export failed:', err);
    alert(`فشل التصدير: ${err.message}`);
  }
};

  // ═══════════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════════
  const totalPayrollNet = useMemo(
    () => reportType === 'payroll'
      ? filteredData.reduce((s, r) => s + Number(r.total_net || 0), 0)
      : 0,
    [filteredData, reportType]
  );

  const totalEmployees = useMemo(
    () => reportType === 'employees'
      ? filteredData.length
      : 0,
    [filteredData, reportType]
  );

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  if (!settingsLoaded) {
    return <LoadingSpinner message="جاري تحميل إعدادات التقارير..." fullHeight />;
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">تقارير الموارد البشرية</h1>
          <p className="text-xs text-slate-500 mt-1">
            تقارير تفصيلية للموظفين والحضور والإجازات والرواتب
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export buttons — حسب التنسيق الافتراضي */}
          <button type="button" onClick={() => handleExport()} disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50">
            <Download className="w-4 h-4" />
            تصدير {reportSettings.default_format.toUpperCase()}
          </button>

          {/* Dropdown التنسيقات */}
          <div className="relative group">
            <button type="button" disabled={filteredData.length === 0}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition disabled:opacity-50">
              <Filter className="w-4 h-4" />
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
              <button type="button" onClick={() => handleExport('csv')}
                className="block w-full text-right px-3 py-2 text-xs hover:bg-slate-50 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 inline ml-1" />
                تصدير CSV
              </button>
              <button type="button" onClick={() => handleExport('xlsx')}
                className="block w-full text-right px-3 py-2 text-xs hover:bg-slate-50 whitespace-nowrap">
                <FileSpreadsheet className="w-3.5 h-3.5 inline ml-1" />
                تصدير Excel
              </button>
              <button type="button" onClick={() => handleExport('pdf')}
                className="block w-full text-right px-3 py-2 text-xs hover:bg-slate-50 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 inline ml-1" />
                تصدير PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {REPORTS.map((r) => (
          <button key={r.id} type="button" onClick={() => setReportType(r.id as ReportType)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              reportType === r.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
        {reportType !== 'payroll' && (
          <>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {(reportType === 'attendance' || reportType === 'leaves') && (
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{monthName(year, i + 1)}</option>
                ))}
              </select>
            )}

            {reportType === 'employees' && (
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none">
                <option value="">كل الأقسام</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            )}
          </>
        )}

        <span className="text-[11px] text-slate-500 mr-auto flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3" />
          <span>{filteredData.length} نتيجة</span>
          {totalPayrollNet > 0 && (
            <span className="text-emerald-700 font-bold">
              · إجمالي صافي: <span className="font-mono">{formatMoney(totalPayrollNet, currency)}</span>
            </span>
          )}
          {totalEmployees > 0 && (
            <span className="text-slate-600">
              · {totalEmployees} موظف
            </span>
          )}
        </span>
      </div>

      {/* إعدادات مطبقة — شارة */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
        <Info className="w-3 h-3" />
        <span>الإعدادات المطبقة:</span>
        <span className="px-1.5 py-0.5 bg-slate-100 rounded">
          الفترة: {reportSettings.default_period === 'current_month' ? 'الشهر الحالي' :
            reportSettings.default_period === 'last_month' ? 'الشهر السابق' :
            reportSettings.default_period === 'current_year' ? 'السنة الحالية' : 'مخصص'}
        </span>
        {reportType === 'employees' && (
          <span className="px-1.5 py-0.5 bg-slate-100 rounded">
            النطاق: {reportSettings.employees_scope === 'all' ? 'الكل' :
              reportSettings.employees_scope === 'active' ? 'النشطون' : 'النشطون + إجازة'}
          </span>
        )}
        {reportType === 'attendance' && (
          <>
            {!reportSettings.attendance_include_absent && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">بدون غائبين</span>
            )}
            {!reportSettings.attendance_include_weekends && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">بدون عطل</span>
            )}
          </>
        )}
        {reportType === 'leaves' && !reportSettings.leave_include_cancelled && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">بدون ملغاة</span>
        )}
        {reportType === 'payroll' && !reportSettings.payroll_include_drafts && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">بدون مسودات</span>
        )}
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري تحميل التقرير..." fullHeight />
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="لا توجد بيانات"
            description="لم يتم العثور على أي نتائج للفلاتر المحددة."
            icon={<BarChart3 className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'employees' && <EmployeesTable data={filteredData} currency={currency} />}
            {reportType === 'attendance' && <AttendanceTable data={filteredData} />}
            {reportType === 'leaves' && <LeavesTable data={filteredData} />}
            {reportType === 'payroll' && <PayrollTable data={filteredData} currency={currency} />}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tables
// ═══════════════════════════════════════════════════════════════════════════
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="py-3 px-4 text-right text-[11px]">{children}</th>
);
const TD = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <td className={`py-3 px-4 text-[11px] ${mono ? 'font-mono' : ''} text-slate-700`}>{children}</td>
);

const EmployeesTable = ({ data, currency }: { data: Employee[]; currency: string }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
        <TH>#</TH><TH>الاسم</TH><TH>القسم</TH><TH>المسمى</TH><TH>التعيين</TH><TH>الراتب</TH><TH>الحالة</TH>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.map((e) => (
        <tr key={e.id} className="hover:bg-slate-50/50">
          <TD mono>#{e.employee_number}</TD>
          <TD><span className="font-bold text-slate-900">{e.full_name}</span></TD>
          <TD>{e.department_name || '-'}</TD>
          <TD>{e.job_title_name || '-'}</TD>
          <TD mono>{formatDate(e.hire_date)}</TD>
          <TD mono>{formatMoney(e.basic_salary, currency)}</TD>
          <TD>{EMPLOYEE_STATUS_LABELS[e.status as keyof typeof EMPLOYEE_STATUS_LABELS] || e.status}</TD>
        </tr>
      ))}
    </tbody>
  </table>
);

const AttendanceTable = ({ data }: { data: any[] }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
        <TH>الموظف</TH><TH>التاريخ</TH><TH>الحضور</TH><TH>الانصراف</TH><TH>الساعات</TH><TH>الحالة</TH>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.map((r, i) => (
        <tr key={i} className="hover:bg-slate-50/50">
          <TD><span className="font-bold text-slate-900">{r.full_name || '-'}</span></TD>
          <TD mono>{formatDate(r.work_date)}</TD>
          <TD mono>{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</TD>
          <TD mono>{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</TD>
          <TD mono>{formatHours(r.worked_hours)}</TD>
          <TD>{r.status}</TD>
        </tr>
      ))}
    </tbody>
  </table>
);

const LeavesTable = ({ data }: { data: any[] }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
        <TH>الموظف</TH><TH>النوع</TH><TH>من</TH><TH>إلى</TH><TH>الأيام</TH><TH>الحالة</TH>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.map((r, i) => (
        <tr key={i} className="hover:bg-slate-50/50">
          <TD><span className="font-bold text-slate-900">{r.full_name || '-'}</span></TD>
          <TD>{r.leave_type_name}</TD>
          <TD mono>{formatDate(r.start_date)}</TD>
          <TD mono>{formatDate(r.end_date)}</TD>
          <TD mono>{r.days_count}</TD>
          <TD>{r.status}</TD>
        </tr>
      ))}
    </tbody>
  </table>
);

const PayrollTable = ({ data, currency }: { data: any[]; currency: string }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
        <TH>المسير</TH><TH>الفترة</TH><TH>الدفع</TH><TH>إجمالي</TH><TH>خصومات</TH><TH>صافي</TH><TH>الحالة</TH>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.map((r) => (
        <tr key={r.id} className="hover:bg-slate-50/50">
          <TD mono>#{r.run_number}</TD>
          <TD>{monthName(r.period_year, r.period_month)}</TD>
          <TD mono>{formatDate(r.payment_date)}</TD>
          <TD mono>{formatMoney(r.total_gross, currency)}</TD>
          <TD mono>{formatMoney(r.total_deductions, currency)}</TD>
          <TD mono><strong className="text-emerald-700">{formatMoney(r.total_net, currency)}</strong></TD>
          <TD>{PAYROLL_STATUS_LABELS[r.status as keyof typeof PAYROLL_STATUS_LABELS] || r.status}</TD>
        </tr>
      ))}
    </tbody>
  </table>
);