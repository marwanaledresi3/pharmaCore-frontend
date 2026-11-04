import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Company } from '../../types';

interface PrintDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: string;
  documentNumber: string | number;
  documentDate: string;
  partyTitle?: string;
  partyName?: string;
  partyInfo?: string;
  currencyCode?: string;
  company?: Company | null;
  items?: Array<{
    name: string;
    sku?: string;
    quantity: number;
    paid_quantity?: number;
    bonus_quantity?: number;
    unit_price: number;
    discount?: number | string;
    tax?: number | string;
    total: number;
  }>;
  summary: Array<{ label: string; value: string | number; isTotal?: boolean }>;
  notes?: string;
  onBackendPdf?: () => void;
  hasBackendPdf?: boolean;
}

export const PrintPreviewModal: React.FC<PrintDocumentProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  documentNumber,
  documentDate,
  partyTitle = 'الطرف',
  partyName,
  partyInfo,
  currencyCode = 'YER',
  company,
  items = [],
  summary = [],
  notes,
  onBackendPdf,
  hasBackendPdf = false,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:inset-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 print:p-0">
        {/* Backdrop hidden on print */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
          onClick={onClose}
        />

        <div
          dir="rtl"
          className="relative transform overflow-hidden rounded-2xl bg-white text-right shadow-2xl transition-all sm:my-8 w-full max-w-4xl border border-slate-200 print:border-none print:shadow-none print:my-0 print:max-w-none print:rounded-none"
        >
          {/* Top toolbar - hidden on print */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 print:hidden">
            <h3 className="text-base font-bold text-slate-800">
              معاينة الطباعة: {title} #{documentNumber}
            </h3>
            <div className="flex items-center gap-2">
              {hasBackendPdf && onBackendPdf && (
                <button
                  type="button"
                  onClick={onBackendPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  تحميل PDF رسمي
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                طباعة المستند
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable document page */}
          <div
            ref={printAreaRef}
            className="p-8 sm:p-12 text-slate-800 bg-white min-h-[600px] print:p-0 print:text-black"
          >
            {/* Header: Company branding and doc metadata */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  {company?.name || 'PharmaCore ERP'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {company?.address || 'مركز إدارة الأدوية والمستلزمات الطبية'}
                </p>
                {company?.tax_number && (
                  <p className="text-xs text-slate-500">الرقم الضريبي: {company.tax_number}</p>
                )}
                {company?.phone && <p className="text-xs text-slate-500">الهاتف: {company.phone}</p>}
              </div>

              <div className="text-left" dir="ltr">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded font-black text-sm uppercase mb-2">
                  {documentType}
                </span>
                <p className="text-xs text-slate-600 font-mono">
                  No: <span className="font-bold text-slate-900">#{documentNumber}</span>
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  Date: <span className="font-semibold">{documentDate}</span>
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  Currency: <span className="font-bold">{currencyCode}</span>
                </p>
              </div>
            </div>

            {/* Bill to / Party information */}
            {partyName && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {partyTitle}:
                </span>
                <h4 className="text-base font-bold text-slate-900">{partyName}</h4>
                {partyInfo && <p className="text-xs text-slate-600 mt-0.5">{partyInfo}</p>}
              </div>
            )}

            {/* Items Table */}
            {items.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100 font-bold text-slate-700">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">الصنف / الدواء</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                      <th className="py-2.5 px-3 text-center">خصم / ضريبة</th>
                      <th className="py-2.5 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {it.name}
                          {it.sku && <span className="text-slate-400 font-normal mr-2">({it.sku})</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold">{it.quantity}</span>
                          {it.bonus_quantity ? (
                            <span className="text-[10px] text-emerald-600 block">
                              +{it.bonus_quantity} مجاني
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {Number(it.unit_price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                          {it.discount ? `خصم: ${it.discount}` : it.tax ? `ضريبة: ${it.tax}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-left font-bold text-slate-900 font-mono">
                          {Number(it.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary & Totals */}
            <div className="flex justify-between items-start gap-8 pt-4 border-t border-slate-200">
              <div className="max-w-md">
                {notes && (
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-amber-800">
                    <span className="font-bold block mb-1">ملاحظات:</span>
                    {notes}
                  </div>
                )}
                <div className="mt-8 text-xs text-slate-400">
                  <p>تم استخراج هذا المستند إلكترونياً عبر نظام PharmaCore ERP.</p>
                </div>
              </div>

              <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  {summary.map((s, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between text-xs ${
                        s.isTotal
                          ? 'border-t-2 border-slate-800 pt-2 text-sm font-black text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      <span>{s.label}:</span>
                      <span className="font-mono">
                        {typeof s.value === 'number' ? s.value.toFixed(2) : s.value}{' '}
                        <span className="text-[10px]">{currencyCode}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signatures on print */}
            <div className="hidden print:flex justify-between items-end mt-20 pt-8 border-t border-slate-300 text-xs text-slate-600">
              <div className="text-center w-40">
                <div className="border-b border-slate-400 mb-2 h-12" />
                <span>توقيع المستلم</span>
              </div>
              <div className="text-center w-40">
                <div className="border-b border-slate-400 mb-2 h-12" />
                <span>توقيع المدير المالي / المسؤول</span>
              </div>
              <div className="text-center w-40">
                <div className="border-b border-slate-400 mb-2 h-12" />
                <span>ختم المنشأة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Utility to export any array of records to a CSV file (compatible with Excel)
 */
export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',')
  );

  // Add BOM for proper Arabic text in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
