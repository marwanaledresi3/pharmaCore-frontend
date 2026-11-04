import { PaymentMethod, PaymentType } from '../../api/ordersApi';

export const STATUS_FILTERS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'draft', label: 'المسودات (Draft)' },
  { value: 'pending_approval', label: 'بانتظار موافقة المورد (Pending)' },
  { value: 'approved', label: 'موافَق عليها من المورد (Approved)' },
  { value: 'rejected', label: 'مرفوضة من المورد (Rejected)' },
  { value: 'confirmed', label: 'مؤكدة ومستلمة (Confirmed)' },
  { value: 'cancelled', label: 'ملغاة (Cancelled)' },
] as const;

export type StatusFilterValue = (typeof STATUS_FILTERS)[number]['value'];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: 'نقد',
  credit: 'آجل',
  partial: 'جزئي',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقد',
  bank: 'تحويل بنكي',
  cheque: 'شيك',
  card: 'بطاقة',
  wallet: 'محفظة',
  other: 'أخرى',
};