export interface ReportPeriod {
  date_from?: string;
  date_to?: string;
  group_by?: string;
}

// Sales / Purchases
export interface SalesReport {
  period: ReportPeriod;
  totals: {
    invoices_count: number;
    total_sales: number;
    total_paid: number;
  };
  by_date: Array<{
    period: string;
    invoices_count: number;
    total_sales: string;
    total_paid: string;
  }>;
  by_customer: Array<{
    id: string;
    name: string;
    invoices_count: number;
    total: string;
  }>;
  by_product: Array<{
    id: string;
    name: string;
    sku: string;
    quantity_sold: string;
    revenue: string;
  }>;
}

export interface PurchasesReport {
  period: ReportPeriod;
  totals: {
    invoices_count: number;
    total_purchases: number;
    total_paid: number;
  };
  by_date: Array<{
    period: string;
    invoices_count: number;
    total_purchases: string;
    total_paid: string;
  }>;
  by_supplier: Array<{
    id: string;
    name: string;
    invoices_count: number;
    total: string;
  }>;
}

export interface TopProduct {
  id: string;
  sku: string;
  name: string;
  quantity_sold: string;
  revenue: string;
  avg_price: string;
}

export interface InventoryReport {
  summary: {
    products_count: number;
    total_value: string;
    total_units: string;
  };
  items: Array<{
    id: string;
    sku: string;
    name: string;
    unit: string;
    min_stock_level: string;
    warehouse_id?: string;
    warehouse_name?: string;
    total_quantity: string;
    total_value: string;
    batches_count: number;
    nearest_expiry?: string;
  }>;
  expiring_soon: Array<{
    id: string;
    batch_number: string;
    expiry_date: string;
    quantity: string;
    cost_price: string;
    product_name: string;
    sku: string;
    warehouse_name: string;
    days_left: number;
  }>;
  low_stock: Array<{
    id: string;
    sku: string;
    name: string;
    min_stock_level: string;
    current_quantity: string;
  }>;
}

export interface AgingBucket {
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total: number;
}

export interface AgingReport {
  as_of_date: string;
  customers?: Array<AgingBucket & { customer_id: string; customer_name: string; invoices: any[] }>;
  suppliers?: Array<AgingBucket & { supplier_id: string; supplier_name: string; invoices: any[] }>;
  totals: AgingBucket;
}