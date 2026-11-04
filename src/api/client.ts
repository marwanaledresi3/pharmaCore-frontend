import { PaginatedResult, ValidationErrorDetail } from '../types';

export class ApiError extends Error {
  status: number;
  details?: ValidationErrorDetail[];
  raw?: any;

  constructor(status: number, message: string, details?: ValidationErrorDetail[], raw?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.raw = raw;
  }
}

const getApiBaseUrl = (): string => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl.trim() === '' || envUrl.includes('MY_APP_URL')) {
    envUrl = 'https://pharnmacore-backend.onrender.com';
  }
  // Trim trailing slash
  envUrl = envUrl.replace(/\/+$/, '');
  // Ensure /api/v1 suffix without duplicating
  if (!envUrl.endsWith('/api/v1')) {
    envUrl = `${envUrl}/api/v1`;
  }
  return envUrl;
};

export const API_BASE_URL = getApiBaseUrl();

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth, headers: customHeaders, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers = new Headers(customHeaders);
  
  if (!skipAuth) {
    const token = localStorage.getItem('pharmacore_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set Content-Type only if body is not FormData and not already set
  if (restOptions.body && !(restOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      0,
      'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت أو الانتظار قليلاً إذا كان الخادم في وضع السكون (Render Cold Start).',
      undefined,
      err
    );
  }

  // If unauthorized, notify or clear session if 401
  if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('pharmacore_token');
    localStorage.removeItem('pharmacore_user');
    window.dispatchEvent(new CustomEvent('pharmacore:unauthorized'));
  }

  // Handle PDF / Blob response if caller expects it
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || headers.get('Accept') === 'application/pdf') {
    if (!response.ok) {
      throw new ApiError(response.status, `فشل تحميل ملف PDF (رمز: ${response.status})`);
    }
    const blob = await response.blob();
    return blob as unknown as T;
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(response.status, `خطأ في الخادم (${response.status} ${response.statusText})`);
    }
    return {} as T;
  }

  if (!response.ok || (json && json.success === false)) {
    const message = json?.message || json?.detail || `حدث خطأ برقم (${response.status})`;
    const details = Array.isArray(json?.details) ? json.details : undefined;
    throw new ApiError(response.status, message, details, json);
  }

  // Backend standard returns { success: true, data: ... } or direct data
  return (json && 'data' in json ? json.data : json) as T;
}

/**
 * Normalizes list responses so that UI components ALWAYS receive
 * { items: T[], pagination: Pagination } regardless of whether backend
 * returned `{ items: [], pagination: {} }` or direct array `[]`.
 */
// في client.ts
// في ملف client.ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}


export function normalizeList<T>(resData: any): PaginatedResult<T> {
  if (!resData) {
    return { 
      items: [], 
      pagination: { page: 1, limit: 20, total: 0, pages: 1 } 
    };
  }

  // Case 0: مصفوفة مباشرة (الباك إند القديم)
  if (Array.isArray(resData)) {
    return {
      items: resData,
      pagination: { 
        page: 1, 
        limit: resData.length || 20, 
        total: resData.length, 
        pages: 1 
      },
    };
  }

  // Case 1: { items, pagination }
  if (resData.items && Array.isArray(resData.items)) {
    const items = resData.items;
    const p = resData.pagination || {};
    const limit = Number(p.limit) || items.length || 20;
    const total = Number(p.total ?? items.length);
    const page = Number(p.page) || 1;
    const pages = Number(p.pages) || Math.max(1, Math.ceil(total / limit));

    return {
      items,
      pagination: { page, limit, total, pages },
    };
  }

  // Case 2: { data: [...] }
  if (resData.data && Array.isArray(resData.data)) {
    return {
      items: resData.data,
      pagination: { 
        page: 1, 
        limit: resData.data.length || 20, 
        total: resData.data.length, 
        pages: 1 
      },
    };
  }

  // Case 3: { data: { items, pagination } }
  if (resData.data?.items && Array.isArray(resData.data.items)) {
    const items = resData.data.items;
    const p = resData.data.pagination || {};
    const limit = Number(p.limit) || items.length || 20;
    const total = Number(p.total ?? items.length);
    const page = Number(p.page) || 1;
    const pages = Number(p.pages) || Math.max(1, Math.ceil(total / limit));

    return {
      items,
      pagination: { page, limit, total, pages },
    };
  }

  // Fallback للحالات غير المتوقعة
  return { 
    items: [], 
    pagination: { page: 1, limit: 20, total: 0, pages: 1 } 
  };
}
/**
 * Helper to download or open a PDF blob in browser
 */

export async function downloadPdfBlob(blob: Blob, filename: string): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Helper to open PDF in a new tab for printing or viewing
 */
export async function openPdfInNewTab(blob: Blob): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}
