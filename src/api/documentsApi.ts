import { request } from './client';

export interface DocumentItem {
  document_type: string;
  document_id: string;
  document_number: string;
  document_date: string;
  amount: number;
  status: string;
  party_name: string | null;
  party_id: string | null;
  journal_entry_id: string | null;
  source_id: string | null;
  created_at: string;
}

export interface DocumentsListResult {
  items: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DocumentType {
  value: string;
  label: string;
  category: string;
}

export interface DocumentCategory {
  value: string;
  label: string;
}

export const documentsApi = {
  list: async (params?: {
    document_type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    party_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DocumentsListResult> => {
    return request<DocumentsListResult>('/documents', { params });
  },

  stats: async (params?: { date_from?: string; date_to?: string }): Promise<{
    by_type: Array<{ type: string; count: number; total_amount: number }>;
    totals: { count: number; amount: number };
  }> => {
    return request('/documents/stats', { params });
  },

  types: async (): Promise<{
    types: DocumentType[];
    categories: DocumentCategory[];
    statuses: string[];
  }> => {
    return request('/documents/types');
  },

  // في documentsApi
downloadPdf: async (type: 'invoice' | 'note' | 'goodsReceipt' | 'stockTransfer' | 'stockAdjustment', id: string): Promise<Blob> => {
  const endpoints = {
    invoice: '/pdf/invoice',
    note: '/pdf/note',
    goodsReceipt: '/pdf/goods-receipt',
    stockTransfer: '/pdf/stock-transfer',
    stockAdjustment: '/pdf/stock-adjustment',
  };
  return request<Blob>(`${endpoints[type]}/${id}`, {
    method: 'GET',
    responseType: 'blob',
  } as any);
},
};