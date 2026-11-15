import { request } from './client';

export type NoteType = 'credit' | 'debit';
export type PartyType = 'customer' | 'supplier';
export type NoteReason = 'return' | 'discount' | 'correction' | 'price_diff' | 'shipping' | 'other';

export interface NoteItem {
  id: string;
  note_id: string;
  product_id: string | null;
  product_name: string | null;
  product_sku: string | null;
  product_unit: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
}

export interface Note {
  id: string;
  note_number: string;
  note_type: NoteType;
  party_type: PartyType;
  customer_id: string | null;
  customer_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  note_date: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  total: number;
  reason: NoteReason;
  description: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  journal_entry_id: string | null;
  items: NoteItem[];
  items_count?: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  cancelled_by: string | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export const notesApi = {
  list: async (params?: {
    note_type?: NoteType;
    party_type?: PartyType;
    status?: string;
    customer_id?: string;
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Note[]; pagination: any }> => {
    return request<{ items: Note[]; pagination: any }>('/notes', { params });
  },

  getById: async (id: string): Promise<Note> => {
    return request<Note>(`/notes/${id}`);
  },

  create: async (data: {
    note_type: NoteType;
    party_type: PartyType;
    customer_id?: string;
    supplier_id?: string;
    invoice_id?: string;
    note_date?: string;
    currency_id?: string;
    exchange_rate?: number;
    reason: NoteReason;
    description?: string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      discount_rate?: number;
      tax_rate?: number;
      product_id?: string;
    }>;
  }): Promise<Note> => {
    return request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirm: async (id: string): Promise<Note> => {
    return request<Note>(`/notes/${id}/confirm`, { method: 'POST' });
  },

  cancel: async (id: string, reason?: string): Promise<any> => {
    return request(`/notes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};