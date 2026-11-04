import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DraftItem, CatalogProduct } from '../types';
import { computeItemLine } from '../utils';
import { toDateInput } from '../utils';

interface Props {
  items: DraftItem[];
  catalog: CatalogProduct[];
  isNetwork: boolean;
  isCatalogLoading: boolean;
  baseCurrency: string;
  onAddRow: () => void;
  onRemoveRow: (uid: string) => void;
  onChange: (uid: string, patch: Partial<DraftItem>) => void;
  onProductChange: (uid: string, productId: string) => void;
}

export const ItemsTable: React.FC<Props> = ({
  items,
  catalog,
  isNetwork,
  isCatalogLoading,
  baseCurrency,
  onAddRow,
  onRemoveRow,
  onChange,
  onProductChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-800">بنود الطلبية</h4>
        <button
          type="button"
          onClick={onAddRow}
          disabled={isCatalogLoading || catalog.length === 0}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة صنف
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
              <th className="py-2.5 px-3 min-w-[240px]">الصنف</th>
              <th className="py-2.5 px-2 text-center w-20">كمية</th>
              {!isNetwork && <th className="py-2.5 px-2 text-center w-20">بونص</th>}
              <th className="py-2.5 px-2 text-center w-28">السعر</th>
              {!isNetwork && <th className="py-2.5 px-2 text-center w-20">خصم %</th>}
              {!isNetwork && <th className="py-2.5 px-2 text-center w-20">خصم مبلغ</th>}
              {!isNetwork && <th className="py-2.5 px-2 text-center w-20">ضريبة %</th>}
              <th className="py-2.5 px-2 text-center min-w-[120px]">تشغيلة</th>
              <th className="py-2.5 px-2 text-center min-w-[120px]">الانتهاء</th>
              <th className="py-2.5 px-3 text-left w-24">الإجمالي</th>
              <th className="py-2.5 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const line = computeItemLine({
                paidQuantity: it.paid_quantity,
                unitPrice: it.unit_price,
                discountRate: it.discount_rate,
                discountAmount: it.discount_amount,
                taxRate: it.tax_rate,
                isNetwork,
              });

              return (
                <tr key={it.uid} className="hover:bg-slate-50/50">
                  <td className="p-2">
                    <select
                      required
                      value={it.product_id}
                      onChange={(e) => onProductChange(it.uid, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-emerald-500 font-medium"
                    >
                      {catalog.map((p) => {
                        const isNet = Boolean(p.is_network_product);
                        const priceNum = Number(p.wholesale_price ?? p.cost_price ?? 0);
                        return (
                          <option key={p.id} value={p.id}>
                            {isNet ? '🏢 ' : '📦 '}
                            {p.name} ({p.sku}) — {priceNum} {baseCurrency}
                            {p.available_quantity !== undefined
                              ? ` • متاح: ${p.available_quantity}`
                              : p.current_stock !== undefined
                                ? ` • مخزون: ${p.current_stock}`
                                : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      required
                      min="1"
                      value={it.paid_quantity}
                      onChange={(e) => onChange(it.uid, { paid_quantity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                    />
                  </td>
                  {!isNetwork && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={it.bonus_quantity}
                        onChange={(e) => onChange(it.uid, { bonus_quantity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono text-emerald-700 font-bold"
                      />
                    </td>
                  )}
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={it.unit_price}
                      readOnly={isNetwork}
                      disabled={isNetwork}
                      onChange={(e) => onChange(it.uid, { unit_price: Number(e.target.value) })}
                      className={`w-full rounded-lg border p-1.5 text-xs text-center font-mono font-bold ${
                        isNetwork
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 cursor-not-allowed'
                          : 'border-slate-300 text-slate-900'
                      }`}
                    />
                    {isNetwork && (
                      <span className="block text-[9px] text-emerald-600 mt-0.5">سعر المورد</span>
                    )}
                  </td>
                  {!isNetwork && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={it.discount_rate}
                        onChange={(e) => {
                          const newRate = Number(e.target.value);
                          onChange(it.uid, {
                            discount_rate: newRate,
                            discount_amount: newRate > 0 ? 0 : it.discount_amount,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                      />
                    </td>
                  )}
                  {!isNetwork && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.discount_amount}
                        onChange={(e) => {
                          const newAmt = Number(e.target.value);
                          onChange(it.uid, {
                            discount_amount: newAmt,
                            discount_rate: newAmt > 0 ? 0 : it.discount_rate,
                          });
                        }}
                        disabled={Number(it.discount_rate) > 0}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                        title={
                          Number(it.discount_rate) > 0
                            ? 'الخصم % مفعّل — لن يُحسب خصم المبلغ'
                            : ''
                        }
                      />
                    </td>
                  )}
                  {!isNetwork && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={it.tax_rate}
                        onChange={(e) => onChange(it.uid, { tax_rate: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                      />
                    </td>
                  )}
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      placeholder={isNetwork ? 'تلقائي' : 'اختياري'}
                      value={it.batch_number}
                      readOnly={isNetwork}
                      onChange={(e) => onChange(it.uid, { batch_number: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="date"
                      value={it.expiry_date}
                      min={toDateInput(new Date())}
                      readOnly={isNetwork}
                      onChange={(e) => onChange(it.uid, { expiry_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                    />
                  </td>
                  <td className="p-2 text-left font-bold text-slate-900 font-mono">
                    {line.total.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveRow(it.uid)}
                        className="text-slate-400 hover:text-rose-600"
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
    </div>
  );
};