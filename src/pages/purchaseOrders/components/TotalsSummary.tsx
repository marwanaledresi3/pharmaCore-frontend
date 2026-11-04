import React from 'react';
import { PaymentType } from '../../../api/ordersApi';

interface Props {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  paymentType: PaymentType;
  baseCurrency: string;
}

export const TotalsSummary: React.FC<Props> = ({
  subtotal,
  taxTotal,
  grandTotal,
  paidAmount,
  paymentType,
  baseCurrency,
}) => {
  return (
    <div className="flex justify-end p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="w-72 space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>المبلغ الصافي:</span>
          <span className="font-mono font-bold text-slate-800">
            {subtotal.toFixed(2)} {baseCurrency}
          </span>
        </div>
        <div className="flex justify-between">
          <span>الضرائب:</span>
          <span className="font-mono">
            {taxTotal.toFixed(2)} {baseCurrency}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm text-slate-900">
          <span>الإجمالي:</span>
          <span className="font-mono text-emerald-700">
            {grandTotal.toFixed(2)} {baseCurrency}
          </span>
        </div>
        {paymentType === 'partial' && (
          <div className="flex justify-between text-blue-700 font-bold">
            <span>المدفوع:</span>
            <span className="font-mono">
              {paidAmount.toFixed(2)} {baseCurrency}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};