// types/fixedAssets.ts

export type DepreciationMethod =
  | 'straight_line'
  | 'declining_balance'
  | 'units_of_production';

export type FixedAssetStatus =
  | 'active'
  | 'under_maintenance'
  | 'disposed'
  | 'sold'
  | 'written_off';

export type MaintenanceType = 'routine' | 'repair' | 'upgrade' | 'inspection';

export type DisposalType = 'sale' | 'scrap' | 'donation' | 'write_off';

export interface AssetCategory {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  depreciation_method: DepreciationMethod;
  useful_life_years: number | null;
  declining_rate: number | null;
  asset_account_id: string | null;
  asset_account_code?: string | null;
  asset_account_name?: string | null;
  accumulated_account_id: string | null;
  accumulated_account_code?: string | null;
  accumulated_account_name?: string | null;
  depreciation_account_id: string | null;
  depreciation_account_code?: string | null;
  depreciation_account_name?: string | null;
  assets_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FixedAsset {
  id: string;
  company_id: string;
  asset_number: string;
  name: string;
  name_en: string | null;
  description: string | null;
  category_id: string;
  category_name?: string | null;
  category_code?: string | null;
  branch_id: string | null;
  branch_name?: string | null;
  warehouse_id: string | null;
  warehouse_name?: string | null;
  custodian_employee_id: string | null;
  custodian_name?: string | null;
  location: string | null;
  supplier_id: string | null;
  supplier_name?: string | null;
  invoice_id: string | null;
  serial_number: string | null;
  barcode: string | null;
  purchase_date: string;
  in_service_date: string | null;
  disposal_date: string | null;
  last_depreciation_date: string | null;
  purchase_cost: number;
  currency_id: string | null;
  exchange_rate: number;
  salvage_value: number;
  accumulated_depreciation: number;
  book_value: number;
  status: FixedAssetStatus;
  journal_entry_id: string | null;
  image_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AssetDepreciationRecord {
  id: string;
  company_id: string;
  asset_id: string;
  asset_number: string;
  asset_name: string;
  period_year: number;
  period_month: number;
  depreciation_date: string;
  amount: number;
  accumulated_after: number;
  book_value_after: number;
  journal_entry_id: string | null;
  journal_entry_number?: string | number | null;
  created_at: string;
}

export interface AssetMaintenanceRecord {
  id: string;
  company_id: string;
  asset_id: string;
  asset_number: string;
  asset_name: string;
  maintenance_date: string;
  maintenance_type: MaintenanceType;
  description: string;
  cost: number;
  is_capitalized: boolean;
  supplier_id: string | null;
  journal_entry_id: string | null;
  next_due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AssetDisposalRecord {
  id: string;
  company_id: string;
  asset_id: string;
  asset_number: string;
  asset_name: string;
  disposal_date: string;
  disposal_type: DisposalType;
  sale_price: number;
  book_value_at_disposal: number;
  gain_loss: number;
  buyer_name: string | null;
  reason: string | null;
  journal_entry_id: string | null;
  journal_entry_number?: string | number | null;
  approved_by: string | null;
  created_at: string;
}