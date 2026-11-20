// types/custody.ts

export type CustodyKind = 'cash' | 'in_kind' | 'advance';

export type CustodyStatus =
  | 'open'
  | 'partially_settled'
  | 'settled'
  | 'overdue'
  | 'cancelled';

export type CustodyTransactionType =
  | 'issue'
  | 'spend'
  | 'return'
  | 'settle'
  | 'adjustment';

export type AdvanceType = 'salary_advance' | 'loan' | 'emergency';

export type AdvanceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export type InstallmentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';

export interface CustodyType {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  kind: CustodyKind;
  requires_settlement: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CustodyItem {
  id: string;
  custody_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  returned_qty: number;
  consumed_qty: number;
}

export interface CustodyTransaction {
  id: string;
  company_id: string;
  custody_id: string;
  transaction_type: CustodyTransactionType;
  transaction_date: string;
  amount: number;
  expense_category: string | null;
  expense_account_id: string | null;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  journal_entry_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Custody {
  id: string;
  company_id: string;
  custody_number: string;
  custody_type_id: string;
  custody_type_name?: string;
  custody_kind?: CustodyKind;
  holder_employee_id: string;
  amount: number;
  settled_amount?: number;
  remaining_amount?: number;
  currency_id: string | null;
  description: string | null;
  issued_date: string;
  due_date: string | null;
  settled_date: string | null;
  status: CustodyStatus;
  account_id: string | null;
  issue_journal_entry_id: string | null;
  settlement_journal_entry_id: string | null;
  issued_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  items?: CustodyItem[];
  transactions?: CustodyTransaction[];
}

export interface AdvanceInstallment {
  id: string;
  advance_id: string;
  installment_no: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  payroll_run_id: string | null;
  journal_entry_id: string | null;
  status: InstallmentStatus;
}

export interface EmployeeAdvance {
  id: string;
  company_id: string;
  advance_number: string;
  employee_id: string;
  advance_type: AdvanceType;
  amount: number;
  currency_id: string | null;
  exchange_rate: number;
  installments_count: number;
  installment_amount: number;
  paid_amount: number;
  remaining_amount: number;
  request_date: string;
  approval_date: string | null;
  first_installment_date: string | null;
  status: AdvanceStatus;
  receivable_account_id: string | null;
  journal_entry_id: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  installments?: AdvanceInstallment[];
}