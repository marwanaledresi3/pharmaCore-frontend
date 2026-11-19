// types/hr.ts
// ═══════════════════════════════════════════════════════════════════════════
// HR Types — تكامل مع الباك إند
// ═══════════════════════════════════════════════════════════════════════════

// ─── Departments ─────────────────────────────────────────────────────
export interface Department {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  parent_id?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  parent_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ─── Job Titles ──────────────────────────────────────────────────────
export interface JobTitle {
  id: string;
  company_id: string;
  name: string;
  department_id?: string | null;
  department_name?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Employees ───────────────────────────────────────────────────────
export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated' | 'resigned';

export interface Employee {
  id: string;
  company_id: string;
  user_id?: string | null;
  employee_number: string;
  full_name: string;
  full_name_en?: string | null;
  national_id?: string | null;
  passport_number?: string | null;
  nationality?: string | null;
  gender?: Gender | null;
  birth_date?: string | null;
  marital_status?: MaritalStatus | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hire_date: string;
  termination_date?: string | null;
  department_id?: string | null;
  job_title_id?: string | null;
  manager_id?: string | null;
  branch_id?: string | null;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  currency_id?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  iban?: string | null;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  salary_account_id?: string | null;
  created_at: string;
  updated_at: string;

  // joined fields (من API list)
  department_name?: string | null;
  job_title_name?: string | null;
  branch_name?: string | null;
}

// ─── Leave Types ─────────────────────────────────────────────────────
export interface LeaveType {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  annual_days: number;
  is_paid: boolean;
  requires_approval: boolean;
  carry_over_allowed: boolean;
  is_sick_leave: boolean;
  max_carry_over_days: number;
  is_active: boolean;
  created_at: string;
}

// ─── Leave Requests ──────────────────────────────────────────────────
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  company_id: string;
  employee_id: string;
  employee_number?: string;
  full_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  is_paid?: boolean;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string | null;
  status: LeaveRequestStatus;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

// ─── Leave Balances ──────────────────────────────────────────────────
export interface LeaveBalance {
  id: string;
  company_id: string;
  employee_id: string;
  employee_number?: string;
  full_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  year: number;
  entitled_days: number;
  used_days: number;
  carried_days: number;
  available_days?: number; // computed
}

// ─── Attendance ──────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'weekend' | 'remote';

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  employee_number?: string;
  full_name?: string;
  department_name?: string;
  work_date: string;
  check_in?: string | null;
  check_out?: string | null;
  worked_hours?: number | null;
  overtime_hours: number;
  late_minutes: number;
  early_leave_min: number;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
}

// ─── Payroll ─────────────────────────────────────────────────────────
export type PayrollRunStatus = 'draft' | 'approved' | 'paid' | 'cancelled';

export interface PayrollRun {
  id: string;
  company_id: string;
  run_number: string;
  period_year: number;
  period_month: number;
  payment_date: string;
  status: PayrollRunStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  journal_entry_id?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  company_id: string;
  payroll_run_id: string;
  employee_id: string;
  employee_number?: string;
  full_name?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  overtime_amount: number;
  bonus_amount: number;
  gross_salary: number;
  absence_deduction: number;
  tax_deduction: number;
  social_insurance: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  notes?: string | null;
  // payslip fields
  period_year?: number;
  period_month?: number;
  payment_date?: string;
  run_number?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────
export interface HRDashboardStats {
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  present_today: number;
  absent_today: number;
  pending_leave_requests: number;
  current_month_payroll_total: number;
}

export type { Pagination, PaginatedResult } from './index';