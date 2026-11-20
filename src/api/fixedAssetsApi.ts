// api/fixedAssetsApi.ts
import { request, normalizeList } from './client';
import type { PaginatedResult } from '../types';
import type {
  AssetCategory,
  FixedAsset,
  AssetDepreciationRecord,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
  FixedAssetStatus,
  MaintenanceType,
  DisposalType,
} from '../types/fixedAssets';

const BASE = '/fixed-assets';

export interface ListAssetsParams {
  category_id?: string;
  branch_id?: string;
  warehouse_id?: string;
  custodian_employee_id?: string;
  status?: FixedAssetStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAssetPayload {
  name: string;
  name_en?: string | null;
  category_id: string;
  description?: string | null;
  serial_number?: string | null;
  barcode?: string | null;
  branch_id?: string | null;
  warehouse_id?: string | null;
  custodian_employee_id?: string | null;
  location?: string | null;
  purchase_date: string;
  in_service_date?: string | null;
  purchase_cost: number;
  currency_id?: string | null;
  exchange_rate?: number;
  salvage_value?: number;
  supplier_id?: string | null;
  invoice_id?: string | null;
  image_url?: string | null;
  notes?: string | null;
  auto_journal?: boolean;
  payment_account_id?: string | null;
}

export interface TransferCustodyPayload {
  branch_id?: string | null;
  warehouse_id?: string | null;
  custodian_employee_id?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface CreateMaintenancePayload {
  maintenance_date?: string;
  maintenance_type?: MaintenanceType;
  description: string;
  cost?: number;
  is_capitalized?: boolean;
  supplier_id?: string | null;
  payment_account_id?: string | null;
  expense_account_id?: string | null;
  next_due_date?: string | null;
  set_under_maintenance?: boolean;
}

export interface DisposeAssetPayload {
  disposal_date?: string;
  disposal_type?: DisposalType;
  sale_price?: number;
  buyer_name?: string | null;
  reason?: string | null;
}

export const fixedAssetsApi = {
  // ── التصنيفات ──
  listCategories: async (params?: {
    is_active?: boolean;
    search?: string;
  }): Promise<AssetCategory[]> => {
    const res = await request<AssetCategory[]>(`${BASE}/categories`, { params });
    return Array.isArray(res) ? res : normalizeList<AssetCategory>(res).items;
  },

  getCategoryById: async (id: string): Promise<AssetCategory> => {
    return request<AssetCategory>(`${BASE}/categories/${id}`);
  },

  createCategory: async (payload: Partial<AssetCategory>): Promise<AssetCategory> => {
    return request<AssetCategory>(`${BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCategory: async (
    id: string,
    payload: Partial<AssetCategory>
  ): Promise<AssetCategory> => {
    return request<AssetCategory>(`${BASE}/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    await request(`${BASE}/categories/${id}`, { method: 'DELETE' });
  },

  // ── الأصول الثابتة ──
  listAssets: async (
    params?: ListAssetsParams
  ): Promise<PaginatedResult<FixedAsset>> => {
    const res = await request(`${BASE}`, { params });
    return normalizeList<FixedAsset>(res);
  },

  getAssetById: async (id: string): Promise<FixedAsset> => {
    return request<FixedAsset>(`${BASE}/${id}`);
  },

  createAsset: async (payload: CreateAssetPayload): Promise<FixedAsset> => {
    return request<FixedAsset>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAsset: async (
    id: string,
    payload: Partial<CreateAssetPayload> & { status?: FixedAssetStatus }
  ): Promise<FixedAsset> => {
    return request<FixedAsset>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  transferCustody: async (
    id: string,
    payload: TransferCustodyPayload
  ): Promise<FixedAsset> => {
    return request<FixedAsset>(`${BASE}/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteAsset: async (id: string): Promise<void> => {
    await request(`${BASE}/${id}`, { method: 'DELETE' });
  },

  // ── الإهلاك ──
  listDepreciations: async (params?: {
    asset_id?: string;
    year?: number;
    month?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<AssetDepreciationRecord[]> => {
    const res = await request<AssetDepreciationRecord[]>(`${BASE}/depreciations`, {
      params,
    });
    return Array.isArray(res) ? res : normalizeList<AssetDepreciationRecord>(res).items;
  },

  runDepreciation: async (payload?: {
    year?: number;
    month?: number;
    period_date?: string;
    auto_post?: boolean;
  }) => {
    return request(`${BASE}/depreciations/run`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  // ── الصيانة ──
  listMaintenances: async (params?: {
    asset_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AssetMaintenanceRecord[]> => {
    const res = await request<AssetMaintenanceRecord[]>(`${BASE}/maintenances`, {
      params,
    });
    return Array.isArray(res) ? res : normalizeList<AssetMaintenanceRecord>(res).items;
  },

  createMaintenance: async (assetId: string, payload: CreateMaintenancePayload) => {
    return request(`${BASE}/${assetId}/maintenances`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── التخلص والبيع ──
  listDisposals: async (params?: {
    asset_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AssetDisposalRecord[]> => {
    const res = await request<AssetDisposalRecord[]>(`${BASE}/disposals`, { params });
    return Array.isArray(res) ? res : normalizeList<AssetDisposalRecord>(res).items;
  },

  disposeAsset: async (assetId: string, payload: DisposeAssetPayload) => {
    return request(`${BASE}/${assetId}/dispose`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default fixedAssetsApi;