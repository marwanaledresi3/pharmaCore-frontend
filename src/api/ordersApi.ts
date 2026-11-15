// api/ordersApi.ts
//
// ⚠️ هذه واجهة توافق خلفي (facade). استخدم الملفات المخصصة:
//    - purchaseOrdersApi (من './purchaseOrdersApi')
//    - salesOrdersApi (من './salesOrdersApi')
//
// هذا الملف يُبقي الكود القديم يعمل بدون تغيير:
//    import { ordersApi } from '../api/ordersApi';
//    ordersApi.listPurchaseOrders(...) // ← لا يزال يعمل
//

import { purchaseOrdersApi } from './purchaseOrdersApi';
import { salesOrdersApi } from './salesOrdersApi';

// إعادة تصدير الأنواع
export type {
  PurchaseOrderStatus,
  SalesOrderStatus,
  PaymentType,
  PaymentMethod,
  QRMode,
  CreatePurchaseOrderPayload,
  CreatePurchaseOrderItemPayload,
  ItemAdjustmentPayload,
  ApprovePurchaseOrderPayload,
  ApprovePurchaseOrderResult,
  ConfirmPurchaseOrderResult,
  DeliveryTokenPreview,
  CreateSalesOrderPayload,
  CreateSalesOrderItemPayload,
  ListPurchaseOrdersParams,
  ListIncomingPurchaseOrdersParams,
  ListSalesOrdersParams,
} from './ordersApi.types';

// إعادة تصدير APIs
export { purchaseOrdersApi } from './purchaseOrdersApi';
export { salesOrdersApi } from './salesOrdersApi';

// ═══════════════════════════════════════════════════════════════════════════
// ordersApi — facade للتوافق الخلفي
// ═══════════════════════════════════════════════════════════════════════════

export const ordersApi = {
  // ══════════════════════════════════════════════════════════════
  // Purchase Orders (Buyer Side)
  // ══════════════════════════════════════════════════════════════

  listPurchaseOrders: purchaseOrdersApi.list,
  getPurchaseOrder: purchaseOrdersApi.getOne,
  createPurchaseOrder: purchaseOrdersApi.create,
  confirmPurchaseOrder: purchaseOrdersApi.confirm,
  cancelPurchaseOrder: purchaseOrdersApi.cancel,

  // ══════════════════════════════════════════════════════════════
  // Incoming Purchase Orders (Supplier Side)
  // ══════════════════════════════════════════════════════════════

  getIncomingPurchaseOrders: purchaseOrdersApi.listIncoming,
  approveIncomingPurchaseOrder: purchaseOrdersApi.approve,
  rejectIncomingPurchaseOrder: purchaseOrdersApi.reject,

  // ══════════════════════════════════════════════════════════════
  // QR Delivery
  // ══════════════════════════════════════════════════════════════

  previewDeliveryToken: purchaseOrdersApi.previewDeliveryToken,
  confirmPurchaseOrderByToken: purchaseOrdersApi.confirmByToken,

  // ══════════════════════════════════════════════════════════════
  // Sales Orders
  // ══════════════════════════════════════════════════════════════

  listSalesOrders: salesOrdersApi.list,
  getSalesOrder: salesOrdersApi.getOne,
  createSalesOrder: salesOrdersApi.create,
  confirmSalesOrder: salesOrdersApi.confirm,
  cancelSalesOrder: salesOrdersApi.cancel,
};