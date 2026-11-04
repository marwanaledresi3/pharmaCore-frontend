export const uid = () =>
  `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export const normalize = (s: unknown) => String(s ?? '').trim().toLowerCase();

/**
 * يحسب صف بند واحد.
 * - النسبة تفوز إذا > 0
 * - وإلا المبلغ (مع سقف عند الإجمالي)
 */
export function computeItemLine(opts: {
  paidQuantity: number;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  isNetwork: boolean;
}): { gross: number; disc: number; net: number; tax: number; total: number } {
  const gross = (Number(opts.paidQuantity) || 0) * (Number(opts.unitPrice) || 0);

  let disc = 0;
  if (!opts.isNetwork) {
    const dr = Number(opts.discountRate) || 0;
    const da = Number(opts.discountAmount) || 0;
    if (dr > 0) disc = gross * (dr / 100);
    else if (da > 0) disc = Math.min(da, gross);
  }

  const net = Math.max(0, gross - disc);
  const taxRate = opts.isNetwork ? 0 : (Number(opts.taxRate) || 0);
  const tax = net * (taxRate / 100);

  return { gross, disc, net, tax, total: net + tax };
}