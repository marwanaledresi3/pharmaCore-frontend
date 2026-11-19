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

  // ═══ 🆕 جديد ═══
  note: (id: string) => `/api/v1/pdf/notes/${id}`,
  goodsReceipt: (id: string) => `/api/v1/pdf/goods-receipts/${id}`,
  stockTransfer: (id: string) => `/api/v1/pdf/stock-transfers/${id}`,
  stockAdjustment: (id: string) => `/api/v1/pdf/stock-adjustments/${id}`,

   payslip: (itemId: string) => `/api/v1/pdf/payslips/${itemId}`,
  payrollReport: (runId: string, includeDetails = false) =>
    `/api/v1/pdf/payroll/${runId}${includeDetails ? '?includeDetails=true' : ''}`,
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
   // 🆕 جديد
  previewNote:           (id: string) => openPdf(PATHS.note(id)),
  previewGoodsReceipt:   (id: string) => openPdf(PATHS.goodsReceipt(id)),
  previewStockTransfer:  (id: string) => openPdf(PATHS.stockTransfer(id)),
  previewStockAdjustment:(id: string) => openPdf(PATHS.stockAdjustment(id)),

  previewStatement: (
    type: 'customer' | 'supplier',
    id: string,
    params?: { date_from?: string; date_to?: string }
  ) => openPdf(PATHS.statement(type, id), params),

  previewTrialBalance: (params?: { date_from?: string; date_to?: string }) =>
    openPdf(PATHS.trialBalance(), params),

   previewPayslip: (itemId: string) => openPdf(PATHS.payslip(itemId)),

  previewPayrollReport: (runId: string, includeDetails = false) =>
    openPdf(PATHS.payrollReport(runId, includeDetails)),

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

  // ═══════════════════════════════════════════════════════════════
  // 🆕 جديد — تحميل
  // ═══════════════════════════════════════════════════════════════

  downloadNotePdf: (id: string, noteNumber?: string) =>
    downloadPdf(PATHS.note(id), `note-${noteNumber || id.slice(0, 8)}`),

  downloadGoodsReceiptPdf: (id: string, receiptNumber?: string) =>
    downloadPdf(PATHS.goodsReceipt(id), `goods-receipt-${receiptNumber || id.slice(0, 8)}`),

  downloadStockTransferPdf: (id: string, transferNumber?: string) =>
    downloadPdf(PATHS.stockTransfer(id), `stock-transfer-${transferNumber || id.slice(0, 8)}`),

  downloadStockAdjustmentPdf: (id: string, adjustmentNumber?: string) =>
    downloadPdf(PATHS.stockAdjustment(id), `stock-adjustment-${adjustmentNumber || id.slice(0, 8)}`),

  downloadPayslipPdf: (itemId: string, identifier?: string) =>
    downloadPdf(PATHS.payslip(itemId), `payslip-${identifier || itemId.slice(0, 8)}`),

  downloadPayrollReportPdf: (
    runId: string,
    runNumber?: string,
    includeDetails = false
  ) =>
    downloadPdf(
      PATHS.payrollReport(runId, includeDetails),
      `payroll-${runNumber || runId.slice(0, 8)}${includeDetails ? '-details' : ''}`
    ),

};