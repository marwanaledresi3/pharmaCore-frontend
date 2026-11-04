import { request } from './client';
import { DashboardReport } from '../types';
async function extract<T = any>(promise: Promise<any>): Promise<T> {
  const res: any = await promise;
  if (res && typeof res === 'object' && 'data' in res && res.success !== undefined) {
    return res.data;
  }
  return res;
}
export const reportsApi = {

  
  getDashboard: async (): Promise<any> => {
  const res: any = await request('/reports/dashboard');
  const data = res?.data ?? res;

  return {
    salesToday: {
      count: Number(data.sales_today?.count || 0),
      amount: Number(data.sales_today?.amount || 0),
    },
    salesMonth: {
      count: Number(data.sales_month?.count || 0),
      amount: Number(data.sales_month?.amount || 0),
    },
    purchasesMonth: {
      count: Number(data.purchases_month?.count || 0),
      amount: Number(data.purchases_month?.amount || 0),
    },
    receivables: { balance: Number(data.receivables || 0) },
    payables: { balance: Number(data.payables || 0) },
    cashBalance: { balance: Number(data.cash_balance || 0) },
    bankBalance: { balance: Number(data.bank_balance || 0) },
    lowStockCount: { count: Number(data.low_stock_count || 0) },
    expiringCount: { count: Number(data.expiring_batches_count || 0) },
    overdueInvoices: {
      count: Number(data.overdue_invoices?.count || 0),
      amount: Number(data.overdue_invoices?.amount || 0),
    },
    returnsMonth: {
      count: Number(data.returns_month?.count || 0),
      amount: Number(data.returns_month?.amount || 0),
    },
  };
},

  getBalanceSheet: async (params?: { date_to?: string }) => {
    return request('/reports/balance-sheet', { params });
  },

  getIncomeStatement: async (params?: { date_from?: string; date_to?: string }) => {
    return request('/reports/income-statement', { params });
  },

  getGeneralLedger: async (params?: { date_from?: string; date_to?: string; account_type?: string }) => {
    return request('/reports/general-ledger', { params });
  },

  getTaxSummary: async (params?: { date_from?: string; date_to?: string }) => {
    return request('/reports/tax-summary', { params });
  },

  getArAging: async (params?: { as_of_date?: string }) => {
    return request('/reports/ar-aging', { params });
  },

  getApAging: async (params?: { as_of_date?: string }) => {
    return request('/reports/ap-aging', { params });
  },

  getSalesReport: async (params?: {
    date_from?: string;
    date_to?: string;
    group_by?: 'day' | 'month' | 'year';
  }): Promise<any> => {
    return extract(request('/reports/sales', { params }));
  },

  getPurchasesReport: async (params?: {
    date_from?: string;
    date_to?: string;
    group_by?: 'day' | 'month' | 'year';
  }): Promise<any> => {
    return extract(request('/reports/purchases', { params }));
  },

   getTopProducts: async (params?: {
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<any> => {
    return extract(request('/reports/top-products', { params }));
  },
  getTrialBalance: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> => {
    return extract(request('/reports/trial-balance', { params }));
  },
  getInventoryReport: async (params?: { warehouse_id?: string }): Promise<any> => {
    return extract(request('/reports/inventory', { params }));
  },
};
