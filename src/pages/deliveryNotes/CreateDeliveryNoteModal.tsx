import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Truck, Search, Plus, Trash2, User, MapPin, Phone,
  Car, Package, Calculator, CheckCircle, AlertTriangle,
  Warehouse as WarehouseIcon, Link2,
} from 'lucide-react';
import { deliveryNotesApi } from '../../api/deliveryNotesApi';
import { customersApi } from '../../api/customersApi';
import { warehousesApi } from '../../api/warehousesApi';
import { salesOrdersApi } from '../../api/salesOrdersApi';
import { stockAdjustmentsApi } from '../../api/stockAdjustmentsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Warehouse } from '@/src/types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface AvailableProduct {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  system_quantity: number;
  cost_price: number;
}

interface LineItem {
  _key: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  available_quantity: number;
  quantity: number | '';
  unit_price: number | '';
  description: string;
}

const newLine = (p: AvailableProduct): LineItem => ({
  _key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  product_id: p.product_id,
  product_name: p.product_name,
  product_sku: p.product_sku,
  product_unit: p.product_unit,
  batch_id: p.batch_id,
  batch_number: p.batch_number,
  batch_expiry: p.batch_expiry,
  available_quantity: p.system_quantity,
  quantity: '',
  unit_price: '',
  description: '',
});

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId?: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const CreateDeliveryNoteModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  // ─── Header ───
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [salesOrderId, setSalesOrderId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // ─── Data ───
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);

  // ─── UI ───
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Search ───
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // ═══ Load customers + warehouses ═══
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const [custRes, whRes] = await Promise.all([
          customersApi.list({ limit: 100 }).catch(() => ({ items: [] })),
          warehousesApi.list({ is_active: true }).catch(() => []),
        ]);
        setCustomers(custRes.items || []);
        setWarehouses(whRes || []);
        if (whRes.length > 0 && !warehouseId) {
          const def = whRes.find((w) => w.is_default) || whRes[0];
          setWarehouseId(def.id);
        }
      } catch (err: any) {
        setError(err?.message || 'تعذر تحميل البيانات');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ═══ Load sales orders when customer changes ═══
  useEffect(() => {
    if (!isOpen || !customerId) {
      setSalesOrders([]);
      setSalesOrderId('');
      return;
    }
    (async () => {
      try {
        const res = await salesOrdersApi.list({
          customer_id: customerId,
          status: 'confirmed',
          limit: 50,
        }).catch(() => ({ items: [] }));
        setSalesOrders(res.items || []);
      } catch {
        /* silent */
      }
    })();
  }, [isOpen, customerId]);

  // ═══ Load available products when warehouse changes ═══
  useEffect(() => {
    if (!isOpen || !warehouseId) {
      setAvailableProducts([]);
      return;
    }
    setProductsLoading(true);
    (async () => {
      try {
        const res = await stockAdjustmentsApi.getWarehouseProducts(warehouseId);
        setAvailableProducts(res.items || []);
      } catch {
        setAvailableProducts([]);
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [isOpen, warehouseId]);

  // ═══ Auto-fill address from customer ═══
  useEffect(() => {
    const c = customers.find((x) => x.id === customerId);
    if (c && !deliveryAddress) {
      setDeliveryAddress(c.address || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // ═══ Reset on close ═══
  useEffect(() => {
    if (!isOpen) {
      setCustomerId('');
      setWarehouseId('');
      setDeliveryDate(new Date().toISOString().slice(0, 10));
      setSalesOrderId('');
      setDriverName('');
      setDriverPhone('');
      setVehicleNumber('');
      setDeliveryAddress('');
      setNotes('');
      setLines([]);
      setCustomerSearch('');
      setProductSearch('');
      setShowProductPicker(false);
      setError(null);
    }
  }, [isOpen]);

  // ═══ Filtered lists ═══
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const filteredAvailable = useMemo(() => {
    const usedKeys = new Set(
      lines.map((l) => `${l.product_id}-${l.batch_id || 'nobatch'}`)
    );
    return availableProducts.filter((p) => {
      const key = `${p.product_id}-${p.batch_id || 'nobatch'}`;
      if (usedKeys.has(key)) return false;
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        p.product_name.toLowerCase().includes(q) ||
        p.product_sku.toLowerCase().includes(q) ||
        (p.batch_number && p.batch_number.toLowerCase().includes(q))
      );
    });
  }, [availableProducts, lines, productSearch]);

  // ═══ Stats ═══
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    for (const line of lines) {
      if (line.quantity === '' || line.quantity === null) continue;
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      totalQty += qty;
      totalValue += qty * Number(line.unit_price || 0);
    }
    return { totalLines: lines.length, totalQty, totalValue };
  }, [lines]);

  // ═══ Handlers ═══
  const addProduct = (p: AvailableProduct) => {
    setLines((prev) => [...prev, newLine(p)]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, [field]: value } : l))
    );
  };

  const fillMax = (key: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l._key === key ? { ...l, quantity: Number(l.available_quantity) } : l
      )
    );
  };

  // ═══ Submit ═══
  const handleSubmit = async () => {
    setError(null);

    if (!customerId) return setError('اختر العميل');
    if (!warehouseId) return setError('اختر المستودع');
    if (lines.length === 0) return setError('أضف بنداً واحداً على الأقل');

    for (const line of lines) {
      if (line.quantity === '' || line.quantity === null) {
        return setError(`أدخل كمية للمنتج: ${line.product_name}`);
      }
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return setError(`كمية غير صالحة للمنتج: ${line.product_name}`);
      }
      if (qty > Number(line.available_quantity) + 0.001) {
        return setError(
          `الكمية المطلوبة (${qty}) تتجاوز المتاح (${line.available_quantity}) للمنتج: ${line.product_name}`
        );
      }
    }

    setSaving(true);
    try {
      const res = await deliveryNotesApi.create({
        customer_id: customerId,
        warehouse_id: warehouseId,
        delivery_date: deliveryDate,
        sales_order_id: salesOrderId || undefined,
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        vehicle_number: vehicleNumber.trim() || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({
          product_id: l.product_id,
          batch_id: l.batch_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price) || 0,
          description: l.description.trim() || undefined,
        })),
      });
      onCreated(res.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء المذكرة');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const canSubmit = customerId && warehouseId && lines.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">مذكرة تسليم جديدة</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══ Body ═══ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <ErrorAlert message={error} />}

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="جاري تحميل البيانات..." />
            </div>
          ) : (
            <>
              {/* ─── 1) العميل + المستودع ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العميل *
                  </label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الهاتف..."
                      disabled={saving}
                      className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-2"
                    />
                  </div>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">-- اختر عميلاً --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `— ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المستودع المصدر *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => {
                      setWarehouseId(e.target.value);
                      setLines([]);
                    }}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">-- اختر --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.is_default ? '(افتراضي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ─── 2) بيانات الشحن ─── */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                  بيانات الشحن (اختياري)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      اسم السائق
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      maxLength={150}
                      disabled={saving}
                      placeholder="محمد علي"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      هاتف السائق
                    </label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      maxLength={50}
                      disabled={saving}
                      placeholder="+967 77 000 0000"
                      dir="ltr"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      رقم المركبة
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      maxLength={50}
                      disabled={saving}
                      placeholder="1234 ABC"
                      dir="ltr"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ─── 3) عنوان التسليم ─── */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  عنوان التسليم
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  maxLength={1000}
                  disabled={saving}
                  placeholder="المدينة، الحي، الشارع..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ─── 4) تاريخ + أمر بيع + ملاحظات ─── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ التسليم
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5" />
                    ربط بأمر بيع (اختياري)
                  </label>
                  <select
                    value={salesOrderId}
                    onChange={(e) => setSalesOrderId(e.target.value)}
                    disabled={saving || !customerId || salesOrders.length === 0}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white disabled:opacity-50"
                  >
                    <option value="">بدون ربط</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.order_number} — {Number(so.total || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    disabled={saving}
                    placeholder="ملاحظات..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* ─── 5) البنود ─── */}
              {warehouseId && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        البنود ({lines.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(!showProductPicker)}
                      disabled={saving || productsLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة منتج
                    </button>
                  </div>

                  {/* Product picker */}
                  {showProductPicker && (
                    <div className="mb-3 border border-emerald-200 bg-emerald-50/50 rounded-xl p-2">
                      <div className="relative mb-2">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="ابحث عن منتج..."
                          autoFocus
                          className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      {productsLoading ? (
                        <div className="py-4 text-center text-xs text-slate-500">جاري التحميل...</div>
                      ) : filteredAvailable.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500">
                          {availableProducts.length === 0
                            ? 'لا توجد منتجات في هذا المستودع'
                            : 'كل المنتجات مضافة'}
                        </p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredAvailable.slice(0, 50).map((p) => (
                            <button
                              key={`${p.product_id}-${p.batch_id || 'nobatch'}`}
                              type="button"
                              onClick={() => addProduct(p)}
                              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs bg-white hover:bg-emerald-100 rounded-lg text-right transition"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">
                                  {p.product_name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {p.product_sku}
                                  {p.batch_number && ` · ${p.batch_number}`}
                                </p>
                              </div>
                              <div className="text-left shrink-0">
                                <p className="text-[10px] text-slate-500">متاح</p>
                                <p className="font-mono font-bold text-emerald-700">
                                  {Number(p.system_quantity).toFixed(2)}
                                </p>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lines table */}
                  {lines.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-right px-2 py-2 font-bold text-slate-700">المنتج</th>
                            <th className="text-right px-2 py-2 font-bold text-slate-700">الدفعة</th>
                            <th className="text-center px-2 py-2 font-bold text-slate-700 w-20">متاح</th>
                            <th className="text-center px-2 py-2 font-bold text-slate-700 w-28">الكمية</th>
                            <th className="text-center px-2 py-2 font-bold text-slate-700 w-24">السعر</th>
                            <th className="text-left px-2 py-2 font-bold text-slate-700 w-24">الإجمالي</th>
                            <th className="px-1 py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line) => {
                            const qty = Number(line.quantity) || 0;
                            const price = Number(line.unit_price) || 0;
                            const total = qty * price;

                            return (
                              <tr key={line._key} className="border-b border-slate-100">
                                <td className="px-2 py-1.5">
                                  <p className="font-bold text-slate-800 truncate">
                                    {line.product_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {line.product_sku}
                                  </p>
                                </td>
                                <td className="px-2 py-1.5 text-[10px] text-slate-600 font-mono">
                                  {line.batch_number || '—'}
                                  {line.batch_expiry && (
                                    <p className="text-[9px]">
                                      {new Date(line.batch_expiry).toLocaleDateString('ar-EG')}
                                    </p>
                                  )}
                                </td>
                                <td className="px-2 py-1.5 text-center font-mono text-slate-700">
                                  {Number(line.available_quantity).toFixed(2)}
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={Number(line.available_quantity)}
                                      step="0.001"
                                      value={line.quantity}
                                      onChange={(e) =>
                                        updateLine(
                                          line._key,
                                          'quantity',
                                          e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                      }
                                      disabled={saving}
                                      placeholder="0"
                                      className="w-full px-1.5 py-1 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => fillMax(line._key)}
                                      disabled={saving}
                                      className="px-1 py-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                                      title="الحد الأقصى"
                                    >
                                      MAX
                                    </button>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={line.unit_price}
                                    onChange={(e) =>
                                      updateLine(
                                        line._key,
                                        'unit_price',
                                        e.target.value === '' ? '' : Number(e.target.value)
                                      )
                                    }
                                    disabled={saving}
                                    placeholder="0"
                                    className="w-full px-1.5 py-1 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                                  />
                                </td>
                                <td className="px-2 py-1.5 text-left font-mono font-bold text-slate-800">
                                  {total > 0 ? total.toFixed(2) : '—'}
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeLine(line._key)}
                                    disabled={saving}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        لم تُضف أي بند. اضغط "إضافة منتج" للبدء.
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  {lines.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500">البنود</p>
                        <p className="text-base font-black text-slate-800">{stats.totalLines}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-700">الكمية</p>
                        <p className="text-base font-black text-emerald-800 font-mono">
                          {stats.totalQty.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                        <p className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                          <Calculator className="w-3 h-3" />
                          القيمة
                        </p>
                        <p className="text-base font-black text-sky-800 font-mono">
                          {stats.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  {lines.length > 0 && (
                    <div className="flex items-start gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg mt-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">
                        مذكرة التسليم <strong>لا تُنشئ قيداً محاسبياً</strong>. عند
                        "صرفها" ستُخصم الكميات من <strong>{selectedWarehouse?.name}</strong>.
                        لاحقاً يمكن تحويلها لفاتورة.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ Footer ═══ */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-600">
            {lines.length > 0 && (
              <>
                <span className="font-bold">{lines.length}</span> بند ·{' '}
                <span className="font-mono font-bold">{stats.totalQty.toFixed(2)}</span> كمية
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !canSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  حفظ كمسودة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};