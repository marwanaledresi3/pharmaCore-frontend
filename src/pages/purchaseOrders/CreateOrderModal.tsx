// pages/purchaseOrders/CreateOrderModal.tsx
import React, { useMemo } from 'react';
import { RefreshCw, Building2, Package, CheckCircle2, Percent } from 'lucide-react';
import { PaymentMethod, PaymentType } from '../../api/ordersApi';
import { b2bApi } from '../../api/b2bApi';
import { Supplier, Currency, ValidationErrorDetail } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { CatalogProduct, DraftItem } from './types';
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
  cashRegisterId?: string | null;

  // ✅ هامش الربح الافتراضي
  defaultMarginRate: number;

  // ✅ خصم الفاتورة
  invoiceDiscountRate: number;

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
    cashRegisterId?: string | null;
  }) => void;
  onChangeSupplierInvoice: (patch: {
    invoiceNumber?: string;
    invoiceDate?: string;
  }) => void;
  onChangeDefaultMargin: (rate: number) => void;
  onChangeInvoiceDiscount: (rate: number) => void;
  onAddRow: () => void;
  onRemoveRow: (uid: string) => void;
  onChangeItem: (uid: string, patch: Partial<DraftItem>) => void;
  onProductChange: (uid: string, productId: string) => void;
  onUnitChange: (uid: string, unitId: string | null) => void;
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
    cashRegisterId,
    supplierInvoiceNumber,
    supplierInvoiceDate,
    defaultMarginRate,
    invoiceDiscountRate,
    items,
    formLoading,
    formError,
    validationDetails,
    onChangeSupplier,
    onChangeCurrency,
    onChangeOrderDate,
    onChangePayment,
    onChangeSupplierInvoice,
    onChangeDefaultMargin,
    onChangeInvoiceDiscount,
    onAddRow,
    onRemoveRow,
    onChangeItem,
    onProductChange,
    onUnitChange,
    onSubmit,
    onClose,
  } = props;

  // ─── المورد الحالي ───
  const currentSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const currentSupplierNetCheck = useMemo(
    () => b2bApi.isNetworkSupplier(currentSupplier),
    [currentSupplier]
  );
  const isNetworkSupplier = currentSupplierNetCheck.isNetwork;

  // ─── الإجماليات ───
  const { subtotal, discountTotal, netAfterDiscount, taxTotal, grandTotal } =
    useTotals(items, isNetworkSupplier, invoiceDiscountRate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إنشاء أمر شراء وتوريد جديد"
      maxWidth="6xl"
    >
      {formError && (
        <ErrorAlert
          error={formError}
          details={validationDetails}
          className="mb-4"
        />
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 1) الحقول الأساسية */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المورد *
            </label>
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
                    {check.isNetwork
                      ? `🏢 ${s.name} (شبكي)`
                      : `📦 ${s.name} (محلي)`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاريخ أمر الشراء *
            </label>
            <input
              type="date"
              required
              value={orderDate}
              onChange={(e) => onChangeOrderDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              العملة *
            </label>
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2) تفاصيل الدفع */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <PaymentFields
          paymentType={paymentType}
          paymentMethod={paymentMethod}
          paymentTermsDays={paymentTermsDays}
          paidAmount={paidAmount}
          grandTotal={grandTotal}
          baseCurrency={baseCurrency}
          cashRegisterId={cashRegisterId}
          onChange={onChangePayment}
        />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3) فاتورة المورد الورقية */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SupplierInvoiceFields
          invoiceNumber={supplierInvoiceNumber}
          invoiceDate={supplierInvoiceDate}
          onChange={onChangeSupplierInvoice}
        />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 4) هامش الربح الافتراضي */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">
                  هامش الربح الافتراضي
                </h4>
                <p className="text-[11px] text-emerald-800">
                  يُطبَّق على جميع الأصناف. سعر البيع = سعر الشراء × (1 + هامش/100)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="0"
                max="1000"
                step="0.1"
                value={defaultMarginRate}
                onChange={(e) => onChangeDefaultMargin(Number(e.target.value))}
                className="w-24 rounded-xl border border-emerald-300 p-2 text-xs text-center font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-sm font-bold text-emerald-900">%</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 5) بانر المورد */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {isNetworkSupplier ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-emerald-950">
                      مورد شبكي B2B — أسعار حية
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-emerald-900">
                      🏢{' '}
                      {currentSupplierNetCheck.company?.name ||
                        currentSupplier?.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    الأسعار من دفعات المورد مباشرة. البونص والخصم والضريبة
                    يحددها المورد عند الموافقة.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-900 font-semibold">
                    <span className="bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 inline" />{' '}
                      {catalog.length} صنف متوفر
                    </span>
                  </div>
                </div>
              </div>
              {isCatalogLoading && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <RefreshCw className="w-3 h-3 animate-spin" />{' '}
                  <span>جاري الجلب...</span>
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
                <h4 className="text-xs font-black text-slate-800">
                  مورد محلي
                </h4>
                <p className="text-[11px] text-slate-600">
                  أدخل السعر والبونص والخصم يدوياً حسب فاتورة المورد.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 6) أخطاء الكتالوج */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {catalogError && <ErrorAlert error={catalogError} />}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7) جدول البنود */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <ItemsTable
          items={items}
          catalog={catalog}
          isNetwork={isNetworkSupplier}
          isCatalogLoading={isCatalogLoading}
          baseCurrency={baseCurrency}
          defaultMarginRate={defaultMarginRate}
          invoiceDiscountRate={invoiceDiscountRate}
          mode="purchase"
          onAddRow={onAddRow}
          onRemoveRow={onRemoveRow}
          onChange={onChangeItem}
          onProductChange={onProductChange}
          onUnitChange={onUnitChange}
        />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 8) الإجماليات */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 8.1) خصم الفاتورة */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-rose-950 mb-1">
                  خصم على الفاتورة
                </h4>
                <p className="text-[11px] text-rose-800 mb-2">
                  يُطبَّق على إجمالي الفاتورة (قبل الضريبة)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoiceDiscountRate}
                    onChange={(e) => onChangeInvoiceDiscount(Number(e.target.value))}
                    className="w-24 rounded-xl border border-rose-300 p-2 text-xs text-center font-mono font-bold text-rose-800 focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-rose-900">%</span>
                  {discountTotal > 0 && (
                    <span className="text-xs font-mono text-rose-700 font-bold mr-2">
                      = {discountTotal.toFixed(2)} {baseCurrency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 8.2) ملخص الإجماليات */}
          <TotalsSummary
            subtotal={subtotal}
            discountTotal={discountTotal}
            netAfterDiscount={netAfterDiscount}
            taxTotal={taxTotal}
            grandTotal={grandTotal}
            paidAmount={paidAmount}
            paymentType={paymentType}
            baseCurrency={baseCurrency}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 9) أزرار الإجراءات */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={formLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
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