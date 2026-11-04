import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../../../api/ordersApi';
import { PurchaseOrder, Pagination as PaginationType } from '../../../types';
import { StatusFilterValue } from '../constants';

export function useOrdersList(statusFilter: StatusFilterValue) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 15,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const statusParam = statusFilter === 'all' ? undefined : statusFilter;
        const res = await ordersApi.listPurchaseOrders({ status: statusParam, page, limit: 15 });
        setOrders(res.items);
        setPagination(res.pagination);
      } catch (err: any) {
        setError(err?.message || 'فشل تحميل أوامر الشراء');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return { orders, pagination, isLoading, error, reload: load };
}