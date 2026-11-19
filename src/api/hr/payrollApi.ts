// api/hr/payrollApi.ts
import { request, normalizeList } from '../client';
import { PayrollRun, PayrollItem } from '../../types/hr';
import { PaginatedResult } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════
// Payroll Runs
// ═══════════════════════════════════════════════════════════════════════════

export interface PayrollListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CalculatePayrollPayload {
  year: number;
  month: number;
  payment_date: string;
}

export const payrollApi = {
  list: async (params?: PayrollListParams): Promise<PaginatedResult<PayrollRun>> => {
    const res = await request('/payroll', { params });
    return normalizeList<PayrollRun>(res);
  },

  getOne: async (id: string): Promise<PayrollRun> => {
    return request<PayrollRun>(`/payroll/${id}`);
  },

  calculate: async (payload: CalculatePayrollPayload): Promise<PayrollRun> => {
    return request<PayrollRun>('/payroll', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  post: async (id: string): Promise<PayrollRun> => {
    return request<PayrollRun>(`/payroll/${id}/post`, { method: 'POST', body: JSON.stringify({}) });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request(`/payroll/${id}`, { method: 'DELETE' });
  },

  // ─── Payroll Items (نستدعيها من /payroll/:runId/items) ────────────
  listItems: async (runId: string): Promise<PayrollItem[]> => {
    const res = await request<PayrollItem[]>(`/payroll/${runId}/items`);
    return Array.isArray(res) ? res : [];
  },

  updateItem: async (
    runId: string,
    itemId: string,
    data: Partial<PayrollItem>
  ): Promise<{ item: PayrollItem; totals: { total_gross: number; total_deductions: number; total_net: number } }> => {
    return request(`/payroll/${runId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addBonus: async (runId: string, itemId: string, amount: number): Promise<any> => {
    return request(`/payroll/${runId}/items/${itemId}/bonus`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  deleteItem: async (runId: string, itemId: string): Promise<{ success: boolean }> => {
    return request(`/payroll/${runId}/items/${itemId}`, { method: 'DELETE' });
  },

  // ─── My Payslips (للموظف) ─────────────────────────────────────────
  myPayslips: async (): Promise<PayrollItem[]> => {
    const res = await request<PayrollItem[]>('/payroll/my-payslips');
    return Array.isArray(res) ? res : [];
  },

  myPayslipDetail: async (itemId: string): Promise<PayrollItem> => {
    return request<PayrollItem>(`/payroll/my-payslips/${itemId}`);
  },
};