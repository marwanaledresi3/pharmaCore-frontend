import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ClipboardCheck, Search, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Package, TrendingUp, TrendingDown,
  Warehouse as WarehouseIcon, Calculator,
} from 'lucide-react';
import { stockAdjustmentsApi, AdjustmentReason } from '../../api/stockAdjustmentsApi';
import { warehousesApi } from '../../api/warehousesApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Warehouse} from '../../types';
interface ProductRow {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_id: string | null;
  batch_number: string | null;
  batch_expiry: string | null;
  system_quantity: number;
  cost_price: number;
  actual_quantity: number | '';  // ← إدخال المستخدم
  notes: string;
}

const REASONS: Array<{ value: AdjustmentReason; label: string; color: string }> = [
  { value: 'physical_count', label: 'جرد فعلي',       color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'damage',         label: 'تالف',            color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'theft',          label: 'سرقة',            color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'expiry',         label: 'انتهاء صلاحية',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'error',          label: 'خطأ إدخال',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'other',          label: 'أخرى',            color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId?: string) => void;   // callback بعد الحفظ
}

export const CreateAdjustmentModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  // ═══ Step 1: Header ═══
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('physical_count');
  const [adjustmentDate, setAdjustmentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');

  // ═══ Step 2: Products ═══
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ═══ UI State ═══
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══ Load warehouses ═══
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const list = await warehousesApi.list({ is_active: true });
        setWarehouses(list);
        if (list.length > 0 && !warehouseId) {
          // اختر الافتراضي إن وُجد
          const def = list.find((w) => w.is_default) || list[0];
          setWarehouseId(def.id);
        }
      } catch (err: any) {
        setError(err?.message || 'تعذر تحميل المستودعات');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ═══ Load products when warehouse changes ═══
  useEffect(() => {
    if (!isOpen || !warehouseId) return;
    setProductsLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await stockAdjustmentsApi.getWarehouseProducts(warehouseId);
        setProducts(
          res.items.map((p) => ({
            ...p,
            actual_quantity: '',  // ← فارغ مبدئياً
            notes: '',
          }))
        );
      } catch (err: any) {
        setError(err?.message || 'تعذر تحميل المنتجات');
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [isOpen, warehouseId]);

  // ═══ Reset on close ═══
  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setSearch('');
      setExpandedRows(new Set());
      setError(null);
      setNotes('');
    }
  }, [isOpen]);

  // ═══ Filtered products ═══
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.product_sku.toLowerCase().includes(q) ||
        (p.batch_number && p.batch_number.toLowerCase().includes(q))
    );
  }, [products, search]);

  // ═══ Statistics ═══
  const stats = useMemo(() => {
    let withDiff = 0;
    let totalGain = 0;
    let totalLoss = 0;
    let totalGainValue = 0;
    let totalLossValue = 0;

    for (const p of products) {
      if (p.actual_quantity === '' || p.actual_quantity === null) continue;
      const actual = Number(p.actual_quantity);
      if (!Number.isFinite(actual)) continue;
      const diff = actual - Number(p.system_quantity);
      if (Math.abs(diff) < 0.001) continue;

      withDiff++;
      const value = Math.abs(diff) * Number(p.cost_price || 0);

      if (diff > 0) {
        totalGain += diff;
        totalGainValue += value;
      } else {
        totalLoss += Math.abs(diff);
        totalLossValue += value;
      }
    }

    return {
      withDiff,
      totalGain,
      totalLoss,
      totalGainValue,
      totalLossValue,
      netValue: totalGainValue - totalLossValue,
    };
  }, [products]);

  // ═══ Handlers ═══
  const updateProduct = (idx: number, field: 'actual_quantity' | 'notes', value: any) => {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const fillZero = () => {
    if (!window.confirm('سيتم تعيين الكمية الفعلية = 0 لكل المنتجات (افتراضي للجرد الدوري). متابعة؟')) return;
    setProducts((prev) => prev.map((p) => ({ ...p, actual_quantity: 0 })));
  };

  const clearAll = () => {
    if (!window.confirm('مسح كل الكميات المُدخلة؟')) return;
    setProducts((prev) => prev.map((p) => ({ ...p, actual_quantity: '' })));
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ═══ Submit ═══
  const handleSubmit = async () => {
    setError(null);

    if (!warehouseId) {
        setError('اختر المستودع');
        return;
    }

    const itemsToSubmit = products
        .filter((p) => p.actual_quantity !== '' && p.actual_quantity !== null)
        .map((p) => ({
        product_id: p.product_id,
        batch_id: p.batch_id,
        actual_quantity: Number(p.actual_quantity),
        unit_cost: Number(p.cost_price || 0),
        notes: p.notes || undefined,
        }));

    const withDiff = itemsToSubmit.filter((it) => {
        const orig = products.find(
        (p) => p.product_id === it.product_id && p.batch_id === it.batch_id
        );
        return orig && Math.abs(it.actual_quantity - Number(orig.system_quantity)) > 0.001;
    });

    if (withDiff.length === 0) {
        setError('لا توجد فروقات — لم تُدخل أي كمية فعلية مختلفة عن الدفترية');
        return;
    }

    setSaving(true);
    try {
        // ✅ احفظ النتيجة في متغير
        const res = await stockAdjustmentsApi.create({
        warehouse_id: warehouseId,
        reason,
        adjustment_date: adjustmentDate,
        notes: notes.trim() || undefined,
        items: itemsToSubmit,
        });
        onCreated(res.id);  // ← الآن يعمل
        onClose();
    } catch (err: any) {
        setError(err?.message || 'فشل إنشاء التسوية');
    } finally {
        setSaving(false);
    }
    };

  // ═══ Render ═══
  if (!isOpen) return null;

  const hasAnyInput = products.some((p) => p.actual_quantity !== '' && p.actual_quantity !== null);

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
        {/* ═══════ Header ═══════ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">تسوية جرد جديدة</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══════ Body (scrollable) ═══════ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <ErrorAlert message={error} />}

          {/* ─── Step 1: Header Info ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المستودع *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
              >
                <option value="">-- اختر مستودعاً --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.is_default && '(افتراضي)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ التسوية
              </label>
              <input
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* سبب */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">السبب *</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  disabled={saving}
                  className={`px-2 py-2 text-[11px] font-bold rounded-lg border transition ${
                    reason === r.value
                      ? 'ring-2 ring-emerald-500 ' + r.color
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              disabled={saving}
              placeholder="مثال: جرد نهاية شهر يناير 2026"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ─── Step 2: Products ─── */}
          {warehouseId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    المنتجات المتاحة ({filteredProducts.length})
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillZero}
                    disabled={saving || products.length === 0}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                    title="تعيين كل الكميات الفعلية = 0"
                  >
                    صفّر الكل
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={saving || !hasAnyInput}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                  >
                    مسح الكل
                  </button>
                </div>
              </div>

              {/* بحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم المنتج أو SKU أو رقم الدفعة..."
                  className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Statistics */}
              {stats.withDiff > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatBox
                    label="بنود بفروقات"
                    value={String(stats.withDiff)}
                    color="bg-slate-50 text-slate-700 border-slate-200"
                  />
                  <StatBox
                    label="زيادة (كمية)"
                    value={`+${stats.totalGain.toFixed(2)}`}
                    color="bg-emerald-50 text-emerald-700 border-emerald-200"
                  />
                  <StatBox
                    label="نقص (كمية)"
                    value={`-${stats.totalLoss.toFixed(2)}`}
                    color="bg-rose-50 text-rose-700 border-rose-200"
                  />
                  <StatBox
                    label="صافي القيمة"
                    value={`${stats.netValue >= 0 ? '+' : ''}${stats.netValue.toFixed(2)}`}
                    color={
                      stats.netValue > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : stats.netValue < 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }
                    icon={<Calculator className="w-3 h-3" />}
                  />
                </div>
              )}

              {/* Products Table */}
              {productsLoading ? (
                <div className="py-12"><LoadingSpinner message="جاري تحميل المنتجات..." /></div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">لا توجد منتجات في هذا المستودع</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-right px-3 py-2.5 font-bold text-slate-700 w-8"></th>
                        <th className="text-right px-3 py-2.5 font-bold text-slate-700">المنتج</th>
                        <th className="text-right px-3 py-2.5 font-bold text-slate-700">الدفعة</th>
                        <th className="text-center px-3 py-2.5 font-bold text-slate-700">دفترية</th>
                        <th className="text-center px-3 py-2.5 font-bold text-slate-700 w-32">فعلية</th>
                        <th className="text-center px-3 py-2.5 font-bold text-slate-700">الفرق</th>
                        <th className="text-left px-3 py-2.5 font-bold text-slate-700">القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const idx = products.indexOf(p);
                        const key = `${p.product_id}-${p.batch_id || 'nobatch'}`;
                        const expanded = expandedRows.has(key);
                        const hasActual = p.actual_quantity !== '' && p.actual_quantity !== null;
                        const actual = hasActual ? Number(p.actual_quantity) : null;
                        const diff = actual !== null ? actual - Number(p.system_quantity) : null;
                        const diffValue = diff !== null ? Math.abs(diff) * Number(p.cost_price || 0) : 0;

                        return (
                          <React.Fragment key={key}>
                            <tr
                              className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                                diff !== null && Math.abs(diff) > 0.001
                                  ? diff > 0
                                    ? 'bg-emerald-50/30'
                                    : 'bg-rose-50/30'
                                  : ''
                              }`}
                            >
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => toggleRow(key)}
                                  className="p-0.5 hover:bg-slate-200 rounded"
                                >
                                  {expanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </button>
                              </td>
                              <td className="px-3 py-2">
                                <div>
                                  <p className="font-bold text-slate-800">{p.product_name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {p.product_sku} · {p.product_unit}
                                  </p>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {p.batch_number ? (
                                  <div>
                                    <p className="font-mono text-[10px] text-slate-700">
                                      {p.batch_number}
                                    </p>
                                    {p.batch_expiry && (
                                      <p className="text-[9px] text-slate-500">
                                        ينتهي: {new Date(p.batch_expiry).toLocaleDateString('ar-EG')}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">
                                {Number(p.system_quantity).toFixed(2)}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.001"
                                  value={p.actual_quantity}
                                  onChange={(e) =>
                                    updateProduct(
                                      idx,
                                      'actual_quantity',
                                      e.target.value === '' ? '' : Number(e.target.value)
                                    )
                                  }
                                  disabled={saving}
                                  placeholder="0"
                                  className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                {diff === null ? (
                                  <span className="text-slate-300">—</span>
                                ) : Math.abs(diff) < 0.001 ? (
                                  <span className="text-slate-400 text-[10px]">0</span>
                                ) : diff > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                    <TrendingUp className="w-3 h-3" />
                                    +{diff.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold">
                                    <TrendingDown className="w-3 h-3" />
                                    {diff.toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-left font-mono text-[11px]">
                                {diff !== null && Math.abs(diff) > 0.001 ? (
                                  <span className={diff > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                    {diffValue.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            </tr>
                            {expanded && (
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <td colSpan={7} className="px-3 py-2">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                    ملاحظة على هذا البند (اختياري)
                                  </label>
                                  <input
                                    type="text"
                                    value={p.notes}
                                    onChange={(e) => updateProduct(idx, 'notes', e.target.value)}
                                    disabled={saving}
                                    placeholder="مثال: عبوة تالفة، أو سبب الفرق..."
                                    maxLength={500}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview القيد المحاسبي */}
              {stats.withDiff > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <p className="text-xs font-black text-amber-900">معاينة القيد المحاسبي</p>
                  </div>
                  {stats.netValue > 0.01 && (
                    <p className="text-[11px] text-amber-800 leading-relaxed font-mono">
                      Dr 113 (مخزون) {stats.netValue.toFixed(2)} / Cr 518 (فروقات جرد) {stats.netValue.toFixed(2)}
                      <span className="text-[10px] font-sans mr-2">← فائض جرد</span>
                    </p>
                  )}
                  {stats.netValue < -0.01 && (
                    <p className="text-[11px] text-amber-800 leading-relaxed font-mono">
                      Dr 518 (فروقات جرد) {Math.abs(stats.netValue).toFixed(2)} / Cr 113 (مخزون) {Math.abs(stats.netValue).toFixed(2)}
                      <span className="text-[10px] font-sans mr-2">← عجز جرد</span>
                    </p>
                  )}
                  <p className="text-[10px] text-amber-700 mt-1">
                    * سيُنشأ القيد تلقائياً عند تأكيد التسوية (إن كان مفعّلاً في الإعدادات)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════ Footer ═══════ */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-600">
            {products.length > 0 && (
              <>
                <span className="font-bold">{products.length}</span> منتج ·{' '}
                <span className="font-bold">{stats.withDiff}</span> بفرق
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
              disabled={saving || stats.withDiff === 0}
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

// ═══ Sub-component ═══
const StatBox: React.FC<{
  label: string;
  value: string;
  color: string;
  icon?: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <div className={`p-2 rounded-lg border ${color}`}>
    <div className="flex items-center gap-1 text-[10px] font-bold opacity-80">
      {icon}
      {label}
    </div>
    <p className="text-base font-black mt-0.5 font-mono">{value}</p>
  </div>
);