// api/hr/dashboardApi.ts
import { request } from '../client';

export interface HRDashboardData {
  // Employees
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  new_hires_this_month: number;

  // Attendance (today)
  present_today: number;
  absent_today: number;
  late_today: number;
  attendance_rate: number; // 0-100

  // Leaves
  pending_leave_requests: number;
  approved_this_month: number;

  // Payroll
  current_month_payroll_net: number;
  current_month_payroll_status: string | null;
  last_payroll_date: string | null;

  // Departments breakdown
  departments_breakdown: Array<{
    department_id: string;
    department_name: string;
    employee_count: number;
  }>;

  // Recent activity
  recent_leave_requests: Array<{
    id: string;
    employee_name: string;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    days_count: number;
    status: string;
    created_at: string;
  }>;

  // Attendance trend (last 7 days)
  attendance_trend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

/**
 * ⚠️ هذا endpoint غير موجود في الباك إند الحالي!
 * يجب إضافته في `controllers/DashboardController.js` أو إنشاء `controllers/hr/DashboardController.js`.
 *
 * سأقدّم الكود الكامل للـ backend أدناه (اختياري).
 */
export const hrDashboardApi = {
  getStats: async (): Promise<HRDashboardData> => {
    return request<HRDashboardData>('/hr/dashboard');
  },
};