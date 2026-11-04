import { request } from './client';

export interface GlobalProduct {
  id: string;
  barcode?: string | null;
  sku?: string | null;
  name: string;
  scientific_name?: string | null;
  description?: string | null;
  unit: string;
  category?: string | null;
  image_url?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface CompanyPost {
  id: string;
  title: string;
  content: string;
  media_url?: string | null;
  views_count: number;
  created_at: string;
  company_id: string;
  company_name: string;
  company_name_en?: string | null;
  company_logo?: string | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const publicApi = {
  products: (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    request<Paginated<GlobalProduct>>('/public/products', { params }),

  categories: () => request<string[]>('/public/categories'),

  posts: (params?: { search?: string; page?: number; limit?: number }) =>
    request<Paginated<CompanyPost>>('/public/posts', { params }),

  viewPost: (id: string) =>
    request<void>(`/public/posts/${id}/view`, { method: 'POST' }),
};