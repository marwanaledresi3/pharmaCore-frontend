import { pdf } from '@react-pdf/renderer';
import { InvoicePdf } from '../components/pdf/InvoicePdf';
import { Invoice } from '../types';

export async function downloadInvoicePdf(
  invoice: Invoice,
  company: any,
  opts?: { download?: boolean; filename?: string }
) {
  const doc = <InvoicePdf
    company={company}
    docType={invoice.invoice_type === 'sales' ? 'sale_invoice' : 'purchase_invoice'}
    docNumber={invoice.invoice_number}
    docDate={String(invoice.invoice_date).slice(0, 10)}
    partyTitle={invoice.invoice_type === 'sales' ? 'العميل' : 'المورد'}
    party={{
      name: (invoice as any).party_name || '—',
      phone: (invoice as any).party_phone,
      email: (invoice as any).party_email,
      tax_number: (invoice as any).party_tax_number,
      address: (invoice as any).party_address,
    }}
    items={((invoice as any).items || []).map((it: any) => ({
      name: it.product_name || 'صنف',
      sku: it.sku,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      tax: it.tax_rate ? `${it.tax_rate}%` : '—',
      total: Number(it.line_total),
    }))}
    summary={[
      { label: 'المجموع الفرعي', value: Number(invoice.total) - Number(invoice.paid_amount || 0) },
      { label: 'المدفوع', value: Number(invoice.paid_amount || 0) },
      { label: 'الإجمالي', value: Number(invoice.total), isTotal: true },
    ]}
    amountInWords={undefined} // يمكن إضافة numToArabicWords
    currencyCode={invoice.currency_code || 'YER'}
    extraInfo={{
      'حالة السداد': invoice.status,
      'تاريخ الاستحقاق': invoice.due_date ? String(invoice.due_date).slice(0, 10) : '',
    }}
  />;

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);

  if (opts?.download === false) {
    window.open(url, '_blank');
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = opts?.filename || `invoice-${invoice.invoice_number}.pdf`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}