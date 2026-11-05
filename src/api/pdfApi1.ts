import { openPdf, downloadPdf } from './pdfHelpers';

const PATHS = {
  invoice: (id: string) => `/api/v1/pdf/invoices/${id}`,
  payment: (id: string) => `/api/v1/pdf/payments/${id}`,
  expense: (id: string) => `/api/v1/pdf/expenses/${id}`,              // ← تأكد من الـ backend
  purchaseOrder: (id: string) => `/api/v1/pdf/purchase-orders/${id}`,
  salesOrder: (id: string) => `/api/v1/pdf/sales-orders/${id}`,
  return: (id: string) => `/api/v1/pdf/returns/${id}`,
  deliveryNote: (id: string) => `/api/v1/pdf/delivery-notes/${id}`,
  statement: (type: 'customer' | 'supplier', id: string) =>
    `/api/v1/pdf/statements/${type}/${id}`,
  trialBalance: () => `/api/v1/pdf/reports/trial-balance`,
  salesReport: () => `/api/v1/pdf/reports/sales`,                    // ← بلا شرطة نهاية
};

export const pdfApi = {
  // ==================== معاينة ====================
  previewInvoice:         (id: string) => openPdf(PATHS.invoice(id)),
  previewPayment:         (id: string) => openPdf(PATHS.payment(id)),
  previewExpense:         (id: string) => openPdf(PATHS.expense(id)),
  previewPurchaseOrder:   (id: string) => openPdf(PATHS.purchaseOrder(id)),
  previewSalesOrder:      (id: string) => openPdf(PATHS.salesOrder(id)),
  previewReturn:          (id: string) => openPdf(PATHS.return(id)),
  previewDeliveryNote:    (id: string) => openPdf(PATHS.deliveryNote(id)),

  previewStatement: (
    type: 'customer' | 'supplier',
    id: string,
    params?: { date_from?: string; date_to?: string }
  ) => openPdf(PATHS.statement(type, id), params),

  previewTrialBalance: (params?: { date_from?: string; date_to?: string }) =>
    openPdf(PATHS.trialBalance(), params),

  // ==================== تحميل ====================
  downloadInvoicePdf: (id: string, number?: string) =>
    downloadPdf(PATHS.invoice(id), `invoice-${number || id.slice(0, 8)}`),

  downloadPaymentPdf: (id: string, reference?: string) =>
    downloadPdf(PATHS.payment(id), `payment-${reference || id.slice(0, 8)}`),

  downloadExpensePdf: (id: string, number?: string) =>
    downloadPdf(PATHS.expense(id), `expense-${number || id.slice(0, 8)}`),

  downloadPurchaseOrderPdf: (id: string, orderNumber?: string) =>
    downloadPdf(PATHS.purchaseOrder(id), `po-${orderNumber || id.slice(0, 8)}`),

  downloadSalesOrderPdf: (id: string, orderNumber?: string) =>
    downloadPdf(PATHS.salesOrder(id), `so-${orderNumber || id.slice(0, 8)}`),

  downloadReturnPdf: (id: string, returnNumber?: string) =>
    downloadPdf(PATHS.return(id), `return-${returnNumber || id.slice(0, 8)}`),

  downloadDeliveryNotePdf: (id: string, orderNumber?: string) =>
    downloadPdf(PATHS.deliveryNote(id), `delivery-${orderNumber || id.slice(0, 8)}`),

  downloadStatementPdf: (
    type: 'customer' | 'supplier',
    id: string,
    partyName?: string,
    params?: { date_from?: string; date_to?: string }
  ) =>
    downloadPdf(
      PATHS.statement(type, id),
      `statement-${partyName || id.slice(0, 8)}`,
      params
    ),

  downloadSalesReportPdf: (params?: {
    date_from?: string;
    date_to?: string;
    group_by?: string;
  }) => downloadPdf(PATHS.salesReport(), 'sales-report', params),

  downloadTrialBalancePdf: (params?: { date_from?: string; date_to?: string }) =>
    downloadPdf(PATHS.trialBalance(), 'trial-balance', params),
};