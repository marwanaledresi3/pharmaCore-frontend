import { request } from './client';
export interface RecentDocument {
  type: 'invoice' | 'payment' | 'expense';
  id: string;
  number: string | null;
  date: string;
  amount: number;
  status?: string | null;
  party_name?: string | null;
  created_at: string;
}

// داخل dashboardApi:

export interface DashboardSummary {
  period: { from: string; to: string };
  invoices: { count: number; total: number; paid: number };
  purchase_orders: { count: number; total: number };
  customers_count: number;
  suppliers_count: number;
  stock: { qty: number; value: number };
  low_stock_count: number;
  receivables: number;
  payables: number;
  employees_count: number;
  branches_count: number;
}

export interface ActivityItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table_name: string;
  record_id: string | null;
  created_at: string;
  user_name: string | null;
}

export interface PublicStats {
  companies_count: number;
  global_products_count: number;
  posts_count: number;
}

export const dashboardApi = {
  summary: (period: 'today' | 'week' | 'month' | 'year' = 'month') =>
    request<DashboardSummary>(`/dashboard/summary?period=${period}`),

  recentActivity: (limit = 10) =>
    request<ActivityItem[]>(`/dashboard/recent-activity?limit=${limit}`),

  publicStats: () =>
    request<PublicStats>('/public/stats'),

  recentDocuments: (limit = 4) =>
  request<RecentDocument[]>(`/dashboard/recent-documents?limit=${limit}`),
};