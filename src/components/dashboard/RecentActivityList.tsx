import type { ActivityItem } from '../../api/dashboardApi';

const LABELS: Record<string, string> = {
  insert: 'أضاف',
  update: 'عدّل',
  delete: 'حذف',
};

const TABLES: Record<string, string> = {
  invoices: 'فاتورة',
  purchase_orders: 'أمر شراء',
  products: 'منتج',
  customers: 'عميل',
  suppliers: 'مورّد',
  payments: 'دفعة',
  users: 'مستخدم',
  branches: 'فرع',
  journal_entries: 'قيد يومية',
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function RecentActivityList({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return <p className="text-sm text-gray-500 py-6 text-center">لا يوجد نشاط حديث</p>;
  }
  return (
    <ul className="divide-y">
      {items.map((a) => (
        <li key={a.id} className="py-2 flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0">
            <span className="font-medium">{a.user_name || 'النظام'}</span>{' '}
            <span className="text-gray-600">{LABELS[a.action] ?? a.action}</span>{' '}
            <span className="text-gray-900">{TABLES[a.table_name] ?? a.table_name}</span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(a.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}