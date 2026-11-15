import React, { useState, useEffect, useMemo } from 'react';
import {
  X, PackageCheck, Plus, Trash2, Search, Calculator,
  CheckCircle, AlertTriangle, Truck, CreditCard, Banknote,
} from 'lucide-react';
import { goodsReceiptsApi } from '../../api/goodsReceiptsApi';
import { suppliersApi } from '../../api/suppliersApi';
import { warehousesApi } from '../../api/warehousesApi';
import { productsApi } from '../../api/productsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Warehouse } from '@/src/types';
import { FileDown } from 'lucide-react';
import { pdfApi } from '../../api/pdfApi1';

interface LineItem {
  _key: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
  batch_number: string;
  expiry_date: string;
  quantity: number | '';
  unit_price: number | '';
  discount_rate: number | '';
  tax_rate: number | '';
}

const newLine = (): LineItem => ({
  _key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  product_id: '',
  product_name: '',
  product_sku: '',
  product_unit: '',
  batch_number: '',
  expiry_date: '',
  quantity: '',
  unit_price: '',
  discount_rate: 0,
  tax_rate: 0,
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId?: string) => void;
}

export const CreateGoodsReceiptModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('credit');
  const [notes, setNotes] = useState('');

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const [supRes, whRes, prodRes] = await Promise.all([
          suppliersApi.list({ limit: 100 }).catch(() => ({ items: [] })),
          warehousesApi.list({ is_active: true }).catch(() => []),
          productsApi.list({ limit: 200, is_active: true }).catch(() => ({ items: [] })),
        ]);
        setSuppliers(supRes.items || []);
        setWarehouses(whRes || []);
        setProducts(prodRes.items || []);
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

  useEffect(() => {
    if (!isOpen) {
      setSupplierId(''); setWarehouseId('');
      setReceiptDate(new Date().toISOString().slice(0, 10));
      setPaymentType('credit'); setNotes('');
      setLines([newLine()]); setError(null);
      setSupplierSearch(''); setProductSearch({});
    }
  }, [isOpen]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q))
    );
  }, [suppliers, supplierSearch]);

  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: value } : l)));
  };

  const selectProduct = (lineKey: string, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) =>
      prev.map((l) =>
        l._key === lineKey
          ? {
              ...l,
              product_id: p.id,
              product_name: p.name,
              product_sku: p.sku,
              product_unit: p.unit,
              unit_price: Number(p.cost_price) || 0,
            }
          : l
      )
    );
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (key: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    for (const line of lines) {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      if (qty <= 0) continue;
      const gross = qty * price;
      const disc = (gross * (Number(line.discount_rate) || 0)) / 100;
      const net = gross - disc;
      const tax = (net * (Number(line.tax_rate) || 0)) / 100;
      subtotal += net;
      taxTotal += tax;
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round((subtotal + taxTotal) * 100) / 100,
    };
  }, [lines]);

  const handleSubmit = async () => {
    setError(null);
    if (!supplierId) return setError('اختر المورد');
    if (!warehouseId) return setError('اختر المستودع');

    const validLines = lines.filter(
      (l) => l.product_id && Number(l.quantity) > 0
    );
    if (validLines.length === 0) {
      return setError('أضف بنداً واحداً على الأقل مع منتج وكمية');
    }

    setSaving(true);
    try {
      const res = await goodsReceiptsApi.create({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        receipt_date: receiptDate,
        payment_type: paymentType,
        notes: notes.trim() || undefined,
        items: validLines.map((l) => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          batch_number: l.batch_number.trim() || undefined,
          expiry_date: l.expiry_date || undefined,
          discount_rate: Number(l.discount_rate) || 0,
          tax_rate: Number(l.tax_rate) || 0,
        })),
      });
      onCreated(res.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الإذن');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" dir="rtl" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">إذن استلام جديد</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <ErrorAlert message={error} />}
          {loading ? (
            <div className="py-12"><LoadingSpinner message="جاري التحميل..." /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="ابحث..."
                      className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">-- اختر مورداً --</option>
                    {filteredSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستودع *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">-- اختر --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('cash')}
                      className={`flex items-center justify-center gap-1 px-2 py-2 text-xs font-bold rounded-xl border ${
                        paymentType === 'cash'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" /> نقدي
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('credit')}
                      className={`flex items-center justify-center gap-1 px-2 py-2 text-xs font-bold rounded-xl border ${
                        paymentType === 'credit'
                          ? 'bg-amber-50 border-amber-600 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> آجل
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Lines */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-900">البنود ({lines.length})</h3>
                  <button
                    onClick={addLine}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة بند
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-right px-2 py-2 font-bold text-slate-700 min-w-[180px]">المنتج *</th>
                        <th className="text-right px-2 py-2 font-bold text-slate-700">الدفعة</th>
                        <th className="text-right px-2 py-2 font-bold text-slate-700">الانتهاء</th>
                        <th className="text-center px-2 py-2 font-bold text-slate-700 w-20">الكمية</th>
                        <th className="text-center px-2 py-2 font-bold text-slate-700 w-24">السعر</th>
                        <th className="text-center px-2 py-2 font-bold text-slate-700 w-16">خصم%</th>
                        <th className="text-center px-2 py-2 font-bold text-slate-700 w-16">ضريبة%</th>
                        <th className="text-left px-2 py-2 font-bold text-slate-700 w-24">الإجمالي</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => {
                        const qty = Number(line.quantity) || 0;
                        const price = Number(line.unit_price) || 0;
                        const gross = qty * price;
                        const disc = (gross * (Number(line.discount_rate) || 0)) / 100;
                        const net = gross - disc;
                        const tax = (net * (Number(line.tax_rate) || 0)) / 100;
                        const total = net + tax;

                        return (
                          <tr key={line._key} className="border-b border-slate-100">
                            <td className="px-2 py-1.5">
                              <select
                                value={line.product_id}
                                onChange={(e) => selectProduct(line._key, e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                              >
                                <option value="">-- اختر --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="text"
                                value={line.batch_number}
                                onChange={(e) => updateLine(line._key, 'batch_number', e.target.value)}
                                placeholder="B2401"
                                className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="date"
                                value={line.expiry_date}
                                onChange={(e) => updateLine(line._key, 'expiry_date', e.target.value)}
                                className="w-full px-1 py-1.5 text-xs border border-slate-200 rounded-lg"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="number"
                                min={0}
                                step="0.001"
                                value={line.quantity}
                                onChange={(e) => updateLine(line._key, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg font-mono"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={line.unit_price}
                                onChange={(e) => updateLine(line._key, 'unit_price', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg font-mono"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={line.discount_rate}
                                onChange={(e) => updateLine(line._key, 'discount_rate', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg font-mono"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={line.tax_rate}
                                onChange={(e) => updateLine(line._key, 'tax_rate', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg font-mono"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-left font-mono font-bold text-slate-800">
                              {total > 0 ? total.toFixed(2) : '—'}
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <button
                                onClick={() => removeLine(line._key)}
                                disabled={lines.length === 1}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30"
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
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500">المجموع</p>
                  <p className="text-sm font-black font-mono">{totals.subtotal.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                  <p className="text-[10px] font-bold text-sky-700">الضريبة</p>
                  <p className="text-sm font-black font-mono text-sky-800">{totals.taxTotal.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700">الإجمالي</p>
                  <p className="text-base font-black font-mono text-emerald-800">{totals.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  عند التأكيد، ستُضاف الكميات للمخزون في المستودع، ويُنشأ قيد محاسبي:
                  {paymentType === 'cash'
                    ? ' Dr مخزون / Cr صندوق'
                    : ' Dr مخزون / Cr ذمم موردين'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-600">
            {lines.length} بند · {totals.total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-50">
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || totals.total <= 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40"
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</>
              ) : (
                <><CheckCircle className="w-4 h-4" />حفظ كمسودة</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};