// pages/hr/constants.ts
import { EmployeeStatus, EmploymentType, AttendanceStatus } from '../../types/hr';

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'نشط',
  on_leave: 'في إجازة',
  suspended: 'موقوف',
  terminated: 'منتهي الخدمة',
  resigned: 'مستقيل',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_leave: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  resigned: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد',
  intern: 'متدرب',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  leave: 'إجازة',
  holiday: 'عطلة',
  weekend: 'نهاية الأسبوع',
  remote: 'عن بُعد',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent: 'bg-rose-50 text-rose-700 border-rose-200',
  late: 'bg-amber-50 text-amber-700 border-amber-200',
  leave: 'bg-blue-50 text-blue-700 border-blue-200',
  holiday: 'bg-slate-100 text-slate-600 border-slate-200',
  weekend: 'bg-slate-100 text-slate-500 border-slate-200',
  remote: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const GENDER_LABELS = {
  male: 'ذكر',
  female: 'أنثى',
} as const;

export const MARITAL_STATUS_LABELS = {
  single: 'أعزب',
  married: 'متزوج',
  divorced: 'مطلق',
  widowed: 'أرمل',
} as const;

export const LEAVE_STATUS_LABELS = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  cancelled: 'ملغى',
} as const;

export const LEAVE_STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

export const PAYROLL_STATUS_LABELS = {
  draft: 'مسودة',
  approved: 'معتمد',
  paid: 'مدفوع',
  cancelled: 'ملغى',
} as const;

export const PAYROLL_STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  approved: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
} as const;

// ═══════════════════════════════════════════════════════════════
// HR Navigation Tabs (داخل صفحة HR)
// ═══════════════════════════════════════════════════════════════

export interface HRTab {
  id: string;
  label: string;
  permission?: string;
}

// في HR_TABS — أضف:
export const HR_TABS: HRTab[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'employees', label: 'الموظفون', permission: 'employees.view' },
  { id: 'departments', label: 'الأقسام', permission: 'departments.view' },
  { id: 'job-titles', label: 'المسميات الوظيفية', permission: 'job_titles.view' },
  { id: 'attendance', label: 'الحضور والانصراف', permission: 'attendance.view' },
  { id: 'leave-types', label: 'أنواع الإجازات', permission: 'leave_types.view' },
  { id: 'leave-requests', label: 'طلبات الإجازة', permission: 'leave_requests.view' },
  { id: 'leave-balances', label: 'أرصدة الإجازات', permission: 'leave_balances.view' },
  { id: 'payroll', label: 'مسيرات الرواتب', permission: 'payroll.view' },
  { id: 'reports', label: 'التقارير', permission: 'reports.view_financial' },  // 🆕
];