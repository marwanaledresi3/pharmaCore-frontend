// pages/purchaseOrders/hooks/useSupplierCatalog.ts
import { useEffect, useState } from 'react';
import { productsApi } from '../../../api/productsApi';
import { b2bApi } from '../../../api/b2bApi';
import { Supplier, Product } from '../../../types';
import { CatalogProduct, DraftItem } from '../types';
import { uid } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Args {
  isOpen: boolean;
  selectedSupplierId: string;
  suppliers: Supplier[];
  products: Product[];
  onCatalogLoaded: (catalog: CatalogProduct[]) => void;
  onItemsReset: (items: DraftItem[]) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يُنشئ DraftItem افتراضي لمنتج (الوحدة الأساسية).
 * ✅ يحتوي unit_id + conversion_factor.
 */
function buildDefaultDraftItem(product: CatalogProduct): DraftItem {
  return {
    uid: uid(),
    product_id: product.id,
    paid_quantity: 1,
    bonus_quantity: 0,
    unit_price: Number(product.wholesale_price ?? product.cost_price ?? 0),
    discount_rate: 0,
    discount_amount: 0,
    tax_rate: 0,
    batch_number: product.live_batch_number || '',
    expiry_date: product.live_expiry_date || '',
    unit_id: null,
    conversion_factor: 1,
  };
}

/**
 * يحوّل منتج من getCompanyStock (Product) إلى CatalogProduct
 * مع إضافة الحقول المطلوبة (wholesale_price, live_batch_number, etc.)
 */
function normalizeNetworkCatalogProduct(p: any): CatalogProduct {
  const batches = Array.isArray(p.batches) ? p.batches : [];
  const liveBatch =
    batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];

  const totalQty = Number(p.total_quantity ?? 0);
  const reservedQty = Number(p.reserved_quantity ?? 0);
  const availableQty = Number(
    p.available_quantity ?? totalQty - reservedQty
  );

  return {
    ...p,
    id: p.id ?? p.product_id,
    name: p.name ?? p.product_name,
    sku: p.sku ?? '',
    cost_price: Number(liveBatch?.cost_price ?? p.cost_price ?? 0),
    wholesale_price: Number(liveBatch?.cost_price ?? p.cost_price ?? 0),
    quantity: availableQty,
    total_quantity: totalQty,
    current_stock: availableQty,
    available_quantity: availableQty,
    reserved_quantity: reservedQty,
    is_network_product: true,
    live_batch_number: liveBatch?.batch_number ?? '',
    live_expiry_date: liveBatch?.expiry_date ?? '',
    units: Array.isArray(p.units) ? p.units : [],
  } as CatalogProduct;
}

/**
 * يحوّل منتج محلي (Product من getAllStock أو list) إلى CatalogProduct.
 * للمحلي: wholesale_price = cost_price (سعر الشراء).
 */
function normalizeLocalCatalogProduct(p: Product | any): CatalogProduct {
  return {
    ...p,
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    cost_price: Number(p.cost_price ?? 0),
    wholesale_price: Number(p.cost_price ?? 0),
    is_network_product: false,
    live_batch_number: '',
    live_expiry_date: '',
    units: Array.isArray(p.units) ? p.units : [],
  } as CatalogProduct;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useSupplierCatalog({
  isOpen,
  selectedSupplierId,
  suppliers,
  products,
  onCatalogLoaded,
  onItemsReset,
}: Args) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ─── 1) لا يوجد فتح أو مورد → تفريغ ──────────────────────────────
    if (!isOpen || !selectedSupplierId) {
      onCatalogLoaded([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) {
      onCatalogLoaded([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    onCatalogLoaded([]);

    const load = async () => {
      try {
        const network = b2bApi.isNetworkSupplier(supplier);
        let catalog: CatalogProduct[] = [];

        if (network.isNetwork && network.companyId) {
          // ═══ الشبكة: جلب منتجات المورد من B2B ═════════════════════
          // ✅ FIX #1: b2bApi.getCompanyStock بدلاً من productsApi.getStock
          const stockProducts = await b2bApi.getCompanyStock(network.companyId);

          catalog = stockProducts
            .filter((p: any) => {
              const available = Number(
                p.available_quantity ?? p.total_quantity ?? 0
              );
              return available > 0;
            })
            .map(normalizeNetworkCatalogProduct);
        } else {
          // ═══ المحلي: استخدام products (من useReferences) ══════════
          // products من useReferences = productsApi.list().items
          // ✅ يحتوي units (بعد إصلاح Product.list)
          catalog = products.map(normalizeLocalCatalogProduct);
        }

        if (cancelled) return;

        onCatalogLoaded(catalog);

        // ─── اختيار أول منتج افتراضياً ────────────────────────────
        const first = catalog[0];
        if (first) {
          // ✅ FIX #2: buildDefaultDraftItem يحتوي unit_id + conversion_factor
          onItemsReset([buildDefaultDraftItem(first)]);
        } else {
          onItemsReset([]);
        }
      } catch (err: any) {
        if (cancelled) return;
        onCatalogLoaded([]);
        onItemsReset([]);
        setError(err?.message || 'تعذر جلب منتجات المورد المحدد');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // ✅ FIX #5: suppliers, products مضمّنة في dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, isOpen, suppliers, products]);

  return { isLoading, error };
}