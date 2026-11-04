import React, { useState, useEffect } from 'react';
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
  Eye,
  Percent,
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { Product, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('علبة');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [profitMargin, setProfitMargin] = useState<number | string>(20);
  const [minStockLevel, setMinStockLevel] = useState<number | string>(5);
  const [isActive, setIsActive] = useState(true);

  const loadProducts = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam = isActiveFilter === 'all' ? undefined : isActiveFilter === 'active';
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
  };

  useEffect(() => {
    loadProducts(1);
  }, [isActiveFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(1);
  };

  // Auto calculate selling price from cost price + profit margin
  const handleCostPriceChange = (cost: number) => {
    setCostPrice(cost);
    if (profitMargin && Number(profitMargin) > 0) {
      const margin = Number(profitMargin);
      const calculatedSelling = Math.round(cost * (1 + margin / 100) * 100) / 100;
      setSellingPrice(calculatedSelling);
    }
  };

  const handleMarginChange = (margin: number) => {
    setProfitMargin(margin);
    if (costPrice && Number(costPrice) > 0) {
      const cost = Number(costPrice);
      const calculatedSelling = Math.round(cost * (1 + margin / 100) * 100) / 100;
      setSellingPrice(calculatedSelling);
    }
  };

  const openAddModal = () => {
    setSku(`MED-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setBarcode('');
    setUnit('علبة');
    setCategory('أدوية عامة');
    setCostPrice(0);
    setSellingPrice(0);
    setProfitMargin(20);
    setMinStockLevel(5);
    setIsActive(true);
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !unit.trim()) {
      setFormError('اسم الدواء، الرمز (SKU)، والوحدة حقول إلزامية');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await productsApi.create({
        sku: sku.trim(),
        name: name.trim(),
        unit: unit.trim(),
        barcode: barcode.trim() || undefined,
        category: category.trim() || undefined,
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        profit_margin: Number(profitMargin) || 0,
        min_stock_level: Number(minStockLevel) || 0,
      });
      setIsAddOpen(false);
      loadProducts(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المنتج');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setSku(p.sku);
    setName(p.name);
    setBarcode(p.barcode || '');
    setUnit(p.unit);
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
    if (!name.trim() || !unit.trim()) {
      setFormError('اسم الدواء والوحدة حقول إلزامية');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await productsApi.update(selectedProduct.id, {
        name: name.trim(),
        unit: unit.trim(),
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

  const openStockModal = async (p: Product) => {
    setSelectedProduct(p);
    setIsStockOpen(true);
    setStockLoading(true);
    try {
      const res = await productsApi.getStock(p.id);
      setStockDetails(Array.isArray(res) ? res : []);
    } catch {
      setStockDetails([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${productName}"؟`)) {
      return;
    }
    try {
      await productsApi.delete(id);
      loadProducts(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المنتج (قد يكون مرتبطاً بحركات مخزنية أو فواتير)');
    }
  };

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
    }));
    exportToCsv(exportData, 'products_list');
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الأدوية والمنتجات</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الكتالوج الصيدلاني، الأسعار وهامش الربح، والباركود، والأرصدة الحالية
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

      {/* Filter and Search Bar */}
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

      {error && <ErrorAlert error={error} onRetry={() => loadProducts(pagination.page)} />}

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب قائمة الأدوية والمنتجات..." fullHeight />
        ) : products.length === 0 ? (
          <EmptyState
            title="لا يوجد أدوية أو منتجات"
            description="يمكنك إضافة الأدوية والمستلزمات الطبية وتحديد أسعار التكلفة والبيع."
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
                    <th className="py-3 px-4">اسم الدواء / الصنف</th>
                    <th className="py-3 px-4">الرمز (SKU) والباركود</th>
                    <th className="py-3 px-4">الوحدة والتصنيف</th>
                    <th className="py-3 px-4 text-center">سعر التكلفة</th>
                    <th className="py-3 px-4 text-center">هامش الربح</th>
                    <th className="py-3 px-4 text-center">سعر البيع</th>
                    <th className="py-3 px-4 text-center">المخزون الحالي</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const isLowStock =
                      Number(p.current_stock || 0) <= Number(p.min_stock_level || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">{p.name}</span>
                              {!p.is_active && (
                                <span className="inline-block px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded text-[9px] font-semibold">
                                  معطل
                                </span>
                              )}
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
                          <span className="font-semibold block">{p.unit}</span>
                          <span className="text-[10px] text-slate-400 block">{p.category || 'عام'}</span>
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
                            <span className="text-[10px]">{p.unit}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openStockModal(p)}
                              title="فحص دفعات المخزون"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              title="تعديل المنتج"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              title="حذف المنتج"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة دواء / منتج جديد" maxWidth="3xl">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدواء التجاري *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">الرمز (SKU) *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الباركود الدولي</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="علبة، شريط، باكت، كرتون"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الدوائي</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مسكنات، مضادات حيوية، فيتامينات"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Profit Margin Matrix */}
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
                  max="100"
                  value={profitMargin}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر البيع النهائي ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-emerald-400 bg-emerald-50/50 p-2 text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

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
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="تعديل بيانات المنتج" maxWidth="3xl">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدواء التجاري *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الرمز (SKU)</label>
              <input
                type="text"
                disabled
                value={sku}
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الباركود</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing */}
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

      {/* Stock Details & Batches Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isStockOpen}
          onClose={() => setIsStockOpen(false)}
          title={`دفعات ومخزون: ${selectedProduct.name}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">إجمالي المخزون المتوفر:</span>
                <span className="font-bold text-slate-900 mr-2 text-sm font-mono">
                  {selectedProduct.current_stock || 0} {selectedProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500">الرمز:</span>
                <span className="font-mono text-slate-700 mr-1">{selectedProduct.sku}</span>
              </div>
            </div>

            {stockLoading ? (
              <LoadingSpinner message="جاري جلب تفاصيل دفعات المخزون..." />
            ) : stockDetails.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                لا توجد دفعات مخزنية مسجلة لهذا الصنف حالياً
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">المستودع</th>
                      <th className="py-2.5 px-3">رقم التشغيلة (Batch)</th>
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
    </div>
  );
};
