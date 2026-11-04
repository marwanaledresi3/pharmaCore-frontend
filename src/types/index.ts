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
  is_active: boolean;
  role?: string;
  last_login?: string | null;
  created_at?: string;
  roles?: any[];
  permissions?: string[];
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
  balance?: {
    outstanding: number;
  };
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
  balance?: {
    outstanding: number;
  };
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
  wholesale_price?: number;
  available_quantity?: number;   
  reserved_quantity?: number; 
  profit_margin?: number;
  min_stock_level?: number;
  current_stock?: number;
  tax_rate_id?: string | null;
  tax_rate_name?: string | null;
  tax_rate_value?: number | null;
  is_active?: boolean;
  created_at?: string;

  // B2B / network
  company_name?: string;
  is_network_product?: boolean;
  supplier_product_id?: string;
  quantity?: number;
  total_quantity?: number;
  batches?: Array<{
    batch_number?: string;
    expiry_date?: string;
    cost_price?: number | string;
    quantity?: number | string;
  }>;
  live_batch_number?: string;
  live_expiry_date?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string | null;
  is_active: boolean;
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
  status: 'draft' | 'confirmed' | 'cancelled' | 'pending_approval' | 'rejected' | 'approved';
  created_at?: string;
  items?: PurchaseOrderItem[];
  // حقول الدفع (جديدة)
    payment_type?: 'cash' | 'credit' | 'partial';
  payment_method?: 'cash' | 'bank' | 'cheque' | 'card' | 'wallet' | 'other' | null;
  payment_terms_days?: number;
  due_date?: string | null;
  paid_amount?: number;
  paid_at?: string | null;

  supplier_invoice_number?: string | null;
  supplier_invoice_date?: string | null;

  // حقول شبكية
  supplier_company_id?: string | null;
  buyer_company_id?: string;
  buyer_company_name?: string;
  rejection_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  updated_at?: string | null;
}

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
}

export interface SalesOrder {
  id: string;
  order_number: string | number;
  customer_id: string;
  customer_name?: string;
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
}

export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  batch_number?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'sales' | 'purchase' | 'sales_return' | 'purchase_return';
  customer_id?: string | null;
  supplier_id?: string | null;
  party_name?: string;
  currency_id: string;
  currency_code?: string;
  exchange_rate?: number;
  invoice_date: string;
  due_date?: string | null;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
  paid_amount: number | string;
  balance?: number | string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  created_at?: string;
  items?: InvoiceItem[];
}

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
  payment_type: 'receive' | 'pay';
  amount: number | string;
  payment_date: string;
  method: 'cash' | 'bank' | 'cheque';
  reference?: string | null;
  journal_entry_id?: string | null;
  currency_code?: string;
  created_at?: string;
}
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
  account_code?: string;
  account_name?: string;
  created_at: string;
  updated_at?: string;
}
export interface ReturnItem {
  id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  available_batches: BatchOption[];   // ← جديد
  batch_id: string | null; 
}

export interface Return {
  id: string;
  return_number: string;
  return_type: 'sales' | 'purchase';
  invoice_id: string;
  invoice_number?: string;
  party_name?: string;
  return_date: string;
  reason?: string | null;
  subtotal: number | string;
  tax_total: number | string;
  total: number | string;
  status: 'draft' | 'confirmed' | 'cancelled';
  created_at?: string;
  items?: ReturnItem[];
}
interface BatchOption {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}
interface ReturnItemRow {
  product_id: string;
  name: string;
  maxQty: number;
  quantity: number;
  unit_price: number;
  available_batches: BatchOption[];   // ← جديد
  batch_id: string | null;             // ← مطلوب
}
export interface Account {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string | null;
  is_active: boolean;
  children?: Account[];
  level?: number;
}

export interface JournalEntryLine {
  id?: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string | number;
  entry_date: string;
  description?: string;
  source_type?: 'sales' | 'purchase' | 'payment' | 'manual' | 'adjustment';
  source_id?: string | null;
  status: 'draft' | 'posted';
  total_debit?: number | string;
  total_credit?: number | string;
  lines_count?: number;
  lines?: JournalEntryLine[];
  created_at?: string;
  posted_at?: string | null;
}

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

export interface DashboardReport {
  salesToday: { count: number; amount: string | number };
  salesMonth: { count: number; amount: string | number };
  purchasesMonth: { count: number; amount: string | number };
  receivables: { balance: string | number };
  payables: { balance: string | number };
  cashBalance: { balance: string | number };
  bankBalance: { balance: string | number };
  lowStockCount: { count: number };
  expiringCount: { count: number };
  overdueInvoices: { count: number; amount: string | number };
}

export interface CompanyConnection {
  id: string;
  requester_company_id: string;
  receiver_company_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;

 
// الشركة المتصلة (المعلومات)
    connected_company_id?: string;
  connected_company_name?: string;
  connected_company_email?: string | null;
  connected_company_phone?: string | null;
  connected_company_address?: string | null;
  connected_company_city?: string | null;
  connected_company_country?: string | null;
  connected_company_tax_number?: string | null;
  connected_company_logo_url?: string | null;

  // اتجاه الاتصال
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

  // B2B
  business_type?: 'manufacturer' | 'distributor' | 'warehouse' | 'pharmacy' | string;
  business_type_label?: string;
  verified?: boolean;
  rating?: number;
  products_count?: number;

  // Connection
  connection_status?: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
  connection_id?: string | null;
  connection_direction?: 'sent' | 'received' | null;

  // Flags
  is_from_database?: boolean;
 source?: 'database_suppliers' | 'database_customers' | 'mock' | string;
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
  company?: {
    id: string;
    name: string;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  company_id?: string;
  company_name?: string;
  comment_text: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface GlobalProduct {
  id: string;
  barcode?: string | null;
  sku?: string | null;
  name: string;
  scientific_name?: string | null;
  unit: string;
  category?: string | null;
  created_by_company_id?: string;
  is_verified: boolean;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

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

export interface ValidationErrorDetail {
  field: string;
  message: string;
}
