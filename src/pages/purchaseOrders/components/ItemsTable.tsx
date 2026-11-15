// components/ItemsTable.tsx
import React from 'react';
import { Plus, Trash2, Package, Warehouse } from 'lucide-react';
import { CatalogProduct, DraftItem } from '../types';

interface Props {
  items: DraftItem[];
  catalog: CatalogProduct[];
  isNetwork: boolean;
  isCatalogLoading: boolean;
  baseCurrency: string;
  defaultMarginRate: number;

  // ✅ خصم الفاتورة (ليس على البند)
  invoiceDiscountRate?: number;

  // ✅ وضع العرض
  mode?: 'purchase' | 'sale';

  onAddRow: () => void;
  onRemoveRow: (uid: string) => void;
  onChange: (uid: string, patch: Partial<DraftItem>) => void;
  onProductChange: (uid: string, productId: string) => void;
  onUnitChange: (uid: string, unitId: string | null) => void;
}

export const ItemsTable: React.FC<Props> = ({
  items,
  catalog,
  isNetwork,
  isCatalogLoading,
  baseCurrency,
  defaultMarginRate,
  invoiceDiscountRate = 0,
  mode = 'purchase',
  onAddRow,
  onRemoveRow,
  onChange,
  onProductChange,
  onUnitChange,
}) => {
  const isPurchase = mode === 'purchase';

  // ═══════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════

  const calculateLine = (it: DraftItem) => {
    const qty = Number(it.paid_quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const taxRate = Number(it.tax_rate) || 0;

    const gross = qty * price;
    const taxAmount = gross * (taxRate / 100);
    const lineTotal = gross + taxAmount;

    // ✅ سعر البيع المتوقع (للمشتريات فقط)
    const sellingPrice = isPurchase
      ? price * (1 + defaultMarginRate / 100)
      : null;

    return {
      gross,
      taxAmount,
      lineTotal,
      sellingPrice,
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-800">
            بنود {isPurchase ? 'أمر الشراء' : 'أمر البيع'}
          </h4>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
            {items.length} بند
          </span>
          {isNetwork && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              🏢 شبكي
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddRow}
          disabled={isCatalogLoading}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة بند
        </button>
      </div>

      {/* Loading / Empty states */}
      {isCatalogLoading ? (
        <div className="p-8 text-center rounded-xl border-2 border-dashed border-slate-200">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">جاري تحميل الكتالوج...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center rounded-xl border-2 border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 mb-1">لا توجد بنود</p>
          <p className="text-[11px] text-slate-500 mb-3">
            أضف بنداً واحداً على الأقل للمتابعة
          </p>
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            إضافة أول بند
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                <th className="py-2.5 px-3 min-w-[180px]">المنتج *</th>
                <th className="py-2.5 px-2 text-center min-w-[130px]">الوحدة</th>

                {/* 🆕 حقول المشتريات فقط */}
                {isPurchase && (
                  <>
                    <th className="py-2.5 px-2 text-center w-32">رقم الدفعة</th>
                    <th className="py-2.5 px-2 text-center w-36">تاريخ الانتهاء</th>
                  </>
                )}

                <th className="py-2.5 px-2 text-center w-24">كمية</th>
                <th className="py-2.5 px-2 text-center w-24">بونص</th>
                <th className="py-2.5 px-2 text-center w-28">السعر</th>
                <th className="py-2.5 px-2 text-center w-20">ضريبة %</th>

                {/* 🆕 سعر البيع المتوقع (للمشتريات فقط) */}
                {isPurchase && (
                  <th className="py-2.5 px-2 text-center w-28">سعر البيع المتوقع</th>
                )}

                <th className="py-2.5 px-3 text-left w-28">الإجمالي</th>
                <th className="py-2.5 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => {
                const { gross, taxAmount, lineTotal, sellingPrice } = calculateLine(it);

                // البحث عن المنتج في الكتالوج (للمشتريات الشبكية)
                const catalogProduct = catalog.find(
                  (p: any) => p.product_id === it.product_id || p.id === it.product_id
                );

                // الوحدات المتاحة
                const units = catalogProduct?.units || [];

                return (
                  <tr key={it.uid} className="hover:bg-slate-50/50">
                    {/* المنتج */}
                    <td className="p-2">
                      <select
                        required
                        value={it.product_id}
                        onChange={(e) => onProductChange(it.uid, e.target.value)}
                        disabled={isNetwork && catalog.length > 0}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                      >
                        <option value="">-- اختر منتجاً --</option>
                        {isNetwork && catalog.length > 0 ? (
                          // مورد شبكي — من الكتالوج
                          catalog.map((p: any) => (
                            <option key={p.product_id || p.id} value={p.product_id || p.id}>
                              {p.product_name || p.name} ({p.sku}) - متوفر: {p.system_quantity || p.current_stock || 0}
                            </option>
                          ))
                        ) : (
                          // مورد محلي — من المنتجات العادية
                          catalog.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))
                        )}
                      </select>
                      {catalogProduct && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                          <Warehouse className="w-3 h-3" />
                          <span>
                            متوفر: {catalogProduct.system_quantity || catalogProduct.current_stock || 0}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* الوحدة */}
                    <td className="p-2 text-center">
                      <select
                        value={it.unit_id || ''}
                        onChange={(e) => onUnitChange(it.uid, e.target.value || null)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">أساسية</option>
                        {units
                          .filter((u: any) => !u.is_base_unit)
                          .map((u: any) => (
                            <option key={u.unit_id} value={u.unit_id}>
                              {u.unit_name} (×{u.conversion_factor})
                            </option>
                          ))}
                      </select>
                      {Number(it.conversion_factor) > 1 && (
                        <span className="block text-[9px] text-emerald-600 mt-0.5 font-mono">
                          = {((Number(it.paid_quantity) || 0) * Number(it.conversion_factor)).toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* 🆕 رقم الدفعة (للمشتريات فقط) */}
                    {isPurchase && (
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.batch_number || ''}
                          onChange={(e) => onChange(it.uid, { batch_number: e.target.value })}
                          placeholder="B2401"
                          maxLength={100}
                          className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {/* 🆕 تاريخ الانتهاء (للمشتريات فقط) */}
                    {isPurchase && (
                      <td className="p-2">
                        <input
                          type="date"
                          value={it.expiry_date || ''}
                          onChange={(e) => onChange(it.uid, { expiry_date: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {/* الكمية */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        required
                        min="0.001"
                        step="0.001"
                        value={it.paid_quantity}
                        onChange={(e) =>
                          onChange(it.uid, { paid_quantity: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* البونص */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={it.bonus_quantity}
                        onChange={(e) =>
                          onChange(it.uid, { bonus_quantity: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono text-emerald-700 font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* السعر */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={it.unit_price}
                        onChange={(e) =>
                          onChange(it.uid, { unit_price: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* الضريبة */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={it.tax_rate}
                        onChange={(e) =>
                          onChange(it.uid, { tax_rate: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* 🆕 سعر البيع المتوقع (للمشتريات فقط) */}
                    {isPurchase && (
                      <td className="p-2 text-center">
                        {sellingPrice !== null && sellingPrice > 0 ? (
                          <div className="text-[11px] font-mono font-bold text-emerald-700">
                            {sellingPrice.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    )}

                    {/* الإجمالي */}
                    <td className="p-2 text-left font-bold text-slate-900 font-mono">
                      {lineTotal.toFixed(2)}
                    </td>

                    {/* حذف */}
                    <td className="p-2 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveRow(it.uid)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      {items.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>
            {isPurchase
              ? '💡 ملاحظة: رقم الدفعة وتاريخ الانتهاء مطلوبان عند تأكيد الاستلام'
              : '💡 ملاحظة: الخصم يُطبَّق على إجمالي الفاتورة (ليس على البند)'}
          </span>
          {isPurchase && defaultMarginRate > 0 && (
            <span className="text-emerald-700 font-bold">
              هامش الربح: {defaultMarginRate}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};