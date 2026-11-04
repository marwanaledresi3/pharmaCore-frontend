import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Search,
  Plus,
  RefreshCw,
  Layers,
  MapPin,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { warehousesApi } from '../api/warehousesApi';
import { productsApi } from '../api/productsApi';
import { Warehouse, Batch, Product } from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const WarehousesPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [tab, setTab] = useState<'warehouses' | 'batches'>('warehouses');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expiringOnly, setExpiringOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warehouse modal
  const [isAddWhOpen, setIsAddWhOpen] = useState(false);
  const [isEditWhOpen, setIsEditWhOpen] = useState(false);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  // Batch modal
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchQty, setBatchQty] = useState<number | string>(1);
  const [batchCost, setBatchCost] = useState<number | string>(0);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [whRes, batchRes, prodRes] = await Promise.all([
        warehousesApi.list(),
        warehousesApi.listBatches({ expiring_soon: expiringOnly || undefined }),
        productsApi.list({ limit: 100 }),
      ]);
      setWarehouses(whRes.items);
      setBatches(batchRes.items);
      setProducts(prodRes.items);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات المستودعات والمخزون');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [expiringOnly]);

  const handleAddWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) {
      setFormError('اسم المستودع مطلوب');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await warehousesApi.create({
        name: whName.trim(),
        location: whLocation.trim() || undefined,
      });
      setIsAddWhOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المستودع');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedWarehouseId || !batchNumber.trim() || !expiryDate) {
      setFormError('يرجى ملء جميع الحقول المطلوبة للدُفعة');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await warehousesApi.createBatch({
        product_id: selectedProductId,
        warehouse_id: selectedWarehouseId,
        batch_number: batchNumber.trim(),
        expiry_date: expiryDate.slice(0, 10),
        quantity: Number(batchQty) || 1,
        cost_price: Number(batchCost) || 0,
      });
      setIsAddBatchOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة الدفعة');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">المستودعات والدفعات</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة مواقع التخزين، تشغيلات الأدوية (Batches)، وتتبع تواريخ الصلاحية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'warehouses' ? (
            <button
              type="button"
              onClick={() => {
                setWhName('');
                setWhLocation('');
                setFormError(null);
                setIsAddWhOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              إضافة مستودع جديد
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedProductId(products[0]?.id || '');
                setSelectedWarehouseId(warehouses[0]?.id || '');
                setBatchNumber(`B-${Math.floor(1000 + Math.random() * 9000)}`);
                setExpiryDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                setBatchQty(10);
                setBatchCost(0);
                setFormError(null);
                setIsAddBatchOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              تسجيل تشغيلة/دفعة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTab('warehouses')}
            className={`pb-3 text-xs font-bold border-b-2 transition ${
              tab === 'warehouses'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            المستودعات ومواقع التخزين ({warehouses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('batches')}
            className={`pb-3 text-xs font-bold border-b-2 transition ${
              tab === 'batches'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الدفعات وتواريخ الصلاحية ({batches.length})
          </button>
        </div>

        {tab === 'batches' && (
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="exp_filter"
              checked={expiringOnly}
              onChange={(e) => setExpiringOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="exp_filter" className="text-xs font-semibold text-slate-700 cursor-pointer">
              قريبة الانتهاء فقط (خلال 90 يوم)
            </label>
          </div>
        )}
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner message="جاري تحميل المستودعات والمخزون..." fullHeight />
      ) : tab === 'warehouses' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <WarehouseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                    {wh.location ? (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {wh.location}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">بدون موقع محدد</span>
                    )}
                  </div>
                </div>

                <StatusBadge status={wh.is_active ? 'active' : 'inactive'} />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>تاريخ الإنشاء:</span>
                <span className="font-mono">
                  {wh.created_at ? new Date(wh.created_at).toLocaleDateString('ar-EG') : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Batches Table */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {batches.length === 0 ? (
            <EmptyState
              title="لا توجد دفعات مسجلة"
              description="يتم تسجيل الدفعات تلقائياً عند تأكيد أوامر الشراء أو يمكنك تسجيلها يدوياً."
              icon={<Layers className="w-8 h-8" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم التشغيلة (Batch #)</th>
                    <th className="py-3 px-4">اسم الدواء</th>
                    <th className="py-3 px-4">المستودع</th>
                    <th className="py-3 px-4 text-center">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 text-center">الكمية المتوفرة</th>
                    <th className="py-3 px-4 text-center">سعر التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => {
                    const expiry = b.expiry_date ? new Date(b.expiry_date) : null;
                    const isExpired = expiry && expiry.getTime() < Date.now();
                    const isExpiringSoon =
                      expiry && !isExpired && expiry.getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {b.batch_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {b.product_name || 'منتج صيدلاني'}
                          {b.sku && <span className="text-slate-400 mr-1.5 font-mono">({b.sku})</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {b.warehouse_name || 'المستودع الرئيسي'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800'
                                : isExpiringSoon
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {(isExpired || isExpiringSoon) && <AlertTriangle className="w-3 h-3" />}
                            {b.expiry_date ? String(b.expiry_date).slice(0, 10) : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                          {b.quantity}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {Number(b.cost_price || 0).toFixed(2)} {currency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Warehouse Modal */}
      <Modal isOpen={isAddWhOpen} onClose={() => setIsAddWhOpen(false)} title="إضافة مستودع جديد">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddWhSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستودع *</label>
            <input
              type="text"
              required
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              placeholder="مثال: المستودع المركزي، مخزن الصيدلية"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الموقع أو العنوان</label>
            <input
              type="text"
              value={whLocation}
              onChange={(e) => setWhLocation(e.target.value)}
              placeholder="مثال: الطابق الأرضي، صنعاء، شارع حائل"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddWhOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ المستودع'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal isOpen={isAddBatchOpen} onClose={() => setIsAddBatchOpen(false)} title="تسجيل تشغيلة (Batch) جديدة">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddBatchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الدواء / الصنف *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المستودع المستلم *</label>
            <select
              required
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم التشغيلة (Batch No) *</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ انتهاء الصلاحية *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الكمية *</label>
              <input
                type="number"
                required
                min="1"
                value={batchQty}
                onChange={(e) => setBatchQty(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سعر التكلفة للوحدة ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchCost}
                onChange={(e) => setBatchCost(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ التشغيلة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
