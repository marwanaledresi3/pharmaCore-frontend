import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Trash2,
  Eye,
} from 'lucide-react';
import { ordersApi } from '../api/ordersApi';
import { customersApi } from '../api/customersApi';
import { productsApi } from '../api/productsApi';
import { companyApi } from '../api/companyApi';
import { invoicesApi } from '../api/invoicesApi';
import {
  SalesOrder,
  Customer,
  Product,
  Currency,
  Pagination as PaginationType,
  ValidationErrorDetail,
} from '../types';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { pdfApi } from '../api/pdfApi1';
import { CashRegisterSelect } from '../components/common/CashRegisterSelect';
// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface DraftItem {
  uid: string;
  product_id: string;
  paid_quantity: number;
  bonus_quantity: number;
  unit_price: number;
  tax_rate: number;
  unit_id: string | null;
  conversion_factor: number;
}

const uid = () => `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

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

export const SalesOrdersPage: React.FC = () => {
  const { company, user } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 15,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // References
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<DraftItem[]>([]);

  // 🆕 Payment & Discount
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [invoiceDiscountRate, setInvoiceDiscountRate] = useState<number>(0);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<ValidationErrorDetail[] | undefined>();

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');


  const [cashRegisterId, setCashRegisterId] = useState<string | null>(null);
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
            : (statusFilter as 'draft' | 'confirmed' | 'invoiced' | 'cancelled');

        const [ordersRes, custRes, prodRes, curRes] = await Promise.all([
          ordersApi.listSalesOrders({ status: statusParam, page, limit: 15 }),
          customersApi.list({ is_active: true, limit: 100 }),
          productsApi.list({ is_active: true, limit: 100 }),
          companyApi.listCurrencies(),
        ]);

        setOrders(ordersRes.items);
        setPagination(ordersRes.pagination);
        setCustomers(custRes.items);
        setProducts(prodRes.items);
        setCurrencies(curRes);
      } catch (err: any) {
        setError(err.message || 'فشل تحميل أوامر البيع');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadData(1);
  }, [statusFilter]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════
  // Item helpers
  // ══════════════════════════════════════════════════════════════════════

  const buildDefaultItem = (prod: Product): DraftItem => ({
    uid: uid(),
    product_id: prod.id,
    paid_quantity: 1,
    bonus_quantity: 0,
    unit_price: Number(prod.selling_price || 0),
    tax_rate: 0,
    unit_id: null,
    conversion_factor: 1,
  });

  const openCreateModal = () => {
    const firstCust = customers[0]?.id || '';
    const firstCur = currencies.find((c) => c.code === baseCurrency)?.id || currencies[0]?.id || '';
    const firstProd = products[0];

    setSelectedCustomerId(firstCust);
    setSelectedCurrencyId(firstCur);
    setOrderDate(new Date().toISOString().slice(0, 10));
    setItems(firstProd ? [buildDefaultItem(firstProd)] : []);

    // 🆕 Reset
    setPaymentType('cash');
    setPaymentMethod('cash');
    setPaidAmount(0);
    setInvoiceDiscountRate(0);

    setFormError(null);
    setValidationDetails(undefined);
    setIsCreateOpen(true);
    setCashRegisterId(null);
  };

  const addItemRow = () => {
    const firstProd = products[0];
    if (!firstProd) return;
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
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) {
      updateItemRow(uidToUpdate, { product_id: newProductId });
      return;
    }
    updateItemRow(uidToUpdate, {
      product_id: newProductId,
      unit_id: null,
      conversion_factor: 1,
      unit_price: Number(prod.selling_price || 0),
    });
  };

  const handleUnitChange = (uidToUpdate: string, newUnitId: string | null) => {
    const item = items.find((it) => it.uid === uidToUpdate);
    if (!item) return;

    const product = products.find((p) => p.id === item.product_id);
    if (!product) return;

    const factor = resolveUnitFactor(product, newUnitId);
    const basePrice = Number(product.selling_price || 0);
    let unitPrice = basePrice;

    if (newUnitId && product.units) {
      const unit = product.units.find((u) => u.unit_id === newUnitId);
      if (unit) {
        if (unit.sale_price != null && Number(unit.sale_price) > 0) {
          unitPrice = Number(unit.sale_price);
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
      const gross = it.paid_quantity * it.unit_price;
      return acc + gross;
    }, 0);
  }, [items]);

  // 🆕 إجمالي الخصم (على الفاتورة)
  const discountTotal = useMemo(() => {
    return subtotal * (invoiceDiscountRate / 100);
  }, [subtotal, invoiceDiscountRate]);

  // 🆕 الصافي بعد الخصم
  const netAfterDiscount = useMemo(() => {
    return subtotal - discountTotal;
  }, [subtotal, discountTotal]);

  const taxTotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const gross = it.paid_quantity * it.unit_price;
      return acc + gross * (it.tax_rate / 100);
    }, 0);
  }, [items]);

  // 🆕 الإجمالي النهائي
  const grandTotal = useMemo(() => {
    return netAfterDiscount + taxTotal;
  }, [netAfterDiscount, taxTotal]);

  // ══════════════════════════════════════════════════════════════════════
  // Create submit
  // ══════════════════════════════════════════════════════════════════════

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      setFormError('يرجى اختيار العميل');
      return;
    }
    if (!selectedCurrencyId) {
      setFormError('يرجى اختيار العملة');
      return;
    }
    if (items.length === 0) {
      setFormError('يجب إضافة صنف واحد على الأقل لأمر البيع');
      return;
    }
    if (items.some((it) => Number(it.unit_price) <= 0)) {
      setFormError('سعر البيع يجب أن يكون أكبر من صفر لكل بند');
      return;
    }

    // ✅ التحقق من نوع الدفع
    if (paymentType === 'partial' && paidAmount <= 0) {
      setFormError('يرجى إدخال المبلغ المدفوع');
      return;
    }
    if (paymentType === 'partial' && paidAmount >= grandTotal) {
      setFormError('المبلغ المدفوع يجب أن يكون أقل من الإجمالي (استخدم نقدي)');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setValidationDetails(undefined);

    try {
      await ordersApi.createSalesOrder({
        customer_id: selectedCustomerId,
        currency_id: selectedCurrencyId,
        cash_register_id: paymentType !== 'credit' && paymentMethod === 'cash' ? cashRegisterId : null,
        order_date: orderDate,

        // 🆕 الحقول الجديدة
        payment_type: paymentType,
        payment_method: paymentMethod,
        payment_terms_days: paymentType === 'credit' ? 30 : 0,
        paid_amount: paymentType === 'cash' ? grandTotal : paidAmount,
        discount_rate: invoiceDiscountRate,

        items: items.map((it) => ({
          product_id: it.product_id,
          paid_quantity: Number(it.paid_quantity) || 1,
          bonus_quantity: Number(it.bonus_quantity) || 0,
          quantity: (Number(it.paid_quantity) || 1) + (Number(it.bonus_quantity) || 0),
          unit_price: Number(it.unit_price) || 0,
          tax_rate: Number(it.tax_rate) || 0,
          ...(it.unit_id
            ? { unit_id: it.unit_id, conversion_factor: Number(it.conversion_factor) || 1 }
            : {}),
        })),
      });

      setIsCreateOpen(false);
      loadData(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء أمر البيع');
      if (err.details && Array.isArray(err.details)) {
        setValidationDetails(err.details);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Details
  // ══════════════════════════════════════════════════════════════════════

  const openDetailsModal = async (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setIsPrintOpen(false);
    setIsInvoiceModalOpen(false);
    try {
      const detailed = await ordersApi.getSalesOrder(order.id);
      setSelectedOrder(detailed);
    } catch {
      /* silent */
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من تأكيد أمر البيع؟ سيتم خصم الكميات من المخزون فورياً.')) return;
    setActionLoading(true);
    try {
      await ordersApi.confirmSalesOrder(selectedOrder.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل تأكيد أمر البيع (تحقق من توفر رصيد كافي في المخزون)');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء أمر البيع هذا؟')) return;
    setActionLoading(true);
    try {
      await ordersApi.cancelSalesOrder(selectedOrder.id);
      setIsDetailsOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء أمر البيع');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await invoicesApi.createFromSalesOrder(selectedOrder.id, invoiceDueDate || undefined);
      setIsInvoiceModalOpen(false);
      setIsDetailsOpen(false);
      alert('تم إنشاء فاتورة المبيعات بنجاح وترحيلها إلى قسم الفواتير!');
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل تحويل أمر البيع إلى فاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CSV
  // ══════════════════════════════════════════════════════════════════════

  const handleExportCsv = () => {
    const exportData = orders.map((o) => ({
      'رقم أمر البيع': o.order_number,
      العميل: o.customer_name || '',
      التاريخ: o.order_date ? String(o.order_date).slice(0, 10) : '',
      'المبلغ الصافي': o.subtotal,
      الضريبة: o.tax_total,
      الإجمالي: o.total,
      الحالة: o.status,
    }));
    exportToCsv(exportData, 'sales_orders');
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
            أوامر البيع والصرف
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة طلبات العملاء، حساب الخصومات والبونص، التحقق من توفر المخزون، وإصدار الفواتير
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
            أمر بيع جديد
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
            <option value="draft">المسودات (Draft)</option>
            <option value="confirmed">المؤكدة (Confirmed)</option>
            <option value="invoiced">المفوترة (Invoiced)</option>
            <option value="cancelled">الملغاة (Cancelled)</option>
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
          <LoadingSpinner message="جاري جلب أوامر البيع..." fullHeight />
        ) : orders.length === 0 ? (
          <EmptyState
            title="لا توجد أوامر بيع"
            description="يمكنك البدء بإنشاء طلب بيع للعميل وصرف المنتجات من المستودع."
            actionLabel="إنشاء أول أمر بيع"
            onAction={openCreateModal}
            icon={<ShoppingCart className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم الأمر</th>
                    <th className="py-3 px-4">العميل</th>
                    <th className="py-3 px-4">تاريخ الطلب</th>
                    <th className="py-3 px-4 text-center">المبلغ الإجمالي</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        SO#{o.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {o.customer_name || 'عميل عام'}
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
                            onClick={() => pdfApi.previewSalesOrder(o.id)}
                            title="عرض PDF"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(o)}
                            title="عرض التفاصيل والبنود"
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Create Sales Order Modal */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="إنشاء أمر بيع جديد"
        maxWidth="5xl"
      >
        {formError && (
          <ErrorAlert error={formError} details={validationDetails} className="mb-4" />
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Top Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العميل *</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ أمر البيع *</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
              <select
                required
                value={selectedCurrencyId}
                onChange={(e) => setSelectedCurrencyId(e.target.value)}
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

          {/* 🆕 Payment Fields */}
          <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
            <h4 className="text-xs font-black text-blue-950 mb-3">💳 تفاصيل الدفع</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع الدفع *
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cash">نقدي (Cash)</option>
                  <option value="credit">آجل (Credit)</option>
                  <option value="partial">جزئي (Partial)</option>
                </select>
              </div>

             

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  طريقة الدفع
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cash">صندوق (Cash)</option>
                  <option value="bank">بنك (Bank)</option>
                  <option value="cheque">شيك (Cheque)</option>
                </select>
              </div>

               {/* يظهر عند اختيار الدفع بالصندوق */}
              {paymentType !== 'credit' && paymentMethod === 'cash' && (
                <CashRegisterSelect
                  value={cashRegisterId}
                  onChange={(id) => setCashRegisterId(id)}
                  branchId={user?.branch_id || null}
                  required
                />
              )}

              {paymentType !== 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ المدفوع
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {paymentType === 'cash' ? 'يُملأ تلقائياً بالإجمالي' : 'جزء من الإجمالي'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800">بنود أمر البيع</h4>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة بند
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 min-w-[180px]">الدواء / الصنف *</th>
                    <th className="py-2.5 px-2 text-center min-w-[130px]">الوحدة</th>
                    <th className="py-2.5 px-2 text-center w-24">كمية مدفوعة</th>
                    <th className="py-2.5 px-2 text-center w-24">بونص</th>
                    <th className="py-2.5 px-2 text-center w-28">سعر البيع</th>
                    <th className="py-2.5 px-2 text-center w-20">ضريبة %</th>
                    <th className="py-2.5 px-3 text-left w-28">الإجمالي</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => {
                    const gross = (Number(it.paid_quantity) || 0) * (Number(it.unit_price) || 0);
                    const tax = gross * ((Number(it.tax_rate) || 0) / 100);
                    const lineTotal = gross + tax;

                    const currentProduct = products.find((p) => p.id === it.product_id);
                    const units = currentProduct?.units || [];

                    return (
                      <tr key={it.uid} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select
                            required
                            value={it.product_id}
                            onChange={(e) => handleProductChange(it.uid, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - متوفر: {p.current_stock || 0}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* الوحدة */}
                        <td className="p-2 text-center">
                          <select
                            value={it.unit_id || ''}
                            onChange={(e) => handleUnitChange(it.uid, e.target.value || null)}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-emerald-500"
                          >
                            <option value="">
                              أساسية ({currentProduct?.unit || 'وحدة'})
                            </option>
                            {units
                              .filter((u) => !u.is_base_unit)
                              .map((u) => (
                                <option key={u.unit_id} value={u.unit_id}>
                                  {u.unit_name} (×{u.conversion_factor})
                                </option>
                              ))}
                          </select>
                          {Number(it.conversion_factor) > 1 && (
                            <span className="block text-[9px] text-emerald-600 mt-0.5">
                              = {it.paid_quantity * it.conversion_factor}{' '}
                              {currentProduct?.unit || 'وحدة'}
                            </span>
                          )}
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            required
                            min="1"
                            value={it.paid_quantity}
                            onChange={(e) =>
                              updateItemRow(it.uid, { paid_quantity: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={it.bonus_quantity}
                            onChange={(e) =>
                              updateItemRow(it.uid, { bonus_quantity: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono text-emerald-700 font-bold"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={it.unit_price}
                            onChange={(e) =>
                              updateItemRow(it.uid, { unit_price: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={it.tax_rate}
                            onChange={(e) =>
                              updateItemRow(it.uid, { tax_rate: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono"
                          />
                        </td>

                        <td className="p-2 text-left font-bold text-slate-900 font-mono">
                          {lineTotal.toFixed(2)}
                        </td>

                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(it.uid)}
                              className="text-slate-400 hover:text-rose-600 transition"
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

          {/* 🆕 Totals */}
          <div className="flex justify-end p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-80 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>المجموع الصافي:</span>
                <span className="font-mono font-bold text-slate-800">
                  {subtotal.toFixed(2)} {baseCurrency}
                </span>
              </div>

              {/* 🆕 خصم الفاتورة */}
              <div className="flex justify-between items-center gap-2 py-1">
                <div className="flex items-center gap-1">
                  <span>خصم الفاتورة:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoiceDiscountRate}
                    onChange={(e) => setInvoiceDiscountRate(Number(e.target.value))}
                    className="w-16 rounded border border-slate-300 p-1 text-xs text-center font-mono"
                  />
                  <span>%</span>
                </div>
                <span className="font-mono text-rose-600 font-bold">
                  -{discountTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>الصافي بعد الخصم:</span>
                <span className="font-mono font-bold text-slate-800">
                  {netAfterDiscount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>إجمالي الضرائب:</span>
                <span className="font-mono">
                  {taxTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm text-slate-900">
                <span>الإجمالي الكلي:</span>
                <span className="font-mono text-emerald-700">
                  {grandTotal.toFixed(2)} {baseCurrency}
                </span>
              </div>

              {paymentType !== 'credit' && paidAmount > 0 && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>المتبقي:</span>
                  <span className="font-mono text-rose-600">
                    {(grandTotal - paidAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ أمر البيع'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Details & Actions Modal */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`تفاصيل أمر البيع: SO#${selectedOrder.order_number}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">العميل</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedOrder.customer_name || 'عميل عام'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">تاريخ الأمر</span>
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
                    <th className="py-2.5 px-3">الصنف</th>
                    <th className="py-2.5 px-3 text-center">الوحدة</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">البونص</th>
                    <th className="py-2.5 px-3 text-center">السعر</th>
                    <th className="py-2.5 px-3 text-center">الضريبة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.product_name || 'دواء'}
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
                      <td className="py-2.5 px-3 text-center font-mono">
                        {it.paid_quantity ?? it.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {it.bonus_quantity || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {Number(it.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {it.tax_rate ? `${it.tax_rate}%` : '-'}
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
                  طباعة أمر البيع
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
                      إلغاء الطلب
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actionLoading ? 'جاري التأكيد...' : 'تأكيد وصرف المخزون'}
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
                    تحويل إلى فاتورة مبيعات
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Convert to Invoice Modal */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="تحويل أمر البيع إلى فاتورة مبيعات رسمية"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            سيتم إنشاء فاتورة مبيعات نهائية وتسجيل المديونية المستحقة على العميل.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تاريخ استحقاق السداد (Due Date)
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Print Preview Modal */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="أمر بيع وصرف"
          documentType="أمر بيع"
          documentNumber={selectedOrder.order_number}
          documentDate={
            selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : ''
          }
          partyTitle="العميل"
          partyName={selectedOrder.customer_name || 'عميل عام'}
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
            { label: 'ضريبة المخرجات', value: Number(selectedOrder.tax_total || 0) },
            { label: 'الإجمالي النهائي', value: Number(selectedOrder.total || 0), isTotal: true },
          ]}
        />
      )}
    </div>
  );
};