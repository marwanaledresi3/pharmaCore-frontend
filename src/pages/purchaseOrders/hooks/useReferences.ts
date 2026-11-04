import { useCallback, useEffect, useState } from 'react';
import { suppliersApi } from '../../../api/suppliersApi';
import { productsApi } from '../../../api/productsApi';
import { companyApi } from '../../../api/companyApi';
import { Supplier, Product, Currency } from '../../../types';
import { RefsStatus } from '../types';

export function useReferences() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [status, setStatus] = useState<RefsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    const [supRes, prodRes, curRes] = await Promise.allSettled([
      suppliersApi.list({ is_active: true, limit: 100 }),
      productsApi.list({ is_active: true, limit: 100 }),
      companyApi.listCurrencies(),
    ]);

    const errors: string[] = [];

    if (supRes.status === 'fulfilled') {
      const v: unknown = supRes.value;
      let items: Supplier[] = [];
      if (Array.isArray(v)) items = v as Supplier[];
      else if (v && typeof v === 'object' && 'items' in v && Array.isArray((v as any).items)) {
        items = (v as any).items as Supplier[];
      }
      setSuppliers(items);
    } else {
      errors.push(`الموردون: ${(supRes.reason as any)?.message || 'خطأ'}`);
    }

    if (prodRes.status === 'fulfilled') {
      const v: unknown = prodRes.value;
      let items: Product[] = [];
      if (Array.isArray(v)) items = v as Product[];
      else if (v && typeof v === 'object' && 'items' in v && Array.isArray((v as any).items)) {
        items = (v as any).items as Product[];
      }
      setProducts(items);
    } else {
      errors.push(`المنتجات: ${(prodRes.reason as any)?.message || 'خطأ'}`);
    }

    if (curRes.status === 'fulfilled') {
      const v: unknown = curRes.value;
      let items: Currency[] = [];
      if (Array.isArray(v)) items = v as Currency[];
      else if (v && typeof v === 'object' && 'items' in v && Array.isArray((v as any).items)) {
        items = (v as any).items as Currency[];
      }
      setCurrencies(items);
    } else {
      errors.push(`العملات: ${(curRes.reason as any)?.message || 'خطأ'}`);
    }

    if (errors.length > 0) {
      setError(errors.join(' | '));
      setStatus('error');
    } else {
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    suppliers,
    products,
    currencies,
    status,
    error,
    reload: load,
    setProducts,
  };
}