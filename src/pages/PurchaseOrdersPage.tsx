import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ShoppingBag, Plus, RefreshCw, CheckCircle2, XCircle, FileText,
  Printer, Trash2, Eye, Building2, Package, Globe, Sparkles,
  ShieldCheck, AlertCircle, QrCode, CreditCard, Calendar, Wallet,
} from 'lucide-react';
import { ordersApi, PaymentType, PaymentMethod } from '../api/ordersApi';
import { suppliersApi } from '../api/suppliersApi';
import { productsApi } from '../api/productsApi';
import { companyApi } from '../api/companyApi';
import { invoicesApi } from '../api/invoicesApi';
import { b2bApi } from '../api/b2bApi';
import {
  PurchaseOrder, Supplier, Product, Currency,
  Pagination as PaginationType, ValidationErrorDetail,
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

/* ============================================================
 * Types
 * ============================================================ */

interface CatalogProduct extends Product {
  is_network_product?: boolean;
  live_batch_number?: string;
  live_expiry_date?: string;
  total_quantity?: number;
  current_stock?: number;
  wholesale_price?: number;
}

interface DraftItem {
  uid: string;
  product_id: string;
  paid_quantity: number;
  bonus_quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;   // ← أضف
  tax_rate: number;
  batch_number: string;
  expiry_date: string;
}

type RefsStatus = 'idle' | 'loading' | 'ready' | 'error';

const STATUS_FILTERS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'draft', label: 'المسودات (Draft)' },
  { value: 'pending_approval', label: 'بانتظار موافقة المورد (Pending)' },
  { value: 'approved', label: 'موافَق عليها من المورد (Approved)' },
  { value: 'rejected', label: 'مرفوضة من المورد (Rejected)' },
  { value: 'confirmed', label: 'مؤكدة ومستلمة (Confirmed)' },
  { value: 'cancelled', label: 'ملغاة (Cancelled)' },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]['value'];

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: 'نقد',
  credit: 'آجل',
  partial: 'جزئي',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقد',
  bank: 'تحويل بنكي',
  cheque: 'شيك',
  card: 'بطاقة',
  wallet: 'محفظة',
  other: 'أخرى',
};

const uid = () => `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const normalize = (s: unknown) => String(s ?? '').trim().toLowerCase();

/* ============================================================
 * Component
 * ============================================================ */

export const PurchaseOrdersPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  /* ---------- Orders list ---------- */
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  /* ---------- References ---------- */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [refsStatus, setRefsStatus] = useState<RefsStatus>('idle');
  const [refsError, setRefsError] = useState<string | null>(null);

  /* ---------- Create modal ---------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [orderDate, setOrderDate] = useState(toDateInput(new Date()));

  // حقول الدفع
  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [paidAmount, setPaidAmount] = useState(0);

  const [activeCatalogProducts, setActiveCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<ValidationErrorDetail[] | undefined>();

  /* ---------- Details ---------- */
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const detailsReqId = useRef(0);

  /* ---------- State ---------- */
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');

  /* ---------- QR ---------- */
  const [qrModalData, setQrModalData] = useState<{
    url: string;
    qr_data_url: string;
    pin: string | null;
    expires_at: string;
  } | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  /* ---------- Print ---------- */
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  /* ---------- Invoice ---------- */
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  /* ============================================================
   * Derived state
   * ============================================================ */

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

  /* ============================================================
   * Data loading
   * ============================================================ */

  const loadReferences = useCallback(async () => {
  setRefsStatus('loading');
  setRefsError(null);

  const [supRes, prodRes, curRes] = await Promise.allSettled([
    suppliersApi.list({ is_active: true, limit: 100 }),
    productsApi.list({ is_active: true, limit: 100 }),
    companyApi.listCurrencies(),
  ]);

  const errors: string[] = [];

  /* ---------- suppliers ---------- */
  if (supRes.status === 'fulfilled') {
    const v: unknown = supRes.value;
    let items: Supplier[] = [];
    if (Array.isArray(v)) {
      items = v as Supplier[];
    } else if (
      v !== null &&
      typeof v === 'object' &&
      'items' in v &&
      Array.isArray((v as { items: unknown }).items)
    ) {
      items = (v as { items: Supplier[] }).items;
    }
    setSuppliers(items);
    console.log('[refs] suppliers OK:', items.length);
  } else {
    console.error('[refs] suppliers FAILED:', supRes.reason);
    errors.push(`الموردون: ${supRes.reason?.message || 'خطأ'}`);
  }

  /* ---------- products ---------- */
  if (prodRes.status === 'fulfilled') {
    const v: unknown = prodRes.value;
    let items: Product[] = [];
    if (Array.isArray(v)) {
      items = v as Product[];
    } else if (
      v !== null &&
      typeof v === 'object' &&
      'items' in v &&
      Array.isArray((v as { items: unknown }).items)
    ) {
      items = (v as { items: Product[] }).items;
    }
    setProducts(items);
    console.log('[refs] products OK:', items.length);
  } else {
    console.error('[refs] products FAILED:', prodRes.reason);
    errors.push(`المنتجات: ${prodRes.reason?.message || 'خطأ'}`);
  }

  /* ---------- currencies ---------- */
  if (curRes.status === 'fulfilled') {
    const v: unknown = curRes.value;
    let items: Currency[] = [];
    if (Array.isArray(v)) {
      items = v as Currency[];
    } else if (
      v !== null &&
      typeof v === 'object' &&
      'items' in v &&
      Array.isArray((v as { items: unknown }).items)
    ) {
      items = (v as { items: Currency[] }).items;
    }
    setCurrencies(items);
    console.log('[refs] currencies OK:', items.length);
  } else {
    console.error('[refs] currencies FAILED:', curRes.reason);
    errors.push(`العملات: ${curRes.reason?.message || 'خطأ'}`);
  }

  if (errors.length > 0) {
    setRefsError(errors.join(' | '));
    setRefsStatus('error');
  } else {
    setRefsStatus('ready');
  }
}, []);

  const loadOrders = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setListError(null);
      try {
        const statusParam = statusFilter === 'all' ? undefined : statusFilter;
        const res = await ordersApi.listPurchaseOrders({ status: statusParam, page, limit: 15 });
        setOrders(res.items);
        setPagination(res.pagination);
      } catch (err: any) {
        setListError(err?.message || 'فشل تحميل أوامر الشراء');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => { loadReferences(); }, [loadReferences]);
  useEffect(() => { loadOrders(1); }, [statusFilter]);

  /* ============================================================
   * Supplier catalog loader
   * ============================================================ */

  useEffect(() => {
    if (!isCreateOpen || !selectedSupplierId) {
      setActiveCatalogProducts([]);
      setIsCatalogLoading(false);
      setCatalogError(null);
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) {
      setActiveCatalogProducts([]);
      return;
    }

    let cancelled = false;
    setIsCatalogLoading(true);
    setCatalogError(null);
    setActiveCatalogProducts([]);

    const load = async () => {
      try {
        const network = b2bApi.isNetworkSupplier(supplier);
        let catalog: CatalogProduct[] = [];

        if (network.isNetwork && network.companyId) {
          const stockProducts = (await productsApi.getStock(network.companyId)) as CatalogProduct[];

catalog = stockProducts
  .filter((p) => Number(p.total_quantity ?? p.quantity ?? 0) > 0)
  .map((p) => {
    const batches = Array.isArray((p as any).batches) ? (p as any).batches : [];
    const liveBatch = batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];
    return {
      ...p,
      id: p.id,
      name: p.name,
      sku: p.sku ?? '',
      cost_price: Number(liveBatch?.cost_price ?? p.cost_price ?? 0),
      wholesale_price: Number(p.wholesale_price ?? liveBatch?.cost_price ?? p.cost_price ?? 0),
      quantity: Number(p.total_quantity ?? 0),
      total_quantity: Number(p.total_quantity ?? 0),
      current_stock: Number(p.total_quantity ?? 0),
      is_network_product: true,
      live_batch_number: (p as any).live_batch_number ?? liveBatch?.batch_number ?? '',
      live_expiry_date: (p as any).live_expiry_date ?? liveBatch?.expiry_date ?? '',
    } as CatalogProduct;
  });
        } else {
          catalog = products as CatalogProduct[];
        }

        if (cancelled) return;

        setActiveCatalogProducts(catalog);

        setItems((previous) => {
          const valid = previous.filter((it) =>
            catalog.some((p) => p.id === it.product_id)
          );
          if (valid.length > 0) return valid;

          const first = catalog[0];
          if (!first) return [];

          return [{
            uid: uid(),
            product_id: first.id,
            paid_quantity: 1,
            bonus_quantity: 0,
            unit_price: Number(first.wholesale_price ?? first.cost_price ?? 0),
            discount_rate: 0,
 	    discount_amount: 0, 
            tax_rate: 0,
            batch_number: first.live_batch_number || '',
            expiry_date: first.live_expiry_date || '',
          }];
        });
      } catch (err: any) {
        if (cancelled) return;
        console.error('خطأ في تحميل منتجات المورد:', err);
        setActiveCatalogProducts([]);
        setItems([]);
        setCatalogError(err?.message || 'تعذر جلب منتجات المورد المحدد');
      } finally {
        if (!cancelled) setIsCatalogLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, isCreateOpen]);

  /* ============================================================
   * Create modal handlers
   * ============================================================ */

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
    setCatalogError(null);
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
    setCatalogError(null);
  };

  const addItemRow = () => {
    if (isCatalogLoading) return;
    const first = activeCatalogProducts[0];
    if (!first) {
      setFormError('لا توجد منتجات متاحة لهذا المورد');
      return;
    }
    setItems((prev) => [...prev, {
      uid: uid(),
      product_id: first.id,
      paid_quantity: 1,
      bonus_quantity: 0,
      unit_price: Number(first.wholesale_price ?? first.cost_price ?? 0),
      discount_rate: 0,
      discount_amount: 0,
      tax_rate: 0,
      batch_number: first.live_batch_number || '',
      expiry_date: first.live_expiry_date || '',
    }]);
  };

  const removeItemRow = (uidToRemove: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.uid !== uidToRemove)));
  };

  const updateItemRow = (uidToUpdate: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => (it.uid !== uidToUpdate ? it : { ...it, ...patch })));
  };

  const handleProductChange = (uidToUpdate: string, newProductId: string) => {
    const prod = activeCatalogProducts.find((p) => p.id === newProductId);
    const patch: Partial<DraftItem> = { product_id: newProductId };
    if (prod) {
      patch.unit_price = Number(prod.wholesale_price ?? prod.cost_price ?? 0);
      patch.batch_number = prod.live_batch_number || '';
      patch.expiry_date = prod.live_expiry_date || '';
    }
    updateItemRow(uidToUpdate, patch);
  };

  /* ============================================================
   * Totals
   * ============================================================ */

  const { subtotal, taxTotal, grandTotal } = useMemo(() => {
  let sub = 0;
  let taxSum = 0;

  for (const it of items) {
    const isNet = isNetworkSupplier;

    const gross = (Number(it.paid_quantity) || 0) * (Number(it.unit_price) || 0);

    let disc = 0;
    if (!isNet) {
      const dr = Number(it.discount_rate) || 0;
      const da = Number(it.discount_amount) || 0;
      if (dr > 0) disc = gross * (dr / 100);
      else if (da > 0) disc = Math.min(da, gross);
    }

    const net = Math.max(0, gross - disc);

    const taxRate = isNet ? 0 : (Number(it.tax_rate) || 0);
    const lineTax = net * (taxRate / 100);

    sub += net;
    taxSum += lineTax;
  }

  return {
    subtotal: sub,
    taxTotal: taxSum,
    grandTotal: sub + taxSum,
  };
}, [items, isNetworkSupplier]);

  /* ============================================================
   * Create submit
   * ============================================================ */

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) return setFormError('يرجى اختيار المورد');
    if (!selectedCurrencyId) return setFormError('يرجى اختيار العملة');
    if (items.length === 0) return setFormError('يجب إضافة صنف واحد على الأقل');
    if (isCatalogLoading) return setFormError('انتظر انتهاء تحميل كتالوج المورد');

    // تحقق من الدفع
    if (paymentType === 'partial') {
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        return setFormError('المبلغ المدفوع مطلوب للدفع الجزئي');
      }
      if (paidAmount >= grandTotal) {
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

      const localBySku = new Map<string, Product>();
      const localByName = new Map<string, Product>();
      const rememberLocal = (p: Product) => {
        if (p.sku) localBySku.set(normalize(p.sku), p);
        if (p.name) localByName.set(normalize(p.name), p);
      };
      products.forEach(rememberLocal);

      const createdProducts: Product[] = [];
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

          if (sku) localProduct = localBySku.get(normalize(sku));
          if (!localProduct && catalogItem.name) {
            localProduct = localByName.get(normalize(catalogItem.name));
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
 		itemPayload.discount_amount = discountAmount;   // ← أضف
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
        supplier_invoice_number: supplierInvoiceNumber || undefined,   // ← أضف
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

  /* ============================================================
   * Details & actions
   * ============================================================ */

  const openDetailsModal = async (order: PurchaseOrder) => {
    const reqId = ++detailsReqId.current;
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const detailed = await ordersApi.getPurchaseOrder(order.id);
      if (reqId === detailsReqId.current) setSelectedOrder(detailed);
    } catch { /* silent */ } finally {
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

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await invoicesApi.createFromPurchaseOrder(selectedOrder.id, invoiceDueDate || undefined);
      setIsInvoiceModalOpen(false);
      closeDetailsModal();
      window.alert('تم إنشاء فاتورة المشتريات بنجاح وترحيلها إلى قسم الفواتير!');
      await loadOrders(pagination.page);
    } catch (err: any) {
      window.alert(err?.message || 'فشل تحويل أمر الشراء إلى فاتورة');
    } finally {
      setActionLoading(false);
    }
  };

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

  /* ============================================================
   * Render helpers
   * ============================================================ */

  const SupplierKindBadge: React.FC<{ supplier?: Supplier; size?: 'sm' | 'md' }> = ({ supplier, size = 'sm' }) => {
    const check = b2bApi.isNetworkSupplier(supplier);
    const cls = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[10px]';
    return check.isNetwork ? (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ${cls}`} title="مورد شبكي B2B">
        <Building2 className="w-2.5 h-2.5" /> مورد شبكي B2B
      </span>
    ) : (
      <span className={`inline-flex items-center gap-1 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200 ${cls}`} title="مورد محلي">
        <Package className="w-2.5 h-2.5" /> مورد محلي
      </span>
    );
  };

  /* ============================================================
   * Render
   * ============================================================ */

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">أوامر الشراء والتوريد</h1>
          <p className="text-xs text-slate-500 mt-1">إدارة طلبات الشراء، اعتماد كميات البونص، تحديث المخزون، والفوترة</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleExportCsv} disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            تصدير CSV
          </button>
          <button type="button" onClick={openCreateModal} disabled={!canOpenCreate} title={createDisabledReason}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" />
            {refsStatus === 'loading' || refsStatus === 'idle' ? 'جاري التحميل...' : 'أمر شراء جديد'}
          </button>
        </div>
      </div>

      {refsStatus === 'error' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span>تعذر تحميل المراجع: {refsError}</span></div>
          <button onClick={loadReferences} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">تصفية حسب الحالة:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none">
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <button onClick={() => loadOrders(pagination.page)} disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {listError && <ErrorAlert error={listError} onRetry={() => loadOrders(pagination.page)} />}

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب أوامر الشراء..." fullHeight />
        ) : orders.length === 0 ? (
          <EmptyState title="لا توجد أوامر شراء" description="يمكنك البدء بإنشاء طلب شراء للمورد."
            actionLabel={canOpenCreate ? 'إنشاء أول أمر شراء' : undefined}
            onAction={canOpenCreate ? openCreateModal : undefined}
            icon={<ShoppingBag className="w-8 h-8" />} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم الأمر</th>
                    <th className="py-3 px-4">المورد</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4 text-center">الإجمالي</th>
                    <th className="py-3 px-4 text-center">الدفع</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
		    {!isNetworkSupplier && (
                      <th className="py-2.5 px-2 text-center w-20">خصم مبلغ</th>
	            )}
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const sup = suppliers.find((s) => s.id === o.supplier_id || s.name === o.supplier_name);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition">

                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">PO#{o.order_number}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{o.supplier_name || 'مورد عام'}</span>
                            <SupplierKindBadge supplier={sup} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {o.order_date ? String(o.order_date).slice(0, 10) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                          {Number(o.total || 0).toLocaleString()} {baseCurrency}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {o.payment_type ? (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {PAYMENT_TYPE_LABELS[o.payment_type as PaymentType]}
                            </span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center"><StatusBadge status={o.status} /></td>

                        <td className="py-3.5 px-4 text-left">
                          <button
                            type="button"
                            onClick={() => pdfApi.previewPurchaseOrder(o.id)}
                            title="عرض PDF"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDetailsModal(o)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="عرض التفاصيل">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={loadOrders} />
          </>
        )}
      </div>

      {/* ============ Create Purchase Order Modal ============ */}
      <Modal isOpen={isCreateOpen} onClose={closeCreateModal} title="إنشاء أمر شراء وتوريد جديد" maxWidth="5xl">
        {formError && <ErrorAlert error={formError} details={validationDetails} className="mb-4" />}

        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Top Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
              <select required value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none">
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => {
                  const check = b2bApi.isNetworkSupplier(s);
                  return <option key={s.id} value={s.id}>{check.isNetwork ? `🏢 ${s.name} (شبكي)` : `📦 ${s.name} (محلي)`}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ أمر الشراء *</label>
              <input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
              <select required value={selectedCurrencyId} onChange={(e) => setSelectedCurrencyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none">
                {currencies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>

          {/* ============ Payment Fields ============ */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-black text-blue-900">طريقة الدفع</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الدفع *</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none">
                  <option value="cash">💵 نقد</option>
                  <option value="credit">📅 آجل</option>
                  <option value="partial">💰 جزئي</option>
                </select>
              </div>

              {paymentType !== 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none">
                    <option value="cash">نقد</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="cheque">شيك</option>
                    <option value="card">بطاقة</option>
                    <option value="wallet">محفظة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              )}

              {paymentType !== 'cash' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مدة السداد (أيام)</label>
                  <input type="number" min="0" max="365" value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono" />
                </div>
              )}

              {paymentType === 'partial' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع *</label>
                  <input type="number" min="0" step="0.01" value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono" />
                  <span className="text-[10px] text-slate-500 mt-1 block">الباقي: {(grandTotal - paidAmount).toFixed(2)} {baseCurrency}</span>
                </div>
              )}
            </div>
            {paymentType === 'credit' && (
              <p className="text-[11px] text-slate-500 mt-2">
                <Calendar className="w-3 h-3 inline mr-1" />
                الاستحقاق بعد {paymentTermsDays} يوماً من تاريخ الطلب
              </p>
            )}
          </div>
{/* فاتورة المورد الورقية */}
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
  <div className="flex items-center gap-2 mb-3">
    <FileText className="w-4 h-4 text-slate-700" />
    <h4 className="text-xs font-black text-slate-800">بيانات فاتورة المورد الورقية (اختياري)</h4>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة</label>
      <input
        type="text"
        value={supplierInvoiceNumber}
        onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
        placeholder="INV-2026-12345"
        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
      <input
        type="date"
        value={supplierInvoiceDate}
        onChange={(e) => setSupplierInvoiceDate(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
      />
    </div>
  </div>
</div>
{((selectedOrder as any).supplier_invoice_number || (selectedOrder as any).supplier_invoice_date) && (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
    <div className="flex items-center gap-2 mb-2">
      <FileText className="w-4 h-4 text-slate-700" />
      <span className="font-bold text-slate-900">فاتورة المورد الورقية</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {(selectedOrder as any).supplier_invoice_number && (
        <div>
          <span className="text-slate-500">رقم: </span>
          <span className="font-mono font-bold">{(selectedOrder as any).supplier_invoice_number}</span>
        </div>
      )}
      {(selectedOrder as any).supplier_invoice_date && (
        <div>
          <span className="text-slate-500">تاريخ: </span>
          <span className="font-mono font-bold">{String((selectedOrder as any).supplier_invoice_date).slice(0, 10)}</span>
        </div>
      )}
    </div>
  </div>
)}
          {/* Supplier Banner */}
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
                        <CheckCircle2 className="w-3 h-3 inline" /> {activeCatalogProducts.length} صنف متوفر
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
                  <p className="text-[11px] text-slate-600">أدخل السعر والبونص والخصم يدوياً حسب فاتورة المورد.</p>
                </div>
              </div>
            </div>
          )}

          {catalogError && <ErrorAlert error={catalogError} />}

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800">بنود الطلبية</h4>
              <button type="button" onClick={addItemRow}
                disabled={isCatalogLoading || activeCatalogProducts.length === 0}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg disabled:opacity-40">
                <Plus className="w-3.5 h-3.5" /> إضافة صنف
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 min-w-[240px]">الصنف</th>
                    <th className="py-2.5 px-2 text-center w-20">كمية</th>
                    {!isNetworkSupplier && <th className="py-2.5 px-2 text-center w-20">بونص</th>}
                    <th className="py-2.5 px-2 text-center w-28">السعر</th>
                    {!isNetworkSupplier && <th className="py-2.5 px-2 text-center w-20">خصم %</th>}
                    {!isNetworkSupplier && <th className="py-2.5 px-2 text-center w-20">ضريبة %</th>}
                    <th className="py-2.5 px-2 text-center min-w-[120px]">تشغيلة</th>
                    <th className="py-2.5 px-2 text-center min-w-[120px]">الانتهاء</th>
                    <th className="py-2.5 px-3 text-left w-24">الإجمالي</th>
                    <th className="py-2.5 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => {
                    const gross = (Number(it.paid_quantity) || 0) * (Number(it.unit_price) || 0);
                    const disc = isNetworkSupplier ? 0 : gross * ((Number(it.discount_rate) || 0) / 100);
                    const net = Math.max(0, gross - disc);
                    const tax = isNetworkSupplier ? 0 : net * ((Number(it.tax_rate) || 0) / 100);
                    const lineTotal = net + tax;
                    const selectedProduct = activeCatalogProducts.find((p) => p.id === it.product_id);

                    return (
                      <tr key={it.uid} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select required value={it.product_id} onChange={(e) => handleProductChange(it.uid, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-emerald-500 font-medium">
                            {activeCatalogProducts.map((p) => {
                              const isNet = Boolean(p.is_network_product);
                              const priceNum = Number(p.wholesale_price ?? p.cost_price ?? 0);
                              return (
                                <option key={p.id} value={p.id}>
                                  {isNet ? '🏢 ' : '📦 '}{p.name} ({p.sku}) — {priceNum} {baseCurrency}
                                  {p.current_stock !== undefined ? ` • مخزون: ${p.current_stock}` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" required min="1" value={it.paid_quantity}
                            onChange={(e) => updateItemRow(it.uid, { paid_quantity: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono" />
                        </td>
                        {!isNetworkSupplier && (
                          <td className="p-2 text-center">
                            <input type="number" min="0" value={it.bonus_quantity}
                              onChange={(e) => updateItemRow(it.uid, { bonus_quantity: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono text-emerald-700 font-bold" />
                          </td>
                        )}
                        <td className="p-2 text-center">
                          <input type="number" step="0.01" min="0" required value={it.unit_price}
                            readOnly={isNetworkSupplier}
                            disabled={isNetworkSupplier}
                            onChange={(e) => updateItemRow(it.uid, { unit_price: Number(e.target.value) })}
                            className={`w-full rounded-lg border p-1.5 text-xs text-center font-mono font-bold ${
                              isNetworkSupplier ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 cursor-not-allowed' : 'border-slate-300 text-slate-900'
                            }`} />
                          {isNetworkSupplier && <span className="block text-[9px] text-emerald-600 mt-0.5">سعر المورد</span>}
                        </td>
                        {!isNetworkSupplier && (
                          <td className="p-2 text-center">
                            <input type="number" step="0.1" min="0" max="100" value={it.discount_rate}
                              onChange={(e) => updateItemRow(it.uid, { discount_rate: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono" />
                          </td>
                        )}
                        {!isNetworkSupplier && (
                          <td className="p-2 text-center">
                            <input type="number" step="0.1" min="0" max="100" value={it.tax_rate}
                              onChange={(e) => updateItemRow(it.uid, { tax_rate: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono" />
                          </td>
                        )}
                        <td className="p-2 text-center">
                          <input type="text" placeholder={isNetworkSupplier ? 'تلقائي' : 'اختياري'}
                            value={it.batch_number}
                            readOnly={isNetworkSupplier}
                            onChange={(e) => updateItemRow(it.uid, { batch_number: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono" />
                        </td>
                        <td className="p-2 text-center">
                          <input type="date" value={it.expiry_date}
                            min={toDateInput(new Date())}
                            readOnly={isNetworkSupplier}
                            onChange={(e) => updateItemRow(it.uid, { expiry_date: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center font-mono" />
                        </td>
                        <td className="p-2 text-left font-bold text-slate-900 font-mono">{lineTotal.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItemRow(it.uid)} className="text-slate-400 hover:text-rose-600">
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

          {/* Totals */}
          <div className="flex justify-end p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-72 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>المبلغ الصافي:</span><span className="font-mono font-bold text-slate-800">{subtotal.toFixed(2)} {baseCurrency}</span></div>
              <div className="flex justify-between"><span>الضرائب:</span><span className="font-mono">{taxTotal.toFixed(2)} {baseCurrency}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm text-slate-900">
                <span>الإجمالي:</span><span className="font-mono text-emerald-700">{grandTotal.toFixed(2)} {baseCurrency}</span>
              </div>
              {paymentType === 'partial' && (
                <div className="flex justify-between text-blue-700 font-bold">
                  <span>المدفوع:</span><span className="font-mono">{paidAmount.toFixed(2)} {baseCurrency}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={closeCreateModal} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">إلغاء</button>
            <button type="submit" disabled={formLoading || isCatalogLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50">
              {formLoading ? 'جاري الحفظ...' : 'حفظ أمر الشراء'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ Details Modal ============ */}
      {selectedOrder && (
        <Modal isOpen={isDetailsOpen} onClose={closeDetailsModal} title={`تفاصيل: PO#${selectedOrder.order_number}`} maxWidth="4xl">
          <div className="space-y-6">
            {detailsLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التحميل...
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">المورد</span>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-bold text-slate-900">{selectedOrder.supplier_name || 'مورد عام'}</span>
                  <SupplierKindBadge supplier={suppliers.find((s) => s.id === selectedOrder.supplier_id || s.name === selectedOrder.supplier_name)} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">التاريخ</span>
                <span className="font-mono font-semibold text-slate-800">{selectedOrder.order_date ? String(selectedOrder.order_date).slice(0, 10) : '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الإجمالي</span>
                <span className="font-mono font-black text-emerald-700">{Number(selectedOrder.total || 0).toLocaleString()} {baseCurrency}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الحالة</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Payment info */}
            {selectedOrder.payment_type && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-900">الدفع: {PAYMENT_TYPE_LABELS[selectedOrder.payment_type as PaymentType]}</span>
                  {selectedOrder.payment_method && (
                    <span className="text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {PAYMENT_METHOD_LABELS[selectedOrder.payment_method as PaymentMethod]}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-blue-800">
                  {selectedOrder.due_date && (
                    <div><span className="text-blue-600">الاستحقاق: </span><span className="font-mono font-bold">{String(selectedOrder.due_date).slice(0, 10)}</span></div>
                  )}
                  <div><span className="text-blue-600">المدفوع: </span><span className="font-mono font-bold">{Number(selectedOrder.paid_amount || 0).toFixed(2)} {baseCurrency}</span></div>
                  <div><span className="text-blue-600">المتبقي: </span><span className="font-mono font-bold">{Math.max(0, Number(selectedOrder.total) - Number(selectedOrder.paid_amount || 0)).toFixed(2)} {baseCurrency}</span></div>
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {selectedOrder.status === 'rejected' && selectedOrder.rejection_reason && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-rose-700" /><span className="font-bold text-rose-900">سبب الرفض</span></div>
                <p className="text-rose-800">{selectedOrder.rejection_reason}</p>
              </div>
            )}

            {/* Items */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">الصنف</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-center">البونص</th>
                    <th className="py-2.5 px-3 text-center">السعر</th>
                    <th className="py-2.5 px-3 text-center">الخصم</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.product_name || 'دواء'}{it.sku && <span className="text-slate-400 mr-1">({it.sku})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.paid_quantity ?? it.quantity}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">{it.bonus_quantity || 0}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{Number(it.unit_price).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{it.discount_rate ? `${it.discount_rate}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-left font-bold text-slate-900 font-mono">{Number(it.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPrintOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                  <Printer className="w-4 h-4" /> طباعة
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* draft */}
                {selectedOrder.status === 'draft' && (
                  <>
                    <button onClick={handleCancelOrder} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> إلغاء
                    </button>
                    <button onClick={handleConfirmOrder} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4" /> {actionLoading ? '...' : 'تأكيد واستلام'}
                    </button>
                  </>
                )}

                {/* pending_approval */}
                {selectedOrder.status === 'pending_approval' && (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="w-4 h-4" /> بانتظار موافقة المورد
                    </span>
                    <button onClick={handleCancelOrder} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> سحب الطلب
                    </button>
                  </>
                )}

                {/* approved */}
                {selectedOrder.status === 'approved' && (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> وافق المورد — جاهز للاستلام
                    </span>
                    <button onClick={handleConfirmOrder} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4" /> {actionLoading ? '...' : 'تأكيد واستلام المخزون'}
                    </button>
                  </>
                )}

                {/* confirmed */}
                {selectedOrder.status === 'confirmed' && (
                  <button onClick={() => { setInvoiceDueDate(toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))); setIsInvoiceModalOpen(true); }}
                    disabled={actionLoading} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50">
                    <FileText className="w-4 h-4" /> تحويل إلى فاتورة
                  </button>
                )}

                {/* cancelled */}
                {selectedOrder.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
                    <XCircle className="w-4 h-4" /> ملغاة
                  </span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Modal */}
      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="رمز QR للتسليم" maxWidth="md">
        {qrModalData && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white rounded-xl border-2 border-slate-200 inline-block">
              <img src={qrModalData.qr_data_url} alt="QR Code" className="w-64 h-64 mx-auto" />
            </div>
            {qrModalData.pin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] text-amber-800 mb-1">رمز PIN (للتأكيد العام):</p>
                <p className="text-3xl font-black font-mono text-amber-900 tracking-widest">{qrModalData.pin}</p>
              </div>
            )}
            <div className="text-xs text-slate-600">
              <p className="font-bold">ينتهي في: {new Date(qrModalData.expires_at).toLocaleString('ar-SA')}</p>
            </div>
            <button onClick={() => window.print()} className="w-full px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl">
              <Printer className="w-4 h-4 inline mr-1" /> طباعة
            </button>
          </div>
        )}
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="تحويل إلى فاتورة مشتريات">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">سيتم إنشاء فاتورة مشتريات رسمية وتسجيل الاستحقاق على المورد.</p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
            <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={handleCreateInvoice} disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50">
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