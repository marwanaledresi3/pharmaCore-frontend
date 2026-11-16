// types/index.ts

// ═══════════════════════════════════════════════════════════════════════════
// Core entities
// ═══════════════════════════════════════════════════════════════════════════

export interface Role {
  id: string;
  name: string;
  permissions?: any[];
  created_at?: string;
}

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  user_type: string;
  branch_id?: string | null; 
  branch_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
  roles?: Role[];
  permissions?: string[];
  is_super_admin?: boolean;
}

export interface Company {
  id: string;
  name: string;
  name_en?: string | null;
  currency_id: string;
  tax_number?: string | null;
  address?: string | null;
  logo_url?: string | null;
  use_shared_logo?: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  default_markup_percentage?: number;
  currency_code?: string;
  currency_symbol?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_name?: string | null;
  warehouse_id?: string | null;
  warehouse_name?: string;
  is_active: boolean;
  is_main: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  code?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  credit_limit?: number | string;
  account_id?: string | null;
  is_active: boolean;
  created_at?: string;
  balance?: { outstanding: number };
}

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  account_id?: string | null;
  connected_company_id?: string | null;
  is_active: boolean;
  created_at?: string;
  balance?: { outstanding: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// Products
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductUnit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  conversion_factor: number;
  is_base_unit: boolean;
  sale_price?: number | null;
  purchase_price?: number | null;
  min_selling_price?: number | null;
  barcode?: string | null;
}

export interface Product {
  id: string;
  company_id?: string;
  sku: string;
  barcode?: string | null;
  name: string;
  unit: string;
  category?: string | null;
  cost_price: number;
  selling_price: number;
  profit_margin?: number;
  min_stock_level?: number;
  current_stock?: number;
  tax_rate_id?: string | null;
  tax_rate_name?: string | null;
  tax_rate_value?: number | null;
  base_unit_id?: string | null;
  base_unit_code?: string;
  base_unit_name?: string;
  is_active?: boolean;
  created_at?: string;

  // B2B / network
  wholesale_price?: number;
  available_quantity?: number;
  reserved_quantity?: number;
  company_name?: string;
  is_network_product?: boolean;
  supplier_product_id?: string;
  quantity?: number;
  total_quantity?: number;
  live_batch_number?: string;
  live_expiry_date?: string;

  // الوحدات
  units?: ProductUnit[];

  // الدفعات
  batches?: Array<{
    batch_number?: string;
    expiry_date?: string;
    cost_price?: number | string;
    quantity?: number | string;
  }>;

  // Global product
  global_product_id?: string | null;
  global_name?: string;
  global_name_en?: string;
  global_scientific_name?: string;
  global_active_ingredient?: string;
  global_dosage_form?: string;
  global_strength?: string;
  global_product_type?: string;
  global_is_verified?: boolean;
  global_status?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  manager: string | null;
  phone: string | null;
  location: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
}

export interface Batch {
  id: string;
  company_id: string;
  product_id: string;
  warehouse_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number | string;
  cost_price: number | string;
  product_name?: string;
  sku?: string;
  warehouse_name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Purchase Orders
// ═══════════════════════════════════════════════════════════════════════════

export interface PurchaseOrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;

  quantity: number;
  paid_quantity?: number;
  bonus_quantity?: number;
  unit_price: number;
  discount_rate?: number;
  discount_amount?: number;
  net_unit_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;

  batch_number?: string | null;
  expiry_date?: string | null;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;
  unit_name?: string;
  unit_code?: string;
  base_quantity?: number;
}

export interface PurchaseOrder {
  id: string;
  order_number: string | number;
  supplier_id: string;
  supplier_name?: string;
  currency_id: string;
  currency_code?: string;
  exchange_rate?: number;
  order_date: string;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'rejected'
    | 'confirmed'
    | 'cancelled';
  created_at?: string;
  items?: PurchaseOrderItem[];

  // الدفع
  payment_type?: 'cash' | 'credit' | 'partial';
  payment_method?:
    | 'cash'
    | 'bank'
    | 'cheque'
    | 'card'
    | 'wallet'
    | 'other'
    | null;
  payment_terms_days?: number;
  due_date?: string | null;
  paid_amount?: number;
  paid_at?: string | null;

  supplier_invoice_number?: string | null;
  supplier_invoice_date?: string | null;

  // الشبكة
  supplier_company_id?: string | null;
  buyer_company_id?: string;
  buyer_company_name?: string;
  supplier_company_name?: string;

  // تدقيق
  rejection_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  approved_by?: string | null;
  rejected_by?: string | null;
  created_by?: string | null;
  created_by_name?: string;
  updated_at?: string | null;
  journal_entry_id?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sales Orders
// ═══════════════════════════════════════════════════════════════════════════

export interface SalesOrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;

  quantity: number;
  paid_quantity?: number;
  bonus_quantity?: number;
  unit_price: number;
  discount_rate?: number;
  discount_amount?: number;
  net_unit_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;

  batch_id?: string | null;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;
  unit_name?: string;
  unit_code?: string;
  base_quantity?: number;
}

export interface SalesOrder {
  id: string;
  order_number: string | number;
  customer_id: string;
  customer_name?: string;
  customer_code?: string;
  currency_id: string;
  currency_code?: string;
  exchange_rate?: number;
  order_date: string;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
  status: 'draft' | 'confirmed' | 'invoiced' | 'cancelled';
  created_at?: string;
  items?: SalesOrderItem[];

  // ✅ المستودع
  warehouse_id?: string | null;
  warehouse_name?: string;
  warehouse_code?: string;

  // تدقيق
  created_by?: string | null;
  created_by_name?: string;
  updated_at?: string | null;
  journal_entry_id?: string | null;
  items_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Invoices
// ═══════════════════════════════════════════════════════════════════════════

export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;

  quantity: number;
  bonus_quantity?: number;
  unit_price: number;
  net_unit_price?: number;
  discount_rate?: number;
  discount_amount?: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;

  batch_id?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;
  unit_name?: string;
  unit_code?: string;
  base_quantity?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'sales' | 'purchase';   // ✅ المرتجعات في جدول returns
  customer_id?: string | null;
  supplier_id?: string | null;
  party_name?: string;
  party_code?: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate?: number;
  invoice_date: string;
  due_date?: string | null;
  subtotal?: number | string;
  tax_total?: number | string;
  total: number | string;
  paid_amount: number | string;
  balance?: number | string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  reference_type?: 'sales_order' | 'purchase_order' | null;
  reference_id?: string | null;
  journal_entry_id?: string | null;
  created_at?: string;
  items?: InvoiceItem[];
  is_overdue?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Payments
// ═══════════════════════════════════════════════════════════════════════════

export interface Payment {
  id: string;
  voucher_number?: string | null;
  external_reference?: string | null;
  description?: string | null;
  invoice_id?: string | null;
  invoice_number?: string;
  supplier_id?: string | null;
  customer_id?: string | null;
  party_name?: string;
  payment_type: 'receive' | 'pay' | 'refund' | 'credit_apply';   // ✅ كامل
  amount: number | string;
  payment_date: string;
  method: 'cash' | 'bank' | 'cheque' | 'card' | 'wallet' | 'other';
  reference?: string | null;
  journal_entry_id?: string | null;
  currency_id?: string;
  currency_code?: string;
  notes?: string | null;
  refund_of_payment_id?: string | null;
  created_by?: string | null;
  created_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════════════════════════════════════

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  expense_category: string;
  expense_account_id: string;
  description: string;
  amount: number;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate: number;
  payment_type: 'cash' | 'credit' | 'partial';
  payment_method?: 'cash' | 'bank' | 'cheque' | null;
  paid_amount: number;
  due_date?: string | null;
  status: 'draft' | 'posted' | 'partial' | 'paid' | 'cancelled';
  journal_entry_id?: string | null;
  external_reference?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_code?: string;
  account_code?: string;
  account_name?: string;
  remaining_amount?: number;
  created_by?: string | null;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Returns
// ═══════════════════════════════════════════════════════════════════════════

export interface BatchOption {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}

export interface ReturnItem {
  id?: string;
  return_id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;

  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  cost_price?: number;
  discount_rate?: number;
  discount_amount?: number;
  net_unit_price?: number;

  batch_id?: string | null;

  // ✅ الوحدة
  unit_id?: string | null;
  conversion_factor?: number;
  unit_name?: string;
  unit_code?: string;
  base_quantity?: number;

  // ✅ اختياري (فقط في create)
  available_batches?: BatchOption[];
}

export interface ReturnItemRow {
  product_id: string;
  name: string;
  maxQty: number;
  quantity: number;
  unit_price: number;
  available_batches: BatchOption[];
  batch_id: string | null;
}

export interface Return {
  id: string;
  return_number: string;
  return_type: 'sales' | 'purchase';
  invoice_id: string;
  invoice_number?: string;
  party_name?: string;
  party_code?: string;

  customer_id?: string | null;
  supplier_id?: string | null;

  return_date: string;
  reason?: string | null;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
  status: 'draft' | 'confirmed' | 'cancelled';
  currency_id?: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate?: number;
  journal_entry_id?: string | null;
  created_by?: string | null;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  items?: ReturnItem[];
  items_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Accounts
// ═══════════════════════════════════════════════════════════════════════════

export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string | null;
  is_active: boolean;
  children?: Account[];
  level?: number;
  is_postable?: boolean;
  has_children?: boolean;
  has_journal_lines?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Journal Entries
// ═══════════════════════════════════════════════════════════════════════════

export interface JournalEntryLine {
  id?: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  description?: string;
  running_balance?: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string | number;
  entry_date: string;
  description?: string;
  source_type?:
    | 'sales'
    | 'purchase'
    | 'payment'
    | 'expense'
    | 'sale_return'
    | 'purchase_return'
    | 'manual'
    | 'adjustment'
    | 'sales_invoice'
    | 'sale_cogs'
    | 'purchase_payment'
    | 'sales_payment'
    | 'purchase_invoice';
  source_id?: string | null;
  status: 'draft' | 'posted';
  total_debit?: number | string;
  total_credit?: number | string;
  lines_count?: number;
  lines?: JournalEntryLine[];
  created_by?: string | null;
  created_by_name?: string;
  created_at?: string;
  posted_at?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Currency
// ═══════════════════════════════════════════════════════════════════════════

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  is_base?: boolean;
}

export interface ExchangeRate {
  id: string;
  currency_id: string;
  currency_code?: string;
  currency_name?: string;
  rate: number;
  rate_date: string;
  created_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Report
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardReport {
  sales_today: { count: number; amount: string | number };
  sales_month: { count: number; amount: string | number };
  purchases_month: { count: number; amount: string | number };
  receivables: string | number;
  payables: string | number;
  cash_balance: string | number;
  bank_balance: string | number;
  low_stock_count: number;
  expiring_batches_count: number;
  overdue_invoices: { count: number; amount: string | number };
  returns_month: { count: number; amount: string | number };
}

// ═══════════════════════════════════════════════════════════════════════════
// B2B
// ═══════════════════════════════════════════════════════════════════════════

export interface CompanyConnection {
  id: string;
  requester_company_id: string;
  receiver_company_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;

  connected_company_id?: string;
  connected_company_name?: string;
  connected_company_email?: string | null;
  connected_company_phone?: string | null;
  connected_company_address?: string | null;
  connected_company_city?: string | null;
  connected_company_country?: string | null;
  connected_company_tax_number?: string | null;
  connected_company_logo_url?: string | null;

  direction?: 'sent' | 'received';
  requester_company?: {
    id: string;
    name: string;
    tax_number?: string;
    phone?: string;
  };
  receiver_company?: {
    id: string;
    name: string;
    tax_number?: string;
    phone?: string;
  };
}

export interface RegisteredCompanyItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  tax_number?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  created_at?: string;

  business_type?:
    | 'manufacturer'
    | 'distributor'
    | 'warehouse'
    | 'pharmacy'
    | string;
  business_type_label?: string;
  verified?: boolean;
  rating?: number;
  products_count?: number;

  connection_status?: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
  connection_id?: string | null;
  connection_direction?: 'sent' | 'received' | null;

  is_from_database?: boolean;
  source?:
    | 'database_suppliers'
    | 'database_customers'
    | 'mock'
    | string;
}

export interface CompanyPost {
  id: string;
  company_id: string;
  company_name?: string;
  title: string;
  content: string;
  media_url?: string | null;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
  user_has_liked?: boolean;
  company?: { id: string; name: string };
}

export interface PostComment {
  id: string;
  post_id: string;
  company_id?: string;
  company_name?: string;
  comment_text: string;
  created_at: string;
  user?: { id: string; name: string };
  company?: { id: string; name: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// Global Products
// ═══════════════════════════════════════════════════════════════════════════

export interface GlobalProduct {
  id: string;
  barcode?: string | null;
  sku?: string | null;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  scientific_name?: string | null;
  active_ingredient?: string | null;
  dosage_form?: string | null;
  strength?: string | null;
  product_type?:
    | 'drug'
    | 'supplement'
    | 'cosmetic'
    | 'food'
    | 'device'
    | 'herbal'
    | 'veterinary'
    | 'other';
  manufacturer?: string | null;
  manufacturer_country?: string | null;
  marketing_company?: string | null;
  unit: string;
  category?: string | null;
  requires_prescription?: boolean;
  is_controlled?: boolean;
  is_otc?: boolean;
  is_verified: boolean;
  status?: 'active' | 'inactive' | 'archived' | 'merged' | 'pending_review';
  image_url?: string | null;
  created_by_company_id?: string;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════════════════════════════════

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationErrorDetail {
  field: string;
  message: string;
}