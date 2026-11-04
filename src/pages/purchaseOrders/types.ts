import { Product, Supplier } from '../../types';

export interface CatalogProduct extends Product {
  is_network_product?: boolean;
  live_batch_number?: string;
  live_expiry_date?: string;
  total_quantity?: number;
  current_stock?: number;
  wholesale_price?: number;
  available_quantity?: number;   
  reserved_quantity?: number; 
}

export interface DraftItem {
  uid: string;
  product_id: string;
  paid_quantity: number;
  bonus_quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  batch_number: string;
  expiry_date: string;
}

export type RefsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface QRData {
  url: string;
  qr_data_url: string;
  pin: string | null;
  expires_at: string;
}