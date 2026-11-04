import React, { useState, useEffect } from 'react';
import {
  Bell,
  LogOut,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api/notificationsApi';
import { NotificationItem } from '../../types';
import { API_BASE_URL } from '../../api/client';
import { useWebSocket } from '../../context/useWebSocket';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, company, logout, isOwner } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
const { isConnected, subscribe } = useWebSocket();

  // Check backend server health
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const rootUrl = API_BASE_URL.replace('/api/v1', '');
        const res = await fetch(`${rootUrl}/health`, { method: 'GET' });
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const countRes = await notificationsApi.getUnreadCount();
      setUnreadCount(countRes?.count || 0);

      const listRes = await notificationsApi.list({ limit: 10 });
      setNotifications(listRes.items || []);
    } catch {
      // Non-fatal
    }
  };

 // تحميل أولي مرة واحدة
useEffect(() => {
  loadNotifications();
}, []);

// ← WebSocket — إشعارات فورية (بدل polling)
useEffect(() => {
  const unsubscribe = subscribe((msg) => {
    if (msg.type === 'notification' && msg.data) {
      const incoming = msg.data;

      // أضف للقائمة
      setNotifications((prev) => {
        // تجنب التكرار
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 10);
      });

      // زيادة العداد (إن لم يكن مقروءاً)
      if (!incoming.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  });

  return unsubscribe;
}, [subscribe]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await notificationsApi.scan();
      await loadNotifications();
    } catch {
      //
    } finally {
      setIsScanning(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      //
    }
  };

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 print:hidden"
    >
      {/* Right side: Mobile Menu Button & Company / Tenant Branding */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden transition"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs font-bold text-lg">
            {company?.name ? company.name.charAt(0) : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 leading-none">
                {company?.name || 'PharmaCore ERP'}
              </h2>
              {isOwner && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  مالك المنشأة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              العملة: {company?.currency_code || 'YER'}
            </p>
          </div>
        </div>
      </div>

      {/* Left side: Live Server indicator, Notifications, User info, Logout */}
      <div className="flex items-center gap-3">
        {/* Live Backend Connection Indicator */}
        <div
          title={
            serverStatus === 'online'
              ? 'الباك إند متصل ويعمل بشكل طبيعي'
              : serverStatus === 'checking'
              ? 'جاري التحقق من الاتصال بالخادم...'
              : 'الخادم غير مستجيب أو قيد الإقلاع (Render Cold Start)'
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            serverStatus === 'online'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : serverStatus === 'checking'
              ? 'bg-slate-50 text-slate-600 border-slate-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              serverStatus === 'online'
                ? 'bg-emerald-500 animate-pulse'
                : serverStatus === 'checking'
                ? 'bg-slate-400'
                : 'bg-rose-500'
            }`}
          />
          <span>{serverStatus === 'online' ? 'الخادم متصل' : serverStatus === 'checking' ? 'فحص...' : 'فصل الاتصال'}</span>
        </div>
        {/* WebSocket status */}
<div
  title={isConnected ? 'الاتصال الفوري نشط' : 'جاري الاتصال...'}
  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
    isConnected
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'
  }`}
>
  <span
    className={`w-2 h-2 rounded-full ${
      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
    }`}
  />
  <span>{isConnected ? 'فوري' : 'اتصال...'}</span>
</div>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Modal/Dropdown */}
          {isNotifOpen && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 p-4 text-right z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800">التنبيهات</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 text-rose-700 text-xs px-2 py-0.2 font-semibold">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    title="فحص فوري لنواقص المخزون والفواتير المتأخرة"
                    className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">لا توجد تنبيهات حالياً</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-lg text-xs transition ${
                        !n.is_read ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-right">
            <span className="block text-xs font-bold text-slate-800 leading-none">
              {user?.name || 'المستخدم'}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          title="تسجيل الخروج"
          className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
