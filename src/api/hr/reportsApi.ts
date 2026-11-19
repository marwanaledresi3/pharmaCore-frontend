// api/hr/reportsApi.ts
import { request } from '../client';

/**
 * تصدير تقارير HR.
 * - XLSX: POST /reports/hr/export/xlsx
 * - PDF:  POST /pdf/hr/report  (body: تقرير مُهيَّأ)
 * - CSV:  client-side (لا يحتاج endpoint)
 */

export interface ReportXlsxPayload {
  filename: string;
  sheets: Array<{
    name: string;
    headers: string[];
    rows: any[];
  }>;
}

export interface ReportPdfPayload {
  filename: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  headers: string[];
  rows: any[];
  summary?: Array<{ label: string; value: string; isTotal?: boolean }>;
  notes?: string;
  currencyCode?: string;
  landscape?: boolean;
  columnTypes?: Record<string, 'arabic' | 'text' | 'number' | 'money' | 'date'>;
  showSignature?: boolean;
  signatureLeft?: string;
  signatureRight?: string;
}

export const hrReportsApi = {
  // ─── XLSX ──────────────────────────────────────────────
  exportXlsx: async (payload: ReportXlsxPayload): Promise<void> => {
    const blob = await request<Blob>('/reports/hr/export/xlsx', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    downloadBlob(blob, `${payload.filename}.xlsx`);
  },

  // ─── PDF ───────────────────────────────────────────────
  exportPdf: async (payload: ReportPdfPayload): Promise<void> => {
    const blob = await request<Blob>('/pdf/hr/report', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Accept: 'application/pdf' },
    });
    downloadBlob(blob, `${payload.filename}.pdf`);
  },
};

// ═══════════════════════════════════════════════════════════════
// Helper — تنزيل blob
// ═══════════════════════════════════════════════════════════════
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}