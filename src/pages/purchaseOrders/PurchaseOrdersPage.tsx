// pages/purchaseOrders/PurchaseOrdersPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Printer,
} from 'lucide-react';
import { ordersApi, PaymentMethod, PaymentType } from '../../api/ordersApi';
import { suppliersApi } from '../../api/suppliersApi';
import { productsApi } from '../../api/productsApi';
import { companyApi } from '../../api/companyApi';
import { invoicesApi } from '../../api/invoicesApi';
import { b2bApi } from '../../api/b2bApi';
import {
  PurchaseOrder,
  Supplier,
  Product,
  Currency,
  Pagination as PaginationType,
  ValidationErrorDetail,
} from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../../components/common/PrintPreviewModal';
import { useAuth } from '../../context/AuthContext';
import { pdfApi } from '../../api/pdfApi1';
import { CreateOrderModal } from './CreateOrderModal';
import { CatalogProduct, DraftItem } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const uid = () =>
  `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function resolveUnitFactor(
  product: { units?: Array<{ unit_id: string; conversion_factor: number }> } | undefined,
  unitId: string | null
): number {
  if (!unitId) return 1;
  const unit = product?.units?.find((u) => u.unit_id === unitId);
  return Number(unit?.conversion_factor) || 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export const PurchaseOrdersPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  // ─── Data ───
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 15,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── References ───
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // ─── Create Modal ───
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<DraftItem[]>([]);

  // ✅ Payment & Discount
  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [invoiceDiscountRate, setInvoiceDiscountRate] = useState<number>(0);
  const [defaultMarginRate, setDefaultMarginRate] = useState<number>(20);

  // ✅ Supplier invoice
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<ValidationErrorDetail[] | undefined>();

  // ─── Details Modal ───
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Print Modal ───
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // ─── Invoice Modal ───
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');


    const currentSupplier = useMemo(
      () => suppliers.find((s) => s.id === selectedSupplierId),
      [suppliers, selectedSupplierId]
    );
    const currentSupplierNetCheck = useMemo(
      () => b2bApi.isNetworkSupplier(currentSupplier),
      [currentSupplier]
    );
    const isNetworkSupplier = currentSupplierNetCheck.isNetwork;
  
  // ══════════════════════════════════════════════════════════════════════
  // Load Data
  // ══════════════════════════════════════════════════════════════════════

  const loadData = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const statusParam =
          statusFilter === 'all'
            ? undefined
            : (statusFilter as PurchaseOrder['status']);

        const [ordersRes, suppRes, prodRes, curRes] = await Promise.all([
          ordersApi.listPurchaseOrders({ status: statusParam, page, limit: 15 }),
          suppliersApi.list({ is_active: true, limit: 100 }),
          productsApi.list({ is_active: true, limit: 100 }),
          companyApi.listCurrencies(),
        ]);

        // ✅ التحقق من النوع
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.items || []);
        setPagination(
          Array.isArray(ordersRes) ? { page: 1, limit: 15, total: ordersRes.length } : ordersRes.pagination
        );
        setSuppliers(Array.isArray(suppRes) ? suppRes : suppRes.items || []);
        setProducts(Array.isArray(prodRes) ? prodRes : prodRes.items || []);
        setCurrencies(curRes || []);
      } catch (err: any) {
        setError(err.message || 'فشل تحميل أوامر الشراء');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadData(1);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════
  // Load Catalog (للمورد الشبكي)
  // ══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!selectedSupplierId) {
      setCatalog([]);
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const check = b2bApi.isNetworkSupplier(supplier);

    if (!check.isNetwork) {
      // مورد محلي → استخدم المنتجات العادية
      setCatalog(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          cost_price: p.cost_price,
          selling_price: p.selling_price,
          current_stock: p.current_stock || 0,
          units: p.units || [],
        }))
      );
      setCatalogError(null);
      return;
    }

    // مورد شبكي → جلب الكتالوج من API
    setIsCatalogLoading(true);
    setCatalogError(null);
    (async () => {
      try {
        const res = await b2bApi.getCompanyStock(selectedSupplierId);
        setCatalog(res || []);
      } catch (err: any) {
        setCatalogError(err.message || 'فشل تحميل كتالوج المورد');
        setCatalog([]);
      } finally {
        setIsCatalogLoading(false);
      }
    })();
  }, [selectedSupplierId, suppliers, products]);

  // ══════════════════════════════════════════════════════════════════════
  // Item helpers
  // ══════════════════════════════════════════════════════════════════════

  const buildDefaultItem = (prod: CatalogProduct): DraftItem => ({
    uid: uid(),
    product_id: prod.product_id || prod.id!,
    paid_quantity: 1,
    bonus_quantity: 0,
    unit_price: Number(prod.cost_price || 0),
    tax_rate: 0,
    unit_id: null,
    conversion_factor: 1,

    // ✅ حقول المشتريات
    batch_number: '',
    expiry_date: '',
  });

  const openCreateModal = () => {
    const firstSupp = suppliers[0]?.id || '';
    const firstCur = currencies.find((c) => c.code === baseCurrency)?.id || currencies[0]?.id || '';

    setSelectedSupplierId(firstSupp);
    setSelectedCurrencyId(firstCur);
    setOrderDate(new Date().toISOString().slice(0, 10));
    setItems([]);

    // ✅ Reset
    setPaymentType('credit');
    setPaymentMethod('cash');
    setPaymentTermsDays(30);
    setPaidAmount(0);
    setInvoiceDiscountRate(0);
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate('');

    setFormError(null);
    setValidationDetails(undefined);
    setIsCreateOpen(true);
  };

  const addItemRow = () => {
    const firstProd = catalog[0];
    if (!firstProd) {
      setFormError('لا توجد منتجات في الكتالوج');
      return;
    }
    setItems((prev) => [...prev, buildDefaultItem(firstProd)]);
  };

  const removeItemRow = (uidToRemove: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.uid !== uidToRemove));
  };

  const updateItemRow = (uidToUpdate: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid !== uidToUpdate ? it : { ...it, ...patch }))
    );
  };

  const handleProductChange = (uidToUpdate: string, newProductId: string) => {
    const prod = catalog.find(
      (p) => (p.product_id || p.id) === newProductId
    );
    if (!prod) {
      updateItemRow(uidToUpdate, { product_id: newProductId });
      return;
    }
    updateItemRow(uidToUpdate, {
      product_id: newProductId,
      unit_id: null,
      conversion_factor: 1,
      unit_price: Number(prod.cost_price || 0),
    });
  };

  const handleUnitChange = (uidToUpdate: string, newUnitId: string | null) => {
    const item = items.find((it) => it.uid === uidToUpdate);
    if (!item) return;

    const product = catalog.find(
      (p) => (p.product_id || p.id) === item.product_id
    );
    if (!product) return;

    const factor = resolveUnitFactor(product, newUnitId);
    const basePrice = Number(product.cost_price || 0);
    let unitPrice = basePrice;

    if (newUnitId && product.units) {
      const unit = product.units.find((u) => u.unit_id === newUnitId);
      if (unit) {
        if (unit.purchase_price != null && Number(unit.purchase_price) > 0) {
          unitPrice = Number(unit.purchase_price);
        } else {
          unitPrice = basePrice * factor;
        }
      }
    }

    updateItemRow(uidToUpdate, {
      unit_id: newUnitId,
      conversion_factor: factor,
      unit_price: unitPrice,
    });
  };

  // ══════════════════════════════════════════════════════════════════════
  // Totals
  // ══════════════════════════════════════════════════════════════════════

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      return acc + (Number(it.paid_quantity) || 0) * (Number(it.unit_price) || 0);
    }, 0);
  }, [items]);

  const discountTotal = useMemo(() => {
    return subtotal * (invoiceDiscountRate / 100);
  }, [subtotal, invoiceDiscountRate]);

  const netAfterDiscount = useMemo(() => {
    return subtotal - discountTotal;
  }, [subtotal, discountTotal]);

  const taxTotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const gross = (Number(it.paid_quantity) || 0) * (Number(it.unit_price) || 0);
      return acc + gross * ((Number(it.tax_rate) || 0) / 100);
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return netAfterDiscount + taxTotal;
  }, [netAfterDiscount, taxTotal]);

  // ══════════════════════════════════════════════════════════════════════
  // Create submit
  // ══════════════════════════════════════════════════════════════════════

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) return setFormError('يرجى اختيار المورد');
    if (!selectedCurrencyId) return setFormError('يرجى اختيار العملة');
    if (items.length === 0) return setFormError('يجب إضافة بند واحد على الأقل');

    // ✅ التحقق من payment_type
    if (paymentType === 'partial' && (paidAmount <= 0 || paidAmount >= grandTotal)) {
      return setFormError('المبلغ المدفوع يجب أن يكون بين 0 والإجمالي');
    }

    setFormLoading(true);
    setFormError(null);
    setValidationDetails(undefined);

    try {
      await ordersApi.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        currency_id: selectedCurrencyId,
        order_date: orderDate,

        // ✅ Payment & Discount
        payment_type: paymentType,
        payment_method: paymentMethod,
        payment_terms_days: paymentTermsDays,
        paid_amount: paymentType === 'cash' ? grandTotal : paidAmount,
        discount_rate: invoiceDiscountRate,

        // ✅ Supplier invoice
        supplier_invoice_number: supplierInvoiceNumber.trim() || undefined,
        supplier_invoice_date: supplierInvoiceDate || undefined,

        items: items.map((it) => ({
          product_id: it.product_id,
          paid_quantity: Number(it.paid_quantity) || 1,
          bonus_quantity: Number(it.bonus_quantity) || 0,
          quantity: (Number(it.paid_quantity) || 1) + (Number(it.bonus_quantity) || 0),
          unit_price: Number(it.unit_price) || 0,
          tax_rate: Number(it.tax_rate) || 0,
          batch_number: it.batch_number?.trim() || undefined,
          expiry_date: it.expiry_date || undefined,
          ...(it.unit_id
            ? { unit_id: it.unit_id, conversion_factor: Number(it.conversion_factor) || 1 }
            : {}),
        })),
      });

      setIsCreateOpen(false);
      loadData(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء أمر الشراء');
      if (err.details && Array.isArray(err.details)) {
        setValidationDetails(err.details);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Details & Actions
  // ══════════════════════════════════════════════════════════════════════

  const openDetailsModal = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setIsPrintOpen(false);
    setIsInvoiceModalOpen(false);
    try {
      const detailed = await ordersApi.getPurchaseOrder(order.id);
      setSelectedOrder(detailed);
    } catch {
      /* silent */
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من تأكيد أمر الشراء؟ سيتم إضافة الكميات للمخزون.')) return;
    setActionLoading(true);
    try {
      await ordersApi.confirmPurchaseOrder(selectedOrder.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل تأكيد أمر الشراء');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من إلغاء أمر الشراء؟')) return;
    setActionLoading(true);
    try {
      await ordersApi.cancelPurchaseOrder(selectedOrder.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء أمر الشراء');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await invoicesApi.createFromPurchaseOrder(selectedOrder.id, invoiceDueDate || undefined);
      setIsInvoiceModalOpen(false);
      setIsDetailsOpen(false);
      alert('تم إنشاء فاتورة الشراء بنجاح!');
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل تحويل أمر الشراء إلى فاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CSV
  // ══════════════════════════════════════════════════════════════════════

  const handleExportCsv = () => {
    const exportData = orders.map((o) => ({
      'رقم الأمر': o.order_number,
      المورد: o.supplier_name || '',
      التاريخ: o.order_date ? String(o.order_date).slice(0, 10) : '',
      'المبلغ الصافي': o.subtotal,
      الضريبة: o.tax_total,
      الإجمالي: o.total,
      الحالة: o.status,
    }));
    exportToCsv(exportData, 'purchase_orders');
  };

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            أوامر الشراء والتوريد
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة طلبات الشراء من الموردين، التكاليف، البونص، والتحويل إلى فواتير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          >
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            أمر شراء جديد
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">تصفية حسب الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">المسودات</option>
            <option value="pending_approval">بانتظار الموافقة</option>
            <option value="approved">تمت الموافقة</option>
            <option value="confirmed">المؤكدة</option>
            <option value="invoiced">المفوترة</option>
            <option value="cancelled">الملغاة</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadData(pagination.page)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadData(pagination.page)} />}

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب أوامر الشراء..." fullHeight />
        ) : orders.length === 0 ? (
          <EmptyState
            title="لا توجد أوامر شراء"
            description="يمكنك البدء بإنشاء طلب شراء من مورد."
            actionLabel="إنشاء أول أمر شراء"
            onAction={openCreateModal}
            icon={<ShoppingBag className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم الأمر</th>
                    <th className="py-3 px-4">المورد</th>
                    <th className="py-3 px-4">تاريخ الطلب</th>
                    <th className="py-3 px-4 text-center">الإجمالي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        PO#{o.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {o.supplier_name || 'مورد'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {o.order_date ? String(o.order_date).slice(0, 10) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                        {Number(o.total || 0).toLocaleString()} {baseCurrency}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => pdfApi.previewPurchaseOrder(o.id)}
                            title="عرض PDF"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(o)}
                            title="عرض التفاصيل"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={loadData} />
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Create Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
     <CreateOrderModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          suppliers={suppliers}
          currencies={currencies}
          catalog={catalog}
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
          defaultMarginRate={defaultMarginRate}
          invoiceDiscountRate={invoiceDiscountRate}
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
          onChangeDefaultMargin={setDefaultMarginRate}
          onChangeInvoiceDiscount={setInvoiceDiscountRate}
          onAddRow={addItemRow}
          onRemoveRow={removeItemRow}
          onChangeItem={updateItemRow}
          onProductChange={handleProductChange}
          onUnitChange={handleUnitChange}
          onSubmit={handleCreateSubmit}
        />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Details Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`تفاصيل أمر الشراء: PO#${selectedOrder.order_number}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">المورد</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedOrder.supplier_name || 'مورد'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الإجمالي</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {Number(selectedOrder.total || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Items */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3 text-center">الوحدة</th>
                    <th className="py-2.5 px-3 text-center">الدفعة</th>
                    <th className="py-2.5 px-3 text-center">الانتهاء</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">البونص</th>
                    <th className="py-2.5 px-3 text-center">السعر</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.product_name || 'منتج'}
                        {it.sku && <span className="text-slate-400 mr-1">({it.sku})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {it.unit_name ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {it.unit_name}
                            {Number(it.conversion_factor) > 1 && (
                              <span className="text-slate-500">×{it.conversion_factor}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[10px]">
                        {it.batch_number || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[10px]">
                        {it.expiry_date ? String(it.expiry_date).slice(0, 10) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {it.paid_quantity ?? it.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {it.bonus_quantity || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {Number(it.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold text-slate-900 font-mono">
                        {Number(it.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  طباعة أمر الشراء
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'draft' && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                    >
                      <XCircle className="w-4 h-4" />
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading ? 'جاري التأكيد...' : 'تأكيد وإضافة للمخزون'}
                    </button>
                  </>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceDueDate(
                        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                          .toISOString()
                          .slice(0, 10)
                      );
                      setIsInvoiceModalOpen(true);
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
                  >
                    <FileText className="w-4 h-4" />
                    تحويل إلى فاتورة شراء
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Convert to Invoice Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="تحويل أمر الشراء إلى فاتورة"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            سيتم إنشاء فاتورة شراء نهائية وتسجيل المديونية للمورد.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاريخ استحقاق السداد
            </label>
            <input
              type="date"
              value={invoiceDueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              {actionLoading ? 'جاري التحويل...' : 'تأكيد إنشاء الفاتورة'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Print Preview */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="أمر شراء وتوريد"
          documentType="أمر شراء"
          documentNumber={selectedOrder.order_number}
          documentDate={
            selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : ''
          }
          partyTitle="المورد"
          partyName={selectedOrder.supplier_name || 'مورد'}
          currencyCode={baseCurrency}
          company={company}
          items={(selectedOrder.items || []).map((it: any) => ({
            name: it.product_name || 'منتج',
            sku: it.sku,
            quantity: Number(it.paid_quantity ?? it.quantity),
            bonus_quantity: Number(it.bonus_quantity || 0),
            unit_price: Number(it.unit_price),
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