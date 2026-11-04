import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  secondary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  className = '',
}) => {
  if (status && !children) {
    return <StatusBadge status={status} />;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'paid':
    case 'confirmed':
    case 'posted':
    case 'accepted':
    case 'active':
      return <Badge variant="success">{getStatusLabel(status)}</Badge>;
    case 'partial':
    case 'pending':
    case 'draft':
      return <Badge variant="warning">{getStatusLabel(status)}</Badge>;
    case 'unpaid':
    case 'cancelled':
    case 'rejected':
    case 'blocked':
    case 'inactive':
      return <Badge variant="danger">{getStatusLabel(status)}</Badge>;
    case 'invoiced':
      return <Badge variant="info">{getStatusLabel(status)}</Badge>;
    default:
      return <Badge variant="default">{getStatusLabel(status)}</Badge>;
  }
};

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'مسودة',
    confirmed: 'مؤكد',
    invoiced: 'مفوتر',
    cancelled: 'ملغي',
    posted: 'مرحّل',
    unpaid: 'غير مدفوع',
    partial: 'مدفوع جزئياً',
    paid: 'مدفوع بالكامل',
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    blocked: 'محظور',
    active: 'نشط',
    inactive: 'معطل',
    sale: 'مبيعات',
    purchase: 'مشتريات',
    receive: 'سند قبض',
    pay: 'سند صرف',
  };
  return map[status] || status;
}
