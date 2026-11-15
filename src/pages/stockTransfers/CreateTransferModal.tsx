import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ArrowLeftRight, Search, Plus, Trash2,
  Warehouse as WarehouseIcon, Package, Calculator,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { stockTransfersApi } from '../../api/stockTransfersApi';
import { warehousesApi } from '../../api/warehousesApi';
import { stockAdjustmentsApi } from '../../api/stockAdjustmentsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Warehouse} from '../../types';
interface AvailableItem {
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

interface TransferLine {
  _key: string;  // فريد
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  from_batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  available_quantity: number;
  quantity: number | '';
  unit_cost: number;
  notes: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId?: string) => void;
}

export const CreateTransferModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  // ═══ State ═══
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [lines, setLines] = useState<TransferLine[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══ Load warehouses ═══
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const list = await warehousesApi.list({ is_active: true });
        setWarehouses(list);
      } catch (err: any) {
        setError(err?.message || 'تعذر تحميل المستودعات');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  // ═══ Load available items when from warehouse changes ═══
  useEffect(() => {
    if (!isOpen || !fromWarehouseId) {
      setAvailableItems([]);
      return;
    }
    setAvailableLoading(true);
    (async () => {
      try {
        const res = await stockAdjustmentsApi.getWarehouseProducts(fromWarehouseId);
        setAvailableItems(res.items);
      } catch (err: any) {
        setError(err?.message || 'تعذر تحميل المنتجات');
      } finally {
        setAvailableLoading(false);
      }
    })();
  }, [isOpen, fromWarehouseId]);

  // ═══ Reset on close ═══
  useEffect(() => {
    if (!isOpen) {
      setLines([]);
      setSearch('');
      setError(null);
      setNotes('');
      setFromWarehouseId('');
      setToWarehouseId('');
    }
  }, [isOpen]);

  // ═══ Filtered available ═══
  const filteredAvailable = useMemo(() => {
    const usedKeys = new Set(lines.map((l) => `${l.product_id}-${l.from_batch_id || 'nobatch'}`));
    return availableItems.filter((it) => {
      const key = `${it.product_id}-${it.batch_id || 'nobatch'}`;
      if (usedKeys.has(key)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        it.product_name.toLowerCase().includes(q) ||
        it.product_sku.toLowerCase().includes(q) ||
        (it.batch_number && it.batch_number.toLowerCase().includes(q))
      );
    });
  }, [availableItems, lines, search]);

  // ═══ Stats ═══
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    for (const line of lines) {
      if (line.quantity === '' || line.quantity === null) continue;
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      totalQty += qty;
      totalValue += qty * Number(line.unit_cost || 0);
    }
    return { totalLines: lines.length, totalQty, totalValue };
  }, [lines]);

  // ═══ Handlers ═══
  const addItem = (item: AvailableItem) => {
    setLines((prev) => [
      ...prev,
      {
        _key: `${item.product_id}-${item.batch_id || 'nobatch'}-${Date.now()}`,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_unit: item.product_unit,
        from_batch_id: item.batch_id,
        batch_number: item.batch_number,
        batch_expiry: item.batch_expiry,
        available_quantity: item.system_quantity,
        quantity: '',
        unit_cost: Number(item.cost_price || 0),
        notes: '',
      },
    ]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const updateLine = (key: string, field: keyof TransferLine, value: any) => {
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

    if (!fromWarehouseId) return setError('اختر المستودع المصدر');
    if (!toWarehouseId) return setError('اختر المستودع الوجهة');
    if (fromWarehouseId === toWarehouseId) return setError('المستودعان يجب أن يكونا مختلفين');
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
      const res = await stockTransfersApi.create({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        transfer_date: transferDate,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({
          product_id: l.product_id,
          from_batch_id: l.from_batch_id,
          quantity: Number(l.quantity),
          unit_cost: l.unit_cost,
          notes: l.notes || undefined,
        })),
      });
      onCreated(res.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء التحويل');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);
  const canSubmit =
    fromWarehouseId &&
    toWarehouseId &&
    fromWarehouseId !== toWarehouseId &&
    lines.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">تحويل مخزون جديد</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <ErrorAlert message={error} />}

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="جاري تحميل المستودعات..." />
            </div>
          ) : (
            <>
              {/* ─── Step 1: Warehouses ─── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    من مستودع (المصدر) *
                  </label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => {
                      setFromWarehouseId(e.target.value);
                      setLines([]);  // مسح البنود عند تغيير المصدر
                    }}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
                  >
                    <option value="">-- اختر --</option>
                    {warehouses.map((w) => (
                      <option
                        key={w.id}
                        value={w.id}
                        disabled={w.id === toWarehouseId}
                      >
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end justify-center">
                  <div className="hidden md:block pb-2">
                    <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    إلى مستودع (الوجهة) *
                  </label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
                  >
                    <option value="">-- اختر --</option>
                    {warehouses.map((w) => (
                      <option
                        key={w.id}
                        value={w.id}
                        disabled={w.id === fromWarehouseId}
                      >
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* تاريخ + ملاحظات */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ التحويل
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    disabled={saving}
                    placeholder="مثال: تحويل بضاعة للمستودع الفرعي"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* ─── Step 2: Items ─── */}
              {fromWarehouseId && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900">
                        المنتجات المتاحة في {fromWarehouse?.name || 'المصدر'}
                      </h3>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="بحث في المنتجات المتاحة..."
                      className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Available items — chips */}
                  {availableLoading ? (
                    <div className="py-8">
                      <LoadingSpinner message="جاري تحميل المنتجات..." />
                    </div>
                  ) : filteredAvailable.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        {search ? 'لا توجد نتائج' : 'كل المنتجات المتاحة مضافة'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                      {filteredAvailable.slice(0, 50).map((item) => (
                        <button
                          key={`${item.product_id}-${item.batch_id || 'nobatch'}`}
                          type="button"
                          onClick={() => addItem(item)}
                          disabled={saving}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs hover:bg-emerald-50 rounded-lg transition text-right disabled:opacity-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {item.product_sku}
                              {item.batch_number && ` · ${item.batch_number}`}
                            </p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-[10px] text-slate-500">متاح</p>
                            <p className="font-mono font-bold text-emerald-700">
                              {Number(item.system_quantity).toFixed(2)}
                            </p>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected lines */}
                  {lines.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-right px-3 py-2 font-bold text-slate-700">المنتج</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-700">الدفعة</th>
                            <th className="text-center px-3 py-2 font-bold text-slate-700">متاح</th>
                            <th className="text-center px-3 py-2 font-bold text-slate-700 w-28">الكمية</th>
                            <th className="text-center px-3 py-2 font-bold text-slate-700">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line) => (
                            <tr key={line._key} className="border-b border-slate-100">
                              <td className="px-3 py-2">
                                <p className="font-bold text-slate-800">{line.product_name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {line.product_sku}
                                </p>
                              </td>
                              <td className="px-3 py-2">
                                {line.batch_number ? (
                                  <div>
                                    <p className="font-mono text-[10px]">{line.batch_number}</p>
                                    {line.batch_expiry && (
                                      <p className="text-[9px] text-slate-500">
                                        ينتهي: {new Date(line.batch_expiry).toLocaleDateString('ar-EG')}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-slate-700">
                                {Number(line.available_quantity).toFixed(2)}
                              </td>
                              <td className="px-3 py-2">
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
                                    className="w-full px-2 py-1 text-xs text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => fillMax(line._key)}
                                    disabled={saving}
                                    className="px-1.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                                    title="الحد الأقصى"
                                  >
                                    MAX
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Stats */}
                  {lines.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500">البنود</p>
                        <p className="text-base font-black text-slate-800">{stats.totalLines}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-700">الكمية الإجمالية</p>
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

                  {/* Info alert */}
                  {fromWarehouseId && toWarehouseId && (
                    <div className="flex items-start gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">
                        عند حفظ التحويل كمسودة، لا تتغير الكميات. عند تأكيده، ستُنقل الكميات
                        من <strong>{fromWarehouse?.name}</strong> إلى <strong>{toWarehouse?.name}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-600">
            {lines.length > 0 && (
              <>
                <span className="font-bold">{stats.totalLines}</span> بند ·{' '}
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