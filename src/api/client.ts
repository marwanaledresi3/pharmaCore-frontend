// api/client.ts
import { PaginatedResult, ValidationErrorDetail } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// ApiError
// ═══════════════════════════════════════════════════════════════════════════

export class ApiError extends Error {
  status: number;
  details?: ValidationErrorDetail[];
  raw?: any;

  constructor(
    status: number,
    message: string,
    details?: ValidationErrorDetail[],
    raw?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.raw = raw;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API Base URL
// ═══════════════════════════════════════════════════════════════════════════

const getApiBaseUrl = (): string => {
  let envUrl: string | undefined;
  try {
    envUrl = import.meta.env?.VITE_API_URL;
  } catch {
    envUrl = undefined;
  }

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

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_TIMEOUT_MS = 60_000; // 60 ثانية (Render Cold Start)
const TOKEN_KEY = 'pharmacore_token';
const USER_KEY = 'pharmacore_user';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const isBrowser = typeof window !== 'undefined';

function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageRemove(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * يُرجع Content-Type المناسب حسب نوع body.
 * - FormData / Blob / URLSearchParams → لا نضع Content-Type (المتصفح)
 * - string → 'application/json'
 * - غير ذلك → لا شيء
 */
function resolveContentType(body: BodyInit | null | undefined): string | null {
  if (!body) return null;
  if (body instanceof FormData) return null;
  if (body instanceof URLSearchParams) return null;
  if (body instanceof Blob) return null;
  if (typeof body === 'string') return 'application/json';
  return null;
}

function generateRequestId(): string {
  try {
    const rand = Math.random().toString(36).slice(2, 10);
    return `req_${Date.now().toString(36)}_${rand}`;
  } catch {
    return `req_${Date.now()}`;
  }
}

/**
 * يبني PaginationMeta من كائن غير موثوق.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function buildPagination(
  raw: any,
  itemsCount: number
): PaginationMeta {
  const limit = Number(raw?.limit) || itemsCount || 20;
  const total = Number(raw?.total ?? itemsCount);
  const page = Number(raw?.page) || 1;
  const pages =
    Number(raw?.pages) || Math.max(1, Math.ceil(total / limit));

  return { page, limit, total, pages };
}

// ═══════════════════════════════════════════════════════════════════════════
// Request
// ═══════════════════════════════════════════════════════════════════════════

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
  timeoutMs?: number;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    skipAuth,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: customHeaders,
    ...restOptions
  } = options;

  // ─── 1) بناء URL مع params ────────────────────────────────────────
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

  // ─── 2) Headers ──────────────────────────────────────────────────
  const headers = new Headers(customHeaders);

  if (!skipAuth) {
    const token = safeLocalStorageGet(TOKEN_KEY);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Content-Type — ذكي حسب نوع body
  if (!headers.has('Content-Type')) {
    const ct = resolveContentType(restOptions.body);
    if (ct) headers.set('Content-Type', ct);
  }

  // X-Request-Id — للتتبع
  if (!headers.has('X-Request-Id')) {
    headers.set('X-Request-Id', generateRequestId());
  }

  // ─── 3) AbortController + timeout ────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // إذا كان هناك signal من caller — استخدمه
  const externalSignal = restOptions.signal;
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), {
      once: true,
    });
  }

  // ─── 4) fetch ────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      throw new ApiError(
        408,
        'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
        undefined,
        err
      );
    }

    throw new ApiError(
      0,
      'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت أو الانتظار قليلاً إذا كان الخادم في وضع السكون (Render Cold Start).',
      undefined,
      err
    );
  }
  clearTimeout(timeoutId);

  // ─── 5) 401 → إطلاق event ────────────────────────────────────────
  if (
    response.status === 401 &&
    !skipAuth &&
    !endpoint.includes('/auth/login')
  ) {
    safeLocalStorageRemove(TOKEN_KEY);
    safeLocalStorageRemove(USER_KEY);
    if (isBrowser) {
      window.dispatchEvent(new CustomEvent('pharmacore:unauthorized'));
    }
  }

  // ─── 6) PDF / Blob response ─────────────────────────────────────
  const contentType = response.headers.get('content-type') || '';
  const wantsPdf =
    contentType.includes('application/pdf') ||
    headers.get('Accept') === 'application/pdf';

  if (wantsPdf) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `فشل تحميل ملف PDF (رمز: ${response.status})`
      );
    }
    const blob = await response.blob();
    return blob as unknown as T;
  }

  // ─── 7) JSON parse ──────────────────────────────────────────────
  let json: any = null;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `خطأ في الخادم (${response.status} ${response.statusText})`
      );
    }
    return {} as T;
  }

  // ─── 8) معالجة الأخطاء ──────────────────────────────────────────
  if (!response.ok || (json && json.success === false)) {
    const message =
      json?.message ||
      json?.detail ||
      `حدث خطأ برقم (${response.status})`;
    const details = Array.isArray(json?.details) ? json.details : undefined;
    throw new ApiError(response.status, message, details, json);
  }

  // ─── 9) إرجاع data ──────────────────────────────────────────────
  return (json && 'data' in json ? json.data : json) as T;
}

// ═══════════════════════════════════════════════════════════════════════════
// normalizeList
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يُطبّع استجابات القوائم بحيث تستقبل الواجهة دائماً
 * { items: T[], pagination: PaginationMeta } بغض النظر عن شكل الباك إند.
 */
export function normalizeList<T>(resData: any): PaginatedResult<T> {
  // لا بيانات
  if (!resData) {
    return {
      items: [],
      pagination: buildPagination(null, 0),
    };
  }

  // Case 0: مصفوفة مباشرة
  if (Array.isArray(resData)) {
    return {
      items: resData,
      pagination: buildPagination(null, resData.length),
    };
  }

  // Case 1: { items, pagination }
  if (Array.isArray(resData.items)) {
    return {
      items: resData.items,
      pagination: buildPagination(resData.pagination, resData.items.length),
    };
  }

  // Case 2: { data: [...] }
  if (Array.isArray(resData.data)) {
    return {
      items: resData.data,
      pagination: buildPagination(null, resData.data.length),
    };
  }

  // Case 3: { data: { items, pagination } }
  if (Array.isArray(resData.data?.items)) {
    return {
      items: resData.data.items,
      pagination: buildPagination(
        resData.data.pagination,
        resData.data.items.length
      ),
    };
  }

  // Fallback
  return {
    items: [],
    pagination: buildPagination(null, 0),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF helpers
// ═══════════════════════════════════════════════════════════════════════════

export async function downloadPdfBlob(
  blob: Blob,
  filename: string
): Promise<void> {
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

export async function openPdfInNewTab(blob: Blob): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}