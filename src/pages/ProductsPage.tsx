import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pill,
  Search,
  Plus,
  RefreshCw,
  Barcode,
  Layers,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  Link2,
  Boxes,
} from 'lucide-react';
import { productsApi, ProductStockDetails, ProductStockBatch } from '../api/productsApi';
import { Product, ProductUnit, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface UnitOption {
  id: string;
  code: string;
  name: string;
  name_en?: string;
}

interface DraftSubUnit {
  unit_id: string;
  parent_unit_id: string | null;   // الوحدة الأم (null = الأساسية)
  qty_in_parent: number;            // كم من الوحدة الأم
  conversion_factor: number;        // محسوب
  sale_price: number;
  purchase_price: number;
  barcode: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحسب conversion_factor لكل وحدة بناءً على parent_unit_id + qty_in_parent.
 * - إذا parent_unit_id = null أو = baseUnitId → factor = qty_in_parent
 * - وإلا → factor = parent.conversion_factor × qty_in_parent
 *
 * ⚠️ يعتمد على ترتيب subUnits (الأعلى أولاً).
 */
function recalcConversionFactors(
  baseUnitId: string,
  subs: DraftSubUnit[]
): DraftSubUnit[] {
  const map = new Map<string, number>();   // unit_id → factor
  if (baseUnitId) map.set(baseUnitId, 1);

  return subs.map((u) => {
    if (!u.parent_unit_id || u.parent_unit_id === baseUnitId) {
      const factor = Math.max(1, Number(u.qty_in_parent) || 1);
      if (u.unit_id) map.set(u.unit_id, factor);
      return { ...u, conversion_factor: factor };
    }

    const parentFactor = map.get(u.parent_unit_id) ?? 1;
    const factor = parentFactor * Math.max(1, Number(u.qty_in_parent) || 1);
    if (u.unit_id) map.set(u.unit_id, factor);
    return { ...u, conversion_factor: factor };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export const ProductsPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  // ══════════════════════════════════════════════════════════════════════
  // List state
  // ══════════════════════════════════════════════════════════════════════
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 15,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════
  // Modals
  // ══════════════════════════════════════════════════════════════════════
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isUnitsOpen, setIsUnitsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock
  const [stockDetails, setStockDetails] = useState<ProductStockBatch[]>([]);
  const [stockSummary, setStockSummary] = useState<{
    total: number;
    reserved: number;
    available: number;
    base_unit: { id: string; code: string; name: string } | null;
  } | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  // Units modal (view-only)
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Form
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [profitMargin, setProfitMargin] = useState<number | string>(20);
  const [minStockLevel, setMinStockLevel] = useState<number | string>(5);
  const [isActive, setIsActive] = useState(true);

  // Units (add)
  const [unitsList, setUnitsList] = useState<UnitOption[]>([]);
  const [baseUnitId, setBaseUnitId] = useState('');
  const [subUnits, setSubUnits] = useState<DraftSubUnit[]>([]);

  // ══════════════════════════════════════════════════════════════════════
  // Load units (once)
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const res = await request<unknown>('/units');
        let items: UnitOption[] = [];
        if (Array.isArray(res)) {
          items = res as UnitOption[];
        } else if (
          res !== null &&
          typeof res === 'object' &&
          'data' in res &&
          Array.isArray((res as any).data)
        ) {
          items = (res as any).data;
        }
        setUnitsList(items);
      } catch {
        setUnitsList([]);
      }
    };
    loadUnits();
  }, []);

  // ══════════════════════════════════════════════════════════════════════
  // Load products
  // ══════════════════════════════════════════════════════════════════════
  const loadProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const activeParam =
          isActiveFilter === 'all'
            ? undefined
            : isActiveFilter === 'active';

        const res = await productsApi.list({
          search: search.trim() || undefined,
          is_active: activeParam,
          page,
          limit: 15,
        });

        setProducts(res.items);
        setPagination(res.pagination);
      } catch (err: any) {
        setError(err.message || 'فشل تحميل قائمة المنتجات');
      } finally {
        setIsLoading(false);
      }
    },
    [search, isActiveFilter]
  );

  useEffect(() => {
    loadProducts(1);
  }, [isActiveFilter]);   // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(1);
  };

  // ══════════════════════════════════════════════════════════════════════
  // Pricing
  // ══════════════════════════════════════════════════════════════════════
  const handleCostPriceChange = (cost: number) => {
    setCostPrice(cost);
    if (profitMargin && Number(profitMargin) > 0) {
      const margin = Number(profitMargin);
      const calculated = Math.round(cost * (1 + margin / 100) * 100) / 100;
      setSellingPrice(calculated);
    }
  };

  const handleMarginChange = (margin: number) => {
    setProfitMargin(margin);
    if (costPrice && Number(costPrice) > 0) {
      const cost = Number(costPrice);
      const calculated = Math.round(cost * (1 + margin / 100) * 100) / 100;
      setSellingPrice(calculated);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Add
  // ══════════════════════════════════════════════════════════════════════
  const openAddModal = () => {
    setSku(`MED-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setBarcode('');
    setCategory('أدوية عامة');
    setCostPrice(0);
    setSellingPrice(0);
    setProfitMargin(20);
    setMinStockLevel(5);
    setIsActive(true);
    setFormError(null);

    const defaultBase =
      unitsList.find((u) => u.code === 'TAB')?.id ||
      unitsList.find((u) => u.code === 'UNIT')?.id ||
      unitsList[0]?.id ||
      '';
    setBaseUnitId(defaultBase);
    setSubUnits([]);

    setIsAddOpen(true);
  };

  const addSubUnitRow = () => {
    const usedIds = new Set([baseUnitId, ...subUnits.map((u) => u.unit_id)]);
    const available = unitsList.find((u) => !usedIds.has(u.id));

    setSubUnits((prev) => {
      const next = [
        ...prev,
        {
          unit_id: available?.id || '',
          parent_unit_id: baseUnitId,
          qty_in_parent: 10,
          conversion_factor: 10,
          sale_price: 0,
          purchase_price: 0,
          barcode: '',
        },
      ];
      return recalcConversionFactors(baseUnitId, next);
    });
  };

  const updateSubUnitRow = (idx: number, patch: Partial<DraftSubUnit>) => {
    setSubUnits((prev) => {
      const next = prev.map((u, i) => (i === idx ? { ...u, ...patch } : u));
      return recalcConversionFactors(baseUnitId, next);
    });
  };

  const removeSubUnitRow = (idx: number) => {
    setSubUnits((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return recalcConversionFactors(baseUnitId, next);
    });
  };

  // لما تتغير الوحدة الأساسية → نعيد حساب الكل
  useEffect(() => {
    if (subUnits.length > 0) {
      setSubUnits((prev) => recalcConversionFactors(baseUnitId, prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUnitId]);

  const baseUnitName = useMemo(() => {
    const u = unitsList.find((x) => x.id === baseUnitId);
    return u?.name || 'الوحدة';
  }, [unitsList, baseUnitId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !sku.trim()) {
      setFormError('اسم الدواء والرمز (SKU) حقول إلزامية');
      return;
    }
    if (!baseUnitId) {
      setFormError('يرجى اختيار الوحدة الأساسية');
      return;
    }
    if (Number(sellingPrice) <= 0) {
      setFormError('سعر البيع يجب أن يكون أكبر من صفر');
      return;
    }

    const validSubUnits = subUnits.filter(
      (u) => u.unit_id && Number(u.conversion_factor) > 0
    );
    const subIds = validSubUnits.map((u) => u.unit_id);
    if (new Set(subIds).size !== subIds.length) {
      setFormError('لا يمكن تكرار نفس الوحدة');
      return;
    }
    if (subIds.includes(baseUnitId)) {
      setFormError('الوحدة الأساسية لا يمكن تكرارها');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const baseUnit = unitsList.find((u) => u.id === baseUnitId);

      await productsApi.createWithUnits({
        sku: sku.trim(),
        name: name.trim(),
        unit: baseUnit?.code || 'TAB',
        barcode: barcode.trim() || undefined,
        category: category.trim() || undefined,
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        profit_margin: Number(profitMargin) || 0,
        min_stock_level: Number(minStockLevel) || 0,
        base_unit_id: baseUnitId,
        units: validSubUnits.map((u) => ({
          unit_id: u.unit_id,
          conversion_factor: Number(u.conversion_factor),
          sale_price: Number(u.sale_price) || null,
          purchase_price: Number(u.purchase_price) || null,
          barcode: u.barcode.trim() || null,
        })),
      });

      setIsAddOpen(false);
      loadProducts(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المنتج');
    } finally {
      setFormLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Edit
  // ══════════════════════════════════════════════════════════════════════
  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setSku(p.sku);
    setName(p.name);
    setBarcode(p.barcode || '');
    setCategory(p.category || '');
    setCostPrice(p.cost_price || 0);
    setSellingPrice(p.selling_price || 0);
    setProfitMargin(p.profit_margin || 0);
    setMinStockLevel(p.min_stock_level || 5);
    setIsActive(p.is_active ?? true);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!name.trim()) {
      setFormError('اسم الدواء حقل إلزامي');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      await productsApi.update(selectedProduct.id, {
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        category: category.trim() || undefined,
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        profit_margin: Number(profitMargin) || 0,
        min_stock_level: Number(minStockLevel) || 0,
        is_active: isActive,
      });
      setIsEditOpen(false);
      loadProducts(pagination.page);
    } catch (err: any) {
      setFormError(err.message || 'فشل تعديل المنتج');
    } finally {
      setFormLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Stock modal
  // ══════════════════════════════════════════════════════════════════════
  const openStockModal = async (p: Product) => {
    setSelectedProduct(p);
    setIsStockOpen(true);
    setStockLoading(true);
    setStockDetails([]);
    setStockSummary(null);

    try {
      const res: ProductStockDetails = await productsApi.getStock(p.id);
      setStockDetails(res.batches || []);
      setStockSummary({
        total: res.total_quantity,
        reserved: res.reserved_quantity,
        available: res.available_quantity,
        base_unit: res.base_unit,
      });
    } catch {
      setStockDetails([]);
      setStockSummary(null);
    } finally {
      setStockLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Units modal (view)
  // ══════════════════════════════════════════════════════════════════════
  const openUnitsModal = async (p: Product) => {
    setSelectedProduct(p);
    setIsUnitsOpen(true);
    setUnitsLoading(true);
    setProductUnits([]);

    try {
      if (Array.isArray(p.units) && p.units.length > 0) {
        setProductUnits(p.units);
      } else {
        const res = await productsApi.listUnits(p.id);
        setProductUnits(Array.isArray(res) ? res : []);
      }
    } catch {
      setProductUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════════════════
  const handleDelete = async (id: string, productName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${productName}"؟`)) return;
    try {
      await productsApi.delete(id);
      loadProducts(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المنتج (قد يكون مرتبطاً بحركات مخزنية أو فواتير)');
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CSV
  // ══════════════════════════════════════════════════════════════════════
  const handleExportCsv = () => {
    const exportData = products.map((p) => ({
      الاسم: p.name,
      SKU: p.sku,
      الباركود: p.barcode || '',
      الوحدة: p.unit,
      التصنيف: p.category || '',
      'سعر التكلفة': p.cost_price || 0,
      'سعر البيع': p.selling_price || 0,
      'هامش الربح %': p.profit_margin || 0,
      'المخزون المتوفر': p.current_stock || 0,
      الحالة: p.is_active ? 'نشط' : 'معطل',
      'مرتبط بالكتالوج': p.global_product_id ? 'نعم' : 'لا',
    }));
    exportToCsv(exportData, 'products_list');
  };

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            الأدوية والمنتجات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الكتالوج الصيدلاني، الوحدات المتعددة، الأسعار، والأرصدة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={products.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج/دواء
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث بالاسم، SKU، أو الباركود..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">المنتجات النشطة فقط</option>
            <option value="inactive">المنتجات المعطلة</option>
          </select>

          <button
            type="button"
            onClick={() => loadProducts(pagination.page)}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <ErrorAlert error={error} onRetry={() => loadProducts(pagination.page)} />
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب قائمة الأدوية..." fullHeight />
        ) : products.length === 0 ? (
          <EmptyState
            title="لا يوجد أدوية أو منتجات"
            description="ابدأ بإضافة الأدوية وتحديد أسعار التكلفة والبيع."
            actionLabel="إضافة أول منتج"
            onAction={openAddModal}
            icon={<Pill className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">اسم الدواء</th>
                    <th className="py-3 px-4">SKU / الباركود</th>
                    <th className="py-3 px-4">الوحدة / التصنيف</th>
                    <th className="py-3 px-4 text-center">سعر التكلفة</th>
                    <th className="py-3 px-4 text-center">هامش الربح</th>
                    <th className="py-3 px-4 text-center">سعر البيع</th>
                    <th className="py-3 px-4 text-center">المخزون</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const isLowStock =
                      Number(p.current_stock || 0) <=
                      Number(p.min_stock_level || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">{p.name}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                {!p.is_active && (
                                  <span className="inline-block px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded text-[9px] font-semibold">
                                    معطل
                                  </span>
                                )}
                                {p.global_product_id && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[9px] font-semibold"
                                    title={`مرتبط بالكتالوج: ${p.global_name || ''}`}
                                  >
                                    <Link2 className="w-2.5 h-2.5" /> كتالوج
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="block font-mono font-semibold text-slate-800">
                            {p.sku}
                          </span>
                          {p.barcode ? (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                              <Barcode className="w-3 h-3" />
                              {p.barcode}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">بدون باركود</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-semibold block">
                            {p.base_unit_name || p.base_unit_code || p.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.category || 'عام'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                          {Number(p.cost_price || 0).toFixed(2)} {currency}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                            {Number(p.profit_margin || 0)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {Number(p.selling_price || 0).toFixed(2)} {currency}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => openStockModal(p)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition font-mono ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            <span>{p.current_stock || 0}</span>
                            <span className="text-[10px]">
                              {p.base_unit_name || p.unit}
                            </span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openStockModal(p)}
                              title="فحص الدفعات"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openUnitsModal(p)}
                              title="عرض الوحدات"
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <Boxes className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              title="تعديل"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              title="حذف"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={loadProducts} />
          </>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="إضافة دواء / منتج جديد"
        maxWidth="4xl"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {/* Name + SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الدواء التجاري *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: Panadol Extra 500mg"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرمز (SKU) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Barcode + Base Unit + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الباركود الدولي
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="6291100..."
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوحدة الأساسية *
              </label>
              <select
                required
                value={baseUnitId}
                onChange={(e) => setBaseUnitId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر الوحدة --</option>
                {unitsList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التصنيف الدوائي
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مسكنات، مضادات حيوية"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold text-slate-800 mb-3">
              التسعير الذكي وهامش الربح
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر التكلفة ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => handleCostPriceChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  هامش الربح (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={profitMargin}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر البيع ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-emerald-400 bg-emerald-50/50 p-2 text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sub Units */}
          <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="block text-xs font-bold text-blue-900">
                  الوحدات الفرعية
                </span>
                <span className="block text-[10px] text-blue-700 mt-0.5">
                  لكل منتج تركيبته الخاصة. مثال: شريط = 10 {baseUnitName}، باكت = 3 شرائط، كرتون = 10 باكت
                </span>
              </div>
              <button
                type="button"
                onClick={addSubUnitRow}
                disabled={subUnits.length >= unitsList.length - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة وحدة
              </button>
            </div>

            {subUnits.length === 0 ? (
              <p className="text-center text-[11px] text-slate-500 py-3">
                لا توجد وحدات فرعية. أضف "شريط" أو "باكت" لتفعيل البيع بأكثر من وحدة.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-blue-200 text-blue-900 font-bold">
                      <th className="py-2 px-2 min-w-[110px]">الوحدة</th>
                      <th className="py-2 px-2 min-w-[120px]">تعتمد على</th>
                      <th className="py-2 px-2 text-center w-20">الكمية</th>
                      <th className="py-2 px-2 text-center w-24">المعامل</th>
                      <th className="py-2 px-2 text-center w-24">سعر البيع</th>
                      <th className="py-2 px-2 text-center w-24">سعر الشراء</th>
                      <th className="py-2 px-2 text-center min-w-[120px]">الباركود</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {subUnits.map((u, idx) => {
                      const parentOptions = [
                        { id: baseUnitId, name: `أساسية (${baseUnitName})` },
                        ...subUnits
                          .filter((x, i) => i < idx && x.unit_id)
                          .map((x) => {
                            const unit = unitsList.find((ul) => ul.id === x.unit_id);
                            return { id: x.unit_id, name: unit?.name || '—' };
                          }),
                      ];

                      return (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <select
                              value={u.unit_id}
                              onChange={(e) =>
                                updateSubUnitRow(idx, { unit_id: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs"
                            >
                              <option value="">-- اختر --</option>
                              {unitsList
                                .filter((x) => x.id !== baseUnitId)
                                .filter(
                                  (x) =>
                                    x.id === u.unit_id ||
                                    !subUnits.some((s) => s.unit_id === x.id)
                                )
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.name} ({x.code})
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-1.5">
                            <select
                              value={u.parent_unit_id || baseUnitId}
                              onChange={(e) =>
                                updateSubUnitRow(idx, {
                                  parent_unit_id: e.target.value || null,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs"
                            >
                              {parentOptions.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={u.qty_in_parent}
                              onChange={(e) =>
                                updateSubUnitRow(idx, {
                                  qty_in_parent: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                              ×{u.conversion_factor}
                            </span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">
                              {baseUnitName}
                            </span>
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={u.sale_price}
                              onChange={(e) =>
                                updateSubUnitRow(idx, {
                                  sale_price: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono text-emerald-700 font-bold"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={u.purchase_price}
                              onChange={(e) =>
                                updateSubUnitRow(idx, {
                                  purchase_price: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="text"
                              value={u.barcode}
                              onChange={(e) =>
                                updateSubUnitRow(idx, { barcode: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeSubUnitRow(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الحد الأدنى لتنبيه نواقص المخزون
            </label>
            <input
              type="number"
              min="0"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(Number(e.target.value))}
              className="w-full sm:w-48 rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="تعديل بيانات المنتج"
        maxWidth="3xl"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الدواء التجاري *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرمز (SKU)
              </label>
              <input
                type="text"
                disabled
                value={sku}
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الباركود
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التصنيف
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold text-slate-800 mb-3">
              التسعير وهامش الربح
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر التكلفة ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => handleCostPriceChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  هامش الربح (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={profitMargin}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر البيع ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono font-bold text-emerald-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حد الأمان للمخزون
              </label>
              <input
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(Number(e.target.value))}
                className="w-32 rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="p_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="p_active" className="text-xs font-bold text-slate-700">
                صنف مفعل ومتاح للبيع
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'تحديث المنتج'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isStockOpen}
          onClose={() => setIsStockOpen(false)}
          title={`دفعات ومخزون: ${selectedProduct.name}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">الرمز</span>
                <span className="font-mono font-semibold">{selectedProduct.sku}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">إجمالي المخزون</span>
                <span className="font-mono font-bold text-slate-900">
                  {stockSummary?.total ?? selectedProduct.current_stock ?? 0}{' '}
                  {stockSummary?.base_unit?.name || selectedProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">محجوز</span>
                <span className="font-mono font-bold text-amber-700">
                  {stockSummary?.reserved ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">متاح</span>
                <span className="font-mono font-bold text-emerald-700">
                  {stockSummary?.available ?? 0}
                </span>
              </div>
            </div>

            {stockLoading ? (
              <LoadingSpinner message="جاري جلب الدفعات..." />
            ) : stockDetails.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                لا توجد دفعات مخزنية مسجلة
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">المستودع</th>
                      <th className="py-2.5 px-3">رقم التشغيلة</th>
                      <th className="py-2.5 px-3">تاريخ الصلاحية</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">سعر التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockDetails.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {b.warehouse_name || 'المستودع الرئيسي'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {b.batch_number || 'عام'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {b.expiry_date ? String(b.expiry_date).slice(0, 10) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 font-mono">
                          {b.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {Number(b.cost_price || 0).toFixed(2)} {currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStockOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Units Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isUnitsOpen}
          onClose={() => setIsUnitsOpen(false)}
          title={`وحدات القياس: ${selectedProduct.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {unitsLoading ? (
              <LoadingSpinner message="جاري تحميل الوحدات..." />
            ) : productUnits.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                لا توجد وحدات مسجلة
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">الوحدة</th>
                      <th className="py-2.5 px-3 text-center">المعامل</th>
                      <th className="py-2.5 px-3 text-center">سعر البيع</th>
                      <th className="py-2.5 px-3 text-center">سعر الشراء</th>
                      <th className="py-2.5 px-3 text-center">أساسية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productUnits.map((u) => (
                      <tr key={u.unit_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {u.unit_name}{' '}
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({u.unit_code})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          ×{u.conversion_factor}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700">
                          {u.sale_price != null
                            ? `${Number(u.sale_price).toFixed(2)} ${currency}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {u.purchase_price != null
                            ? `${Number(u.purchase_price).toFixed(2)} ${currency}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.is_base_unit ? (
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                              أساسية
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUnitsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};