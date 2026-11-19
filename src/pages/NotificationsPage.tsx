// pages/NotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Trash2, Filter, RefreshCw,
  ShoppingBag, FileText, CreditCard, AlertCircle,
  Calendar, CheckCircle2, XCircle, Ban, Wallet,
  Banknote, UserPlus, AlertTriangle, Building2,
  Package, ArrowLeftRight, ClipboardCheck, Truck,
} from 'lucide-react';
import { notificationsApi } from '../api/notificationsApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════
// أنواع الإشعارات — كل نوع له أيقونة + لون + تصنيف
// ═══════════════════════════════════════════════════════════════
type NotificationCategory = 'all' | 'hr' | 'b2b' | 'finance' | 'inventory';

interface NotificationTypeConfig {
  icon: React.ReactNode;
  color: string;
  category: NotificationCategory;
  label: string;
}

const NOTIFICATION_CONFIG: Record<string, NotificationTypeConfig> = {
  // ─── B2B ──────────────────────────────────────────────
  purchase_order_incoming: {
    icon: <ShoppingBag className="w-4 h-4" />,
    color: 'bg-blue-50 text-blue-700',
    category: 'b2b',
    label: 'طلب شراء وارد',
  },
  purchase_order_approved: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-emerald-50 text-emerald-700',
    category: 'b2b',
    label: 'اعتماد طلب',
  },
  purchase_order_rejected: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-rose-50 text-rose-700',
    category: 'b2b',
    label: 'رفض طلب',
  },
  purchase_order_confirmed: {
    icon: <Package className="w-4 h-4" />,
    color: 'bg-emerald-50 text-emerald-700',
    category: 'b2b',
    label: 'تأكيد استلام',
  },
  purchase_order_cancelled: {
    icon: <Ban className="w-4 h-4" />,
    color: 'bg-slate-100 text-slate-600',
    category: 'b2b',
    label: 'إلغاء طلب',
  },

  // ─── HR — Leaves ──────────────────────────────────────
  'hr.leave_request': {
    icon: <Calendar className="w-4 h-4" />,
    color: 'bg-blue-50 text-blue-700',
    category: 'hr',
    label: 'طلب إجازة جديد',
  },
  'hr.leave_approved': {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-emerald-50 text-emerald-700',
    category: 'hr',
    label: 'اعتماد إجازة',
  },
  'hr.leave_rejected': {
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-rose-50 text-rose-700',
    category: 'hr',
    label: 'رفض إجازة',
  },
  'hr.leave_cancelled': {
    icon: <Ban className="w-4 h-4" />,
    color: 'bg-slate-100 text-slate-600',
    category: 'hr',
    label: 'إلغاء إجازة',
  },

  // ─── HR — Payroll ─────────────────────────────────────
  'hr.payroll_ready': {
    icon: <Wallet className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-700',
    category: 'hr',
    label: 'مسير رواتب جاهز',
  },
  'hr.payroll_paid': {
    icon: <Banknote className="w-4 h-4" />,
    color: 'bg-emerald-50 text-emerald-700',
    category: 'hr',
    label: 'ترحيل راتب',
  },

  // ─── HR — Attendance ──────────────────────────────────
  'hr.attendance_missing': {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-700',
    category: 'hr',
    label: 'حضور مفقود',
  },
  'hr.attendance_reminder': {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-700',
    category: 'hr',
    label: 'تذكير بالحضور',
  },

  // ─── HR — Contract ────────────────────────────────────
  'hr.contract_expiry': {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-700',
    category: 'hr',
    label: 'انتهاء عقد',
  },

  // ─── Fallback ─────────────────────────────────────────
  default: {
    icon: <Bell className="w-4 h-4" />,
    color: 'bg-slate-100 text-slate-600',
    category: 'all',
    label: 'إشعار',
  },
};

const getConfig = (type: string): NotificationTypeConfig =>
  NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;

// ═══════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════
export const NotificationsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // Load
  // ═══════════════════════════════════════════════════════════
  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationsApi.list({ limit: 100 });
      setNotifications(
  Array.isArray(response) ? response : response.items
);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الإشعارات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ═══════════════════════════════════════════════════════════
  // Mark read
  // ═══════════════════════════════════════════════════════════
  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      alert(err.message || 'فشل التحديد');
    }
  };

  const handleMarkAllRead = async () => {
    if (!window.confirm('تحديد كل الإشعارات كمقروءة؟')) return;
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      alert(err.message || 'فشل التحديد');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذا الإشعار؟')) return;
    try {
      await notificationsApi.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Filter
  // ═══════════════════════════════════════════════════════════
  const filtered = notifications.filter((n) => {
    if (unreadOnly && n.is_read) return false;
    if (categoryFilter === 'all') return true;
    return getConfig(n.type).category === categoryFilter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ═══════════════════════════════════════════════════════════
  // Stats by category
  // ═══════════════════════════════════════════════════════════
  const hrCount = notifications.filter((n) => getConfig(n.type).category === 'hr').length;
  const b2bCount = notifications.filter((n) => getConfig(n.type).category === 'b2b').length;

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-rose-500 text-white text-xs font-black">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {notifications.length} إشعار — {unreadCount} غير مقروء
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={() => setCategoryFilter('all')}
          className={`p-3 rounded-xl border transition text-right ${
            categoryFilter === 'all'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}>
          <span className="block text-[10px] font-bold opacity-75">الكل</span>
          <span className="text-lg font-black font-mono">{notifications.length}</span>
        </button>
        <button type="button" onClick={() => setCategoryFilter('hr')}
          className={`p-3 rounded-xl border transition text-right ${
            categoryFilter === 'hr'
              ? 'bg-blue-50 border-blue-300 text-blue-900'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}>
          <span className="block text-[10px] font-bold opacity-75">الموارد البشرية</span>
          <span className="text-lg font-black font-mono">{hrCount}</span>
        </button>
        <button type="button" onClick={() => setCategoryFilter('b2b')}
          className={`p-3 rounded-xl border transition text-right ${
            categoryFilter === 'b2b'
              ? 'bg-purple-50 border-purple-300 text-purple-900'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}>
          <span className="block text-[10px] font-bold opacity-75">B2B</span>
          <span className="text-lg font-black font-mono">{b2bCount}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span className="text-xs font-bold text-slate-700">غير المقروءة فقط</span>
        </label>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as NotificationCategory)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">كل الفئات</option>
          <option value="hr">الموارد البشرية</option>
          <option value="b2b">شبكة B2B</option>
          <option value="finance">المالية</option>
          <option value="inventory">المخزون</option>
        </select>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {/* List */}
      {isLoading ? (
        <LoadingSpinner message="جاري تحميل الإشعارات..." fullHeight />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات"
          description={unreadOnly ? 'كل الإشعارات مقروءة' : 'لم يتم إنشاء أي إشعار بعد'}
          icon={<Bell className="w-8 h-8" />}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => {
              const cfg = getConfig(n.type);
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 hover:bg-slate-50/50 transition ${
                    !n.is_read ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className={`text-sm ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                            {n.title}
                          </h3>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className={`px-1.5 py-0.5 rounded ${cfg.color} font-bold`}>
                            {cfg.label}
                          </span>
                          <span>
                            {new Date(n.created_at).toLocaleString('ar-EG', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            title="تحديد كمقروء"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('notifications.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(n.id)}
                            title="حذف"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};