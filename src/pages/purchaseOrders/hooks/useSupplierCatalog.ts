import { useEffect, useState } from 'react';
import { productsApi } from '../../../api/productsApi';
import { b2bApi } from '../../../api/b2bApi';
import { Supplier, Product } from '../../../types';
import { CatalogProduct, DraftItem } from '../types';
import { uid } from '../utils';

interface Args {
  isOpen: boolean;
  selectedSupplierId: string;
  suppliers: Supplier[];
  products: Product[];
  onCatalogLoaded: (catalog: CatalogProduct[]) => void;
  onItemsReset: (items: DraftItem[]) => void;
}

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
          const stockProducts = (await productsApi.getStock(network.companyId)) as any[];

          catalog = stockProducts
            .filter((p) => Number(p.available_quantity ?? p.total_quantity ?? 0) > 0)
            .map((p) => {
              const batches = Array.isArray(p.batches) ? p.batches : [];
              const liveBatch = batches.find((b: any) => Number(b.quantity) > 0) ?? batches[0];
              const available = Number(p.available_quantity ?? p.total_quantity ?? 0);
              return {
                ...p,
                id: p.id ?? p.product_id,
                name: p.name ?? p.product_name,
                sku: p.sku ?? '',
                cost_price: Number(liveBatch?.cost_price ?? p.cost_price ?? 0),
                wholesale_price: Number(liveBatch?.cost_price ?? p.cost_price ?? 0),
                quantity: available,
                total_quantity: Number(p.total_quantity ?? 0),
                current_stock: available,
                available_quantity: available,
                reserved_quantity: Number(p.reserved_quantity ?? 0),
                is_network_product: true,
                live_batch_number: liveBatch?.batch_number ?? '',
                live_expiry_date: liveBatch?.expiry_date ?? '',
              } as CatalogProduct;
            });
        } else {
          catalog = products as CatalogProduct[];
        }

        if (cancelled) return;

        onCatalogLoaded(catalog);

        const first = catalog[0];
        onItemsReset(
          first
            ? [
                {
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
                },
              ]
            : []
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, isOpen]);

  return { isLoading, error };
}