import { request, downloadPdfBlob, openPdfInNewTab } from './client';

export const pdfApi = {
  getInvoicePdfBlob: async (invoiceId: string): Promise<Blob> => {
    return request<Blob>(`/pdf/invoice/${invoiceId}`, {
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  getReturnPdfBlob: async (returnId: string): Promise<Blob> => {
    return request<Blob>(`/pdf/return/${returnId}`, {
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  getStatementPdfBlob: async (customerId: string): Promise<Blob> => {
    return request<Blob>(`/pdf/statement/${customerId}`, {
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  getSalesReportPdfBlob: async (params?: { date_from?: string; date_to?: string; group_by?: string }): Promise<Blob> => {
    return request<Blob>('/pdf/report/sales', {
      params,
      headers: {
        Accept: 'application/pdf',
      },
    });
  },

  downloadInvoicePdf: async (invoiceId: string, invoiceNumber: string) => {
    const blob = await pdfApi.getInvoicePdfBlob(invoiceId);
    await downloadPdfBlob(blob, `invoice-${invoiceNumber}.pdf`);
  },

  openInvoicePdf: async (invoiceId: string) => {
    const blob = await pdfApi.getInvoicePdfBlob(invoiceId);
    await openPdfInNewTab(blob);
  },

  downloadReturnPdf: async (returnId: string, returnNumber: string) => {
    const blob = await pdfApi.getReturnPdfBlob(returnId);
    await downloadPdfBlob(blob, `return-${returnNumber}.pdf`);
  },

  openReturnPdf: async (returnId: string) => {
    const blob = await pdfApi.getReturnPdfBlob(returnId);
    await openPdfInNewTab(blob);
  },

  downloadStatementPdf: async (customerId: string, customerName: string) => {
    const blob = await pdfApi.getStatementPdfBlob(customerId);
    await downloadPdfBlob(blob, `statement-${customerName}.pdf`);
  },

  openStatementPdf: async (customerId: string) => {
    const blob = await pdfApi.getStatementPdfBlob(customerId);
    await openPdfInNewTab(blob);
  },

   /**
   * معاينة PDF لمصروف (يفتح في نافذة/تاب جديد)
   */
 previewExpense: async (id: string) => {
  const blob = await fetchPdfBlob(`/pdf/expenses/${id}`);
  openBlob(blob, `expense-${id}`);
},

downloadExpensePdf: async (id: string, expenseNumber?: string) => {
  const blob = await fetchPdfBlob(`/pdf/expenses/${id}`);
  downloadBlob(blob, `expense-${expenseNumber || id.slice(0, 8)}`);
},
};


/**
 * يفتح Blob في تبويب جديد.
 */
function openBlob(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // pop-up blocked → نزّل بدلاً من ذلك
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * يُنزّل Blob كملف.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

async function fetchPdfBlob(path: string, params?: Record<string, any>): Promise<Blob> {
  const token = localStorage.getItem('pharmacore_token');
  if (!token) throw new Error('No auth token');

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PDF fetch failed: ${res.status} ${errorText.slice(0, 200)}`);
  }

  return res.blob();
}