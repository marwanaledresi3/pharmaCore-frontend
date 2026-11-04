import React from 'react';
import { FileText } from 'lucide-react';

interface Props {
  invoiceNumber: string;
  invoiceDate: string;
  onChange: (patch: { invoiceNumber?: string; invoiceDate?: string }) => void;
}

export const SupplierInvoiceFields: React.FC<Props> = ({
  invoiceNumber,
  invoiceDate,
  onChange,
}) => {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-slate-700" />
        <h4 className="text-xs font-black text-slate-800">
          بيانات فاتورة المورد الورقية (اختياري)
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => onChange({ invoiceNumber: e.target.value })}
            placeholder="INV-2026-12345"
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => onChange({ invoiceDate: e.target.value })}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
};