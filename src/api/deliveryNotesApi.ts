import { request } from './client';

export interface DeliveryNoteItem {
  id: string;
  delivery_note_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

export interface DeliveryNote {
  id: string;
  delivery_number: string;
  delivery_date: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  sales_order_id: string | null;
  sales_order_number?: string | null;
  invoice_id: string | null;
  invoice_number?: string | null;
  warehouse_id: string;
  warehouse_name: string;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: 'draft' | 'dispatched' | 'delivered' | 'invoiced' | 'cancelled';
  dispatched_at: string | null;
  delivered_at: string | null;
  delivered_to_name: string | null;
  signature_url: string | null;
  items: DeliveryNoteItem[];
  items_count?: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export const deliveryNotesApi = {
  list: async (params?: {
    status?: string;
    customer_id?: string;
    warehouse_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: DeliveryNote[]; pagination: any }> => {
    return request<{ items: DeliveryNote[]; pagination: any }>('/delivery-notes', { params });
  },

  getById: async (id: string): Promise<DeliveryNote> => {
    return request<DeliveryNote>(`/delivery-notes/${id}`);
  },

  create: async (data: {
    customer_id: string;
    warehouse_id: string;
    delivery_date?: string;
    sales_order_id?: string;
    driver_name?: string;
    driver_phone?: string;
    vehicle_number?: string;
    delivery_address?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      batch_id?: string | null;
      unit_price?: number;
      description?: string;
    }>;
  }): Promise<DeliveryNote> => {
    return request<DeliveryNote>('/delivery-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  dispatch: async (id: string): Promise<DeliveryNote> => {
    return request<DeliveryNote>(`/delivery-notes/${id}/dispatch`, { method: 'POST' });
  },

  markDelivered: async (
    id: string,
    data: { delivered_to_name?: string; signature_url?: string }
  ): Promise<DeliveryNote> => {
    return request<DeliveryNote>(`/delivery-notes/${id}/mark-delivered`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  convertToInvoice: async (id: string): Promise<{ delivery_note: DeliveryNote; invoice: any }> => {
    return request(`/delivery-notes/${id}/convert-to-invoice`, { method: 'POST' });
  },

  cancel: async (id: string, reason?: string): Promise<any> => {
    return request(`/delivery-notes/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};