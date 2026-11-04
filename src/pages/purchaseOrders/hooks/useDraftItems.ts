import { useState } from 'react';
import { DraftItem, CatalogProduct } from '../types';
import { uid } from '../utils';

export function useDraftItems() {
  const [items, setItems] = useState<DraftItem[]>([]);

  const addItemRow = (catalog: CatalogProduct[], onError: (msg: string) => void) => {
    const first = catalog[0];
    if (!first) {
      onError('لا توجد منتجات متاحة لهذا المورد');
      return;
    }
    setItems((prev) => [
      ...prev,
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
    ]);
  };

  const removeItemRow = (uidToRemove: string) => {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((it) => it.uid !== uidToRemove)
    );
  };

  const updateItemRow = (uidToUpdate: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid !== uidToUpdate ? it : { ...it, ...patch }))
    );
  };

  const handleProductChange = (uidToUpdate: string, newProductId: string, catalog: CatalogProduct[]) => {
    const prod = catalog.find((p) => p.id === newProductId);
    const patch: Partial<DraftItem> = { product_id: newProductId };
    if (prod) {
      patch.unit_price = Number(prod.wholesale_price ?? prod.cost_price ?? 0);
      patch.batch_number = prod.live_batch_number || '';
      patch.expiry_date = prod.live_expiry_date || '';
    }
    updateItemRow(uidToUpdate, patch);
  };

  return {
    items,
    setItems,
    addItemRow,
    removeItemRow,
    updateItemRow,
    handleProductChange,
  };
}