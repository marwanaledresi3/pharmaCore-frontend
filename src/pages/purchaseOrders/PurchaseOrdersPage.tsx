import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { ordersApi, PaymentMethod, PaymentType } from '../../api/ordersApi';
import { b2bApi } from '../../api/b2bApi';
import { invoicesApi } from '../../api/invoicesApi';
import { PurchaseOrder, ValidationErrorDetail } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { PrintPreviewModal, exportToCsv } from '../../components/common/PrintPreviewModal';
import { useAuth } from '../../context/AuthContext';

import { CatalogProduct, DraftItem, QRData } from './types';
import { STATUS_FILTERS, StatusFilterValue, PAYMENT_TYPE_LABELS } from './constants';
import { toDateInput } from './utils';

import { useReferences } from './hooks/useReferences';
import { useOrdersList } from './hooks/useOrdersList';
import { useSupplierCatalog } from './hooks/useSupplierCatalog';
import { useDraftItems } from './hooks/useDraftItems';

import { OrdersTable } from './components/OrdersTable';
import { DetailsModal } from './components/DetailsModal';
import { QrModal } from './components/QrModal';
import { CreateOrderModal } from './CreateOrderModal';
import { productsApi } from '../../api/productsApi';

export const PurchaseOrdersPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  /* ---------- Filters & list ---------- */
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const {
    orders,
    pagination,
    isLoading,
    error: listError,
    reload: loadOrders,
  } = useOrdersList(statusFilter);

  /* ---------- References ---------- */
  const {
    suppliers,
    products,
    currencies,
    status: refsStatus,
    error: refsError,
    reload: loadReferences,
    setProducts,
  } = useReferences();

  /* ---------- Create modal ---------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [orderDate, setOrderDate] = useState(toDateInput(new Date()));

  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [paidAmount, setPaidAmount] = useState(0);

  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');

  const [activeCatalogProducts, setActiveCatalogProducts] = useState<CatalogProduct[]>([]);
  const { items, setItems, addItemRow, removeItemRow, updateItemRow, handleProductChange } =
    useDraftItems();

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<ValidationErrorDetail[] | undefined>();

  const { isLoading: isCatalogLoading, error: catalogError } = useSupplierCatalog({
    isOpen: isCreateOpen,
    selectedSupplierId,
    suppliers,
    products,
    onCatalogLoaded: setActiveCatalogProducts,
    onItemsReset: setItems,
  });

  const currentSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );
  const currentSupplierNetCheck = useMemo(
    () => b2bApi.isNetworkSupplier(currentSupplier),
    [currentSupplier]
  );
  const isNetworkSupplier = currentSupplierNetCheck.isNetwork;

  const canOpenCreate =
    refsStatus === 'ready' && suppliers.length > 0 && currencies.length > 0;

  const createDisabledReason = useMemo(() => {
    if (refsStatus === 'loading' || refsStatus === 'idle') return 'جاري تحميل البيانات...';
    if (refsStatus === 'error') return `فشل تحميل البيانات: ${refsError || 'خطأ غير معروف'}`;
    if (suppliers.length === 0) return 'أضف مورداً أولاً';
    if (currencies.length === 0) return 'لا توجد عملات مسجّلة';
    return undefined;
  }, [refsStatus, refsError, suppliers.length, currencies.length]);

  const openCreateModal = () => {
    if (!canOpenCreate) return;
    const firstSup = suppliers[0]?.id || '';
    const firstCur = currencies.find((c) => c.code === baseCurrency)?.id || currencies[0]?.id || '';

    setSelectedSupplierId(firstSup);
    setSelectedCurrencyId(firstCur);
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate('');
    setOrderDate(toDateInput(new Date()));
    setPaymentType('credit');
    setPaymentMethod('cash');
    setPaymentTermsDays(30);
    setPaidAmount(0);
    setItems([]);
    setActiveCatalogProducts([]);
    setFormError(null);
    setValidationDetails(undefined);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate('');
    setActiveCatalogProducts([]);
    setItems([]);
    setFormError(null);
    setValidationDetails(undefined);
  };

  /* ---------- Details ---------- */
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const detailsReqId = useRef(0);

  const openDetailsModal = async (order: PurchaseOrder) => {
    const reqId = ++detailsReqId.current;
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const detailed = await ordersApi.getPurchaseOrder(order.id);
      if (reqId === detailsReqId.current) setSelectedOrder(detailed);
    } catch {
      /* silent */
    } finally {
      if (reqId === detailsReqId.current) setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    detailsReqId.current++;
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من تأكيد أمر الشراء؟ سيؤدي ذلك إلى استلام المخزون فعلياً وتوليد قيد الاستحقاق المحاسبي.')) return;
    setActionLoading(true);
    try {
      await ordersApi.confirmPurchaseOrder(selectedOrder.id);
      closeDetailsModal();
      await loadOrders(pagination.page);
    } catch (err: any) {
      window.alert(err?.message || 'فشل تأكيد أمر الشراء');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء أمر الشراء هذا؟')) return;
    setActionLoading(true);
    try {
      await ordersApi.cancelPurchaseOrder(selectedOrder.id);
      closeDetailsModal();
      await loadOrders(pagination.page);
    } catch (err: any) {
      window.alert(err?.message || 'فشل إلغاء أمر الشراء');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------- Invoice ---------- */
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await invoicesApi.createFromPurchaseOrder(selectedOrder.id, invoiceDueDate || undefined);
      setIsInvoiceModalOpen(false);
      closeDetailsModal();
      window.alert('تم إنشاء فاتورة المشتريات بنجاح!');
      await loadOrders(pagination.page);
    } catch (err: any) {
      window.alert(err?.message || 'فشل تحويل أمر الشراء إلى فاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------- Print ---------- */
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  /* ---------- QR ---------- */
  const [qrModalData, setQrModalData] = useState<QRData | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  /* ---------- Create submit ---------- */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) return setFormError('يرجى اختيار المورد');
    if (!selectedCurrencyId) return setFormError('يرجى اختيار العملة');
    if (items.length === 0) return setFormError('يجب إضافة صنف واحد على الأقل');
    if (isCatalogLoading) return setFormError('انتظر انتهاء تحميل كتالوج المورد');

    if (paymentType === 'partial') {
      const grand = items.reduce((s, it) => {
        const gross = it.paid_quantity * it.unit_price;
        let disc = 0;
        if (isNetworkSupplier) {
          disc = 0;
        } else if (it.discount_rate > 0) {
          disc = gross * (it.discount_rate / 100);
        } else if (it.discount_amount > 0) {
          disc = Math.min(it.discount_amount, gross);
        }
        const net = Math.max(0, gross - disc);
        const tax = isNetworkSupplier ? 0 : net * (it.tax_rate / 100);
        return s + net + tax;
      }, 0);
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        return setFormError('المبلغ المدفوع مطلوب للدفع الجزئي');
      }
      if (paidAmount >= grand) {
        return setFormError('المبلغ المدفوع يجب أن يكون أقل من الإجمالي');
      }
    }
    if ((paymentType === 'cash' || paymentType === 'partial') && !paymentMethod) {
      return setFormError('طريقة الدفع مطلوبة');
    }

    setFormLoading(true);
    setFormError(null);
    setValidationDetails(undefined);

    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (!supplier) throw new Error('المورد المحدد غير موجود');

      const network = b2bApi.isNetworkSupplier(supplier);
      const localBySku = new Map<string, any>();
      const localByName = new Map<string, any>();
      const rememberLocal = (p: any) => {
        if (p.sku) localBySku.set(String(p.sku).toLowerCase(), p);
        if (p.name) localByName.set(String(p.name).toLowerCase(), p);
      };
      products.forEach(rememberLocal);

      const createdProducts: any[] = [];
      const resolvedItems: Array<Record<string, unknown>> = [];

      for (const it of items) {
        const catalogItem = activeCatalogProducts.find((p) => p.id === it.product_id);
        if (!catalogItem) throw new Error('أحد الأصناف لم يعد موجوداً في كتالوج المورد');

        let localProduct =
          products.find((p) => p.id === it.product_id) ??
          createdProducts.find((p) => p.id === it.product_id);

        let supplierProductId: string | undefined;

        if (!localProduct) {
          if (!network.isNetwork || !network.companyId) {
            throw new Error(`المنتج "${catalogItem.name}" غير محلي ولا يمكن التحقق من مصدره الشبكي`);
          }

          supplierProductId = catalogItem.id;
          const sku = String(catalogItem.sku || '').trim();

          if (sku) localProduct = localBySku.get(sku.toLowerCase());
          if (!localProduct && catalogItem.name) {
            localProduct = localByName.get(String(catalogItem.name).toLowerCase());
          }

          if (!localProduct) {
            if (!sku) throw new Error(`لا يمكن تسجيل "${catalogItem.name}" محلياً دون SKU`);
            const unitPrice = Number(it.unit_price);
            const costPrice = Number(catalogItem.cost_price ?? catalogItem.wholesale_price ?? unitPrice);

            const created = await productsApi.create({
              sku,
              name: catalogItem.name,
              unit: catalogItem.unit || 'قطعة',
              cost_price: Number.isFinite(costPrice) ? costPrice : unitPrice,
              selling_price: Number(catalogItem.selling_price || 0),
              category: catalogItem.category || undefined,
              barcode: catalogItem.barcode || undefined,
            });

            localProduct = created;
            createdProducts.push(created);
            rememberLocal(created);
          }
        }

        if (!localProduct) throw new Error(`تعذر تحديد المنتج المحلي للصنف: ${it.product_id}`);

        const paidQuantity = Number(it.paid_quantity);
        const bonusQuantity = isNetworkSupplier ? 0 : Number(it.bonus_quantity || 0);
        const unitPrice = Number(it.unit_price);
        const discountRate = isNetworkSupplier ? 0 : Number(it.discount_rate || 0);
        const discountAmount = isNetworkSupplier ? 0 : Number(it.discount_amount || 0);
        const taxRate = isNetworkSupplier ? 0 : Number(it.tax_rate || 0);

        if (!Number.isFinite(paidQuantity) || paidQuantity <= 0)
          throw new Error('يجب أن تكون الكمية المدفوعة أكبر من صفر');
        if (!isNetworkSupplier && (!Number.isFinite(bonusQuantity) || bonusQuantity < 0))
          throw new Error('الكمية المجانية لا يمكن أن تكون سالبة');
        if (!isNetworkSupplier && (!Number.isFinite(unitPrice) || unitPrice < 0))
          throw new Error('سعر الوحدة غير صالح');
        if (!isNetworkSupplier && (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100))
          throw new Error('نسبة الخصم يجب أن تكون بين 0 و100');
        if (!isNetworkSupplier && (!Number.isFinite(discountAmount) || discountAmount < 0))
          throw new Error('مبلغ الخصم لا يمكن أن يكون سالباً');
        if (!isNetworkSupplier && (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100))
          throw new Error('نسبة الضريبة يجب أن تكون بين 0 و100');

        const itemPayload: Record<string, unknown> = {
          product_id: localProduct.id,
          paid_quantity: paidQuantity,
          bonus_quantity: bonusQuantity,
          quantity: paidQuantity + bonusQuantity,
        };

        if (supplierProductId) itemPayload.supplier_product_id = supplierProductId;
        if (!isNetworkSupplier) {
          itemPayload.unit_price = unitPrice;
          itemPayload.discount_rate = discountRate;
          itemPayload.discount_amount = discountAmount;
          itemPayload.tax_rate = taxRate;
        }
        if (it.batch_number?.trim()) itemPayload.batch_number = it.batch_number.trim();
        if (it.expiry_date?.trim()) itemPayload.expiry_date = it.expiry_date.slice(0, 10);

        resolvedItems.push(itemPayload);
      }

      await ordersApi.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        currency_id: selectedCurrencyId,
        order_date: orderDate,
        payment_type: paymentType,
        payment_method: paymentType !== 'credit' ? paymentMethod : undefined,
        payment_terms_days: paymentType !== 'cash' ? paymentTermsDays : undefined,
        paid_amount: paymentType === 'partial' ? paidAmount : undefined,
        supplier_invoice_number: supplierInvoiceNumber || undefined,
        supplier_invoice_date: supplierInvoiceDate || undefined,
        items: resolvedItems as any,
      });

      if (createdProducts.length > 0) {
        setProducts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...createdProducts.filter((p) => !ids.has(p.id)), ...prev];
        });
      }

      closeCreateModal();
      await loadOrders(1);
    } catch (err: any) {
      console.error('فشل إنشاء أمر الشراء:', err);
      setFormError(err?.message || 'فشل إنشاء أمر الشراء');
      if (Array.isArray(err?.details)) setValidationDetails(err.details);
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------- Export CSV ---------- */
  const handleExportCsv = () => {
    const exportData = orders.map((o) => ({
      'رقم الأمر': o.order_number,
      المورد: o.supplier_name || '',
      التاريخ: o.order_date ? String(o.order_date).slice(0, 10) : '',
      المبلغ_الصافي: o.subtotal,
      الضريبة: o.tax_total,
      الإجمالي: o.total,
      'نوع الدفع': o.payment_type ? PAYMENT_TYPE_LABELS[o.payment_type as PaymentType] : '',
      الحالة: o.status,
    }));
    exportToCsv(exportData, 'purchase_orders');
  };

  /* ---------- Render ---------- */
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">أوامر الشراء والتوريد</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة طلبات الشراء، اعتماد كميات البونص، تحديث المخزون، والفوترة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
          >
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!canOpenCreate}
            title={createDisabledReason}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {refsStatus === 'loading' || refsStatus === 'idle' ? 'جاري التحميل...' : 'أمر شراء جديد'}
          </button>
        </div>
      </div>

      {refsStatus === 'error' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>تعذر تحميل المراجع: {refsError}</span>
          </div>
          <button
            onClick={loadReferences}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">تصفية حسب الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => loadOrders(pagination.page)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {listError && <ErrorAlert error={listError} onRetry={() => loadOrders(pagination.page)} />}

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        suppliers={suppliers}
        isLoading={isLoading}
        pagination={pagination}
        baseCurrency={baseCurrency}
        canOpenCreate={canOpenCreate}
        onCreate={openCreateModal}
        onOpenDetails={openDetailsModal}
        onPageChange={loadOrders}
      />

      {/* Create Modal */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        suppliers={suppliers}
        currencies={currencies}
        catalog={activeCatalogProducts}
        isCatalogLoading={isCatalogLoading}
        catalogError={catalogError}
        baseCurrency={baseCurrency}
        selectedSupplierId={selectedSupplierId}
        selectedCurrencyId={selectedCurrencyId}
        orderDate={orderDate}
        paymentType={paymentType}
        paymentMethod={paymentMethod}
        paymentTermsDays={paymentTermsDays}
        paidAmount={paidAmount}
        supplierInvoiceNumber={supplierInvoiceNumber}
        supplierInvoiceDate={supplierInvoiceDate}
        items={items}
        formLoading={formLoading}
        formError={formError}
        validationDetails={validationDetails}
        onChangeSupplier={setSelectedSupplierId}
        onChangeCurrency={setSelectedCurrencyId}
        onChangeOrderDate={setOrderDate}
        onChangePayment={(patch) => {
          if (patch.paymentType !== undefined) setPaymentType(patch.paymentType);
          if (patch.paymentMethod !== undefined) setPaymentMethod(patch.paymentMethod);
          if (patch.paymentTermsDays !== undefined) setPaymentTermsDays(patch.paymentTermsDays);
          if (patch.paidAmount !== undefined) setPaidAmount(patch.paidAmount);
        }}
        onChangeSupplierInvoice={(patch) => {
          if (patch.invoiceNumber !== undefined) setSupplierInvoiceNumber(patch.invoiceNumber);
          if (patch.invoiceDate !== undefined) setSupplierInvoiceDate(patch.invoiceDate);
        }}
        onAddRow={() => addItemRow(activeCatalogProducts, setFormError)}
        onRemoveRow={removeItemRow}
        onChangeItem={updateItemRow}
        onChangeProduct={(uid, prodId) => handleProductChange(uid, prodId, activeCatalogProducts)}
        onSubmit={handleCreateSubmit}
        onClose={closeCreateModal}
      />

      {/* Details Modal */}
      {selectedOrder && (
        <DetailsModal
          isOpen={isDetailsOpen}
          order={selectedOrder}
          suppliers={suppliers}
          isLoading={detailsLoading}
          actionLoading={actionLoading}
          baseCurrency={baseCurrency}
          onClose={closeDetailsModal}
          onPrint={() => setIsPrintOpen(true)}
          onConfirm={handleConfirmOrder}
          onCancel={handleCancelOrder}
          onCreateInvoice={() => {
            setInvoiceDueDate(toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
            setIsInvoiceModalOpen(true);
          }}
        />
      )}

      {/* QR Modal */}
      <QrModal isOpen={isQrModalOpen} data={qrModalData} onClose={() => setIsQrModalOpen(false)} />

      {/* Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="تحويل إلى فاتورة مشتريات"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            سيتم إنشاء فاتورة مشتريات رسمية وتسجيل الاستحقاق على المورد.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
            <input
              type="date"
              value={invoiceDueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {actionLoading ? '...' : 'تأكيد'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Print */}
      {selectedOrder && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="أمر شراء وتوريد"
          documentType="أمر شراء"
          documentNumber={selectedOrder.order_number}
          documentDate={selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : ''}
          partyTitle="المورد"
          partyName={selectedOrder.supplier_name || 'مورد عام'}
          currencyCode={baseCurrency}
          company={company}
          items={(selectedOrder.items || []).map((it: any) => ({
            name: it.product_name || 'دواء',
            sku: it.sku,
            quantity: Number(it.paid_quantity ?? it.quantity),
            bonus_quantity: Number(it.bonus_quantity || 0),
            unit_price: Number(it.unit_price),
            discount: it.discount_rate ? `${it.discount_rate}%` : undefined,
            tax: it.tax_rate ? `${it.tax_rate}%` : undefined,
            total: Number(it.line_total),
          }))}
          summary={[
            { label: 'المجموع الصافي', value: Number(selectedOrder.subtotal || 0) },
            { label: 'ضريبة المدخلات', value: Number(selectedOrder.tax_total || 0) },
            { label: 'الإجمالي النهائي', value: Number(selectedOrder.total || 0), isTotal: true },
          ]}
        />
      )}
    </div>
  );
};