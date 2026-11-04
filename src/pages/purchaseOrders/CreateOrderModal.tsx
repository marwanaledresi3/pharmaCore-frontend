import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, Building2, Package, CheckCircle2 } from 'lucide-react';
import { PaymentMethod, PaymentType } from '../../api/ordersApi';
import { b2bApi } from '../../api/b2bApi';
import { Supplier, Currency, ValidationErrorDetail } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { CatalogProduct, DraftItem } from './types';
import { toDateInput } from './utils';
import { PaymentFields } from './components/PaymentFields';
import { SupplierInvoiceFields } from './components/SupplierInvoiceFields';
import { ItemsTable } from './components/ItemsTable';
import { TotalsSummary } from './components/TotalsSummary';
import { useTotals } from './hooks/useTotals';

interface Props {
  isOpen: boolean;
  suppliers: Supplier[];
  currencies: Currency[];
  catalog: CatalogProduct[];
  isCatalogLoading: boolean;
  catalogError: string | null;
  baseCurrency: string;
  selectedSupplierId: string;
  selectedCurrencyId: string;
  orderDate: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentTermsDays: number;
  paidAmount: number;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  items: DraftItem[];
  formLoading: boolean;
  formError: string | null;
  validationDetails: ValidationErrorDetail[] | undefined;
  onChangeSupplier: (id: string) => void;
  onChangeCurrency: (id: string) => void;
  onChangeOrderDate: (date: string) => void;
  onChangePayment: (patch: {
    paymentType?: PaymentType;
    paymentMethod?: PaymentMethod;
    paymentTermsDays?: number;
    paidAmount?: number;
  }) => void;
  onChangeSupplierInvoice: (patch: { invoiceNumber?: string; invoiceDate?: string }) => void;
  onAddRow: () => void;
  onRemoveRow: (uid: string) => void;
  onChangeItem: (uid: string, patch: Partial<DraftItem>) => void;
  onChangeProduct: (uid: string, productId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CreateOrderModal: React.FC<Props> = (props) => {
  const {
    isOpen,
    suppliers,
    currencies,
    catalog,
    isCatalogLoading,
    catalogError,
    baseCurrency,
    selectedSupplierId,
    selectedCurrencyId,
    orderDate,
    paymentType,
    paymentMethod,
    paymentTermsDays,
    paidAmount,
    supplierInvoiceNumber,
    supplierInvoiceDate,
    items,
    formLoading,
    formError,
    validationDetails,
    onChangeSupplier,
    onChangeCurrency,
    onChangeOrderDate,
    onChangePayment,
    onChangeSupplierInvoice,
    onAddRow,
    onRemoveRow,
    onChangeItem,
    onChangeProduct,
    onSubmit,
    onClose,
  } = props;

  const currentSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const currentSupplierNetCheck = useMemo(
    () => b2bApi.isNetworkSupplier(currentSupplier),
    [currentSupplier]
  );
  const isNetworkSupplier = currentSupplierNetCheck.isNetwork;

  const { subtotal, taxTotal, grandTotal } = useTotals(items, isNetworkSupplier);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إنشاء أمر شراء وتوريد جديد" maxWidth="5xl">
      {formError && (
        <ErrorAlert error={formError} details={validationDetails} className="mb-4" />
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Top Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e) => onChangeSupplier(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- اختر المورد --</option>
              {suppliers.map((s) => {
                const check = b2bApi.isNetworkSupplier(s);
                return (
                  <option key={s.id} value={s.id}>
                    {check.isNetwork ? `🏢 ${s.name} (شبكي)` : `📦 ${s.name} (محلي)`}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ أمر الشراء *</label>
            <input
              type="date"
              required
              value={orderDate}
              onChange={(e) => onChangeOrderDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
            <select
              required
              value={selectedCurrencyId}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment */}
        <PaymentFields
          paymentType={paymentType}
          paymentMethod={paymentMethod}
          paymentTermsDays={paymentTermsDays}
          paidAmount={paidAmount}
          grandTotal={grandTotal}
          baseCurrency={baseCurrency}
          onChange={onChangePayment}
        />

        {/* Supplier invoice */}
        <SupplierInvoiceFields
          invoiceNumber={supplierInvoiceNumber}
          invoiceDate={supplierInvoiceDate}
          onChange={onChangeSupplierInvoice}
        />

        {/* Supplier banner */}
        {isNetworkSupplier ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-emerald-950">مورد شبكي B2B — أسعار حية</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-emerald-900">
                      🏢 {currentSupplierNetCheck.company?.name || currentSupplier?.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    الأسعار من دفعات المورد مباشرة. البونص والخصم والضريبة يحددها المورد عند الموافقة.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-900 font-semibold">
                    <span className="bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 inline" /> {catalog.length} صنف متوفر
                    </span>
                  </div>
                </div>
              </div>
              {isCatalogLoading && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <RefreshCw className="w-3 h-3 animate-spin" /> <span>جاري الجلب...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">مورد محلي</h4>
                <p className="text-[11px] text-slate-600">
                  أدخل السعر والبونص والخصم يدوياً حسب فاتورة المورد.
                </p>
              </div>
            </div>
          </div>
        )}

        {catalogError && <ErrorAlert error={catalogError} />}

        {/* Items */}
        <ItemsTable
          items={items}
          catalog={catalog}
          isNetwork={isNetworkSupplier}
          isCatalogLoading={isCatalogLoading}
          baseCurrency={baseCurrency}
          onAddRow={onAddRow}
          onRemoveRow={onRemoveRow}
          onChange={onChangeItem}
          onProductChange={onChangeProduct}
        />

        {/* Totals */}
        <TotalsSummary
          subtotal={subtotal}
          taxTotal={taxTotal}
          grandTotal={grandTotal}
          paidAmount={paidAmount}
          paymentType={paymentType}
          baseCurrency={baseCurrency}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={formLoading || isCatalogLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
          >
            {formLoading ? 'جاري الحفظ...' : 'حفظ أمر الشراء'}
          </button>
        </div>
      </form>
    </Modal>
  );
};