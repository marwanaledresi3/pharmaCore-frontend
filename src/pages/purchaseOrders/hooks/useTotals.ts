import { useMemo } from 'react';
import { DraftItem } from '../types';
import { computeItemLine } from '../utils';

export function useTotals(items: DraftItem[], isNetwork: boolean) {
  return useMemo(() => {
    let sub = 0;
    let taxSum = 0;

    for (const it of items) {
      const line = computeItemLine({
        paidQuantity: it.paid_quantity,
        unitPrice: it.unit_price,
        discountRate: it.discount_rate,
        discountAmount: it.discount_amount,
        taxRate: it.tax_rate,
        isNetwork,
      });
      sub += line.net;
      taxSum += line.tax;
    }

    return {
      subtotal: sub,
      taxTotal: taxSum,
      grandTotal: sub + taxSum,
    };
  }, [items, isNetwork]);
}