// api/b2bApi.ts
import { request, normalizeList } from './client';
import {
  CompanyConnection,
  CompanyPost,
  PostComment,
  GlobalProduct,
  PaginatedResult,
  RegisteredCompanyItem,
  Supplier,
  Product,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NetworkSupplierInfo {
  isNetwork: boolean;
  companyId: string | null;
  company: RegisteredCompanyItem | null;
  badgeLabel: string;
  description: string;
}

export interface RegisterCompanyPayload {
  name: string;
  business_type: 'warehouse' | 'distributor' | 'manufacturer' | 'pharmacy';
  phone: string;
  email?: string;
  tax_number?: string;
  city?: string;
  address?: string;
}

export interface CreateGlobalProductPayload {
  name: string;
  unit: string;
  product_type:
    | 'drug'
    | 'supplement'
    | 'cosmetic'
    | 'food'
    | 'device'
    | 'herbal'
    | 'veterinary'
    | 'other';
  barcode?: string;
  sku?: string;
  scientific_name?: string;
  category?: string;
  dosage_form?: string;
  active_ingredient?: string;
  strength?: string;
  manufacturer?: string;
  requires_prescription?: boolean;
  is_otc?: boolean;
}

export interface ListConnectionsParams {
  status?: 'pending' | 'accepted' | 'rejected' | 'blocked';
  direction?: 'sent' | 'received';
  search?: string;
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// b2bApi
// ═══════════════════════════════════════════════════════════════════════════

export const b2bApi = {
  // ══════════════════════════════════════════════════════════════
  // Registered Companies Directory
  // ══════════════════════════════════════════════════════════════

  /**
   * قائمة الشركات المسجلة في الشبكة.
   * GET /b2b/companies
   */
  listRegisteredCompanies: async (params?: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<RegisteredCompanyItem[]> => {
    const res = await request<unknown>('/b2b/companies', { params });
    return normalizeList<RegisteredCompanyItem>(res).items;
  },

  /**
   * جلب شركة واحدة.
   * GET /b2b/companies/:id
   */
  getCompany: async (companyId: string): Promise<RegisteredCompanyItem> => {
    return request<RegisteredCompanyItem>(`/b2b/companies/${companyId}`);
  },

  /**
   * تسجيل شركة جديدة في الشبكة (B2B).
   * POST /b2b/companies/register
   */
  registerCompany: async (
    data: RegisterCompanyPayload
  ): Promise<RegisteredCompanyItem> => {
    return request<RegisteredCompanyItem>('/b2b/companies/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ══════════════════════════════════════════════════════════════
  // Connections
  // ══════════════════════════════════════════════════════════════

  /**
   * إرسال طلب اتصال.
   * POST /connections/request
   */
  sendConnectionRequest: async (
    receiverCompanyId: string
  ): Promise<CompanyConnection> => {
    return request<CompanyConnection>('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiver_company_id: receiverCompanyId }),
    });
  },

  /**
   * تحديث حالة الاتصال.
   * PATCH /connections/:id/status
   */
  updateConnectionStatus: async (
    connectionId: string,
    status: 'accepted' | 'rejected' | 'blocked'
  ): Promise<CompanyConnection> => {
    return request<CompanyConnection>(`/connections/${connectionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * قائمة الاتصالات (مع pagination).
   * GET /connections
   *
   * ✅ FIX: يُرجع `PaginatedResult<CompanyConnection>` (وليس مصفوفة).
   */
  listConnections: async (
    params?: ListConnectionsParams
  ): Promise<PaginatedResult<CompanyConnection>> => {
    const res = await request<unknown>('/connections', { params });
    return normalizeList<CompanyConnection>(res);
  },

  /**
   * alias للتوافق الخلفي — يُرجع مصفوفة فقط.
   * @deprecated استخدم `listConnections` (الذي يُرجع pagination).
   */
  getCompanyConnections: async (
    params?: ListConnectionsParams
  ): Promise<CompanyConnection[]> => {
    const result = await b2bApi.listConnections(params);
    return result.items;
  },

  /**
   * الشركات المتصلة (accepted فقط).
   * GET /connections/accepted
   */
  listAcceptedConnections: async (): Promise<CompanyConnection[]> => {
    const res = await request<unknown>('/connections/accepted');
    return normalizeList<CompanyConnection>(res).items;
  },

  // ══════════════════════════════════════════════════════════════
  // Posts Feed
  // ══════════════════════════════════════════════════════════════

  getPublicFeed: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<CompanyPost>> => {
    const res = await request<unknown>('/posts/feed', { params });
    return normalizeList<CompanyPost>(res);
  },

  createPost: async (data: {
    title: string;
    content: string;
    media_url?: string;
    is_public?: boolean;
  }): Promise<CompanyPost> => {
    return request<CompanyPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleLike: async (postId: string): Promise<{ liked: boolean }> => {
    return request<{ liked: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  addComment: async (
    postId: string,
    comment_text: string
  ): Promise<PostComment> => {
    return request<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text }),
    });
  },

  getComments: async (postId: string): Promise<PostComment[]> => {
    const res = await request<unknown>(`/posts/${postId}/comments`);
    return normalizeList<PostComment>(res).items;
  },

  // ══════════════════════════════════════════════════════════════
  // Global Products Catalog
  // ══════════════════════════════════════════════════════════════

  searchGlobalProducts: async (params?: {
    search?: string;
    product_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<GlobalProduct>> => {
    const res = await request<unknown>('/global-products/search', { params });
    return normalizeList<GlobalProduct>(res);
  },

  createGlobalProduct: async (
    data: CreateGlobalProductPayload
  ): Promise<GlobalProduct> => {
    return request<GlobalProduct>('/global-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ══════════════════════════════════════════════════════════════
  // Network Supplier Detection
  // ══════════════════════════════════════════════════════════════

  /**
   * هل المورد شبكي (B2B)؟
   * ✅ يعتمد على `source_company_id` / `connected_company_id` من DB.
   */
  isNetworkSupplier: (supplier?: Supplier | null): NetworkSupplierInfo => {
    if (!supplier) {
      return {
        isNetwork: false,
        companyId: null,
        company: null,
        badgeLabel: 'غير محدد',
        description: '',
      };
    }

    const supplierData = supplier as Supplier & {
      source_company_id?: string | null;
      company_id?: string | null;
      connected_company_id?: string | null;
      company?: RegisteredCompanyItem | null;
    };

    const companyId =
      supplierData.source_company_id ||
      supplierData.connected_company_id ||
      supplierData.company_id ||
      supplierData.company?.id ||
      null;

    const isNetwork = Boolean(companyId);

    return {
      isNetwork,
      companyId,
      company: supplierData.company || null,
      badgeLabel: isNetwork
        ? '🏢 مورد شبكي B2B متصل'
        : '📦 مورد محلي تقليدي',
      description: isNetwork
        ? `شركة مرتبطة عبر شبكة B2B — يتم جلب منتجاتها وأسعارها الحية.`
        : 'مورد محلي مسجل في دليلك الخاص — يتم جلب الأصناف من الكتالوج المحلي.',
    };
  },

  // ══════════════════════════════════════════════════════════════
  // Company Stock (Network)
  // ══════════════════════════════════════════════════════════════

  /**
   * جلب مخزون شركة شبكية (مورد).
   * GET /b2b/companies/:id/products/stock
   *
   * ⚠️ يتحقق من وجود اتصال مقبول.
   *
   * ✅ يُرجع Product[] (كل منتج مع batches + units).
   */
  getCompanyStock: async (companyId: string): Promise<Product[]> => {
    const response = await request<unknown>(
      `/b2b/companies/${companyId}/products/stock`
    );

    let rows: any[] = [];
    if (Array.isArray(response)) {
      rows = response;
    } else if (
      response !== null &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray((response as { data: unknown }).data)
    ) {
      rows = (response as { data: unknown[] }).data;
    }

    return rows.map((row: any) => {
      const batches = Array.isArray(row.batches) ? row.batches : [];
      const liveBatch =
        batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];

      const totalQty = Number(row.total_quantity ?? 0);
      const reservedQty = Number(row.reserved_quantity ?? 0);
      const availableQty = Number(
        row.available_quantity ?? totalQty - reservedQty
      );

      return {
        ...row,
        id: row.id ?? row.product_id,
        name: row.name ?? row.product_name,
        sku: row.sku ?? '',
        cost_price: Number(liveBatch?.cost_price ?? row.cost_price ?? 0),
        selling_price: Number(row.selling_price ?? 0),
        wholesale_price: Number(
          liveBatch?.cost_price ?? row.cost_price ?? 0
        ),
        quantity: availableQty,
        total_quantity: totalQty,
        current_stock: availableQty,
        available_quantity: availableQty,
        reserved_quantity: reservedQty,
        company_id: companyId,
        is_network_product: true,
        live_batch_number: liveBatch?.batch_number ?? '',
        live_expiry_date: liveBatch?.expiry_date ?? '',
        batches,
        units: Array.isArray(row.units) ? row.units : [],
      } as Product;
    });
  },

  /**
   * alias للتوافق الخلفي.
   * @deprecated استخدم `getCompanyStock` بدلاً منها.
   */
  getCompanyProducts: async (companyId: string): Promise<Product[]> => {
    return b2bApi.getCompanyStock(companyId);
  },
};