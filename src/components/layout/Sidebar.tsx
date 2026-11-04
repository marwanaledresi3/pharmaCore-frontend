import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Truck, Pill, Warehouse, ShoppingBag,
  ShoppingCart, FileText, CreditCard, RotateCcw, BookOpen, Scale,
  DollarSign, BarChart3, Network, ShieldCheck, Settings, X,
  Receipt,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/ordersApi';
import { useWebSocket } from '../../context/useWebSocket';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  group: 'core' | 'operations' | 'finance' | 'b2b' | 'system';
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, activeTab, onSelectTab,
}) => {
  const { hasPermission, isOwner } = useAuth();

  /* ---------- incoming count badge ---------- */
  const [incomingCount, setIncomingCount] = useState(0);
const { subscribe } = useWebSocket();
  // helper: إعادة جلب العدد
const loadCount = async () => {
  try {
    const res = await ordersApi.getIncomingPurchaseOrders({ include_resolved: false });
    setIncomingCount(res.items.length);
  } catch {
    /* silent */
  }
};

// تحميل أولي
useEffect(() => {
  loadCount();
}, []);

// ← WebSocket — تحديث فوري عند إشعار يتعلق بأوامر الشراء
useEffect(() => {
  const unsubscribe = subscribe((msg) => {
    if (msg.type === 'notification' && msg.data) {
      const t = msg.data.type;
      if (
        t === 'purchase_order_incoming' ||
        t === 'purchase_order_approved' ||
        t === 'purchase_order_rejected' ||
        t === 'purchase_order_confirmed' ||
        t === 'purchase_order_cancelled'
      ) {
        // أعد جلب العدد (قد يكون زاد أو نقص)
        loadCount();
      }
    }
  });
  return unsubscribe;
}, [subscribe]);
  

  /* ---------- nav items ---------- */
  const navItems: NavItem[] = [
    // Core
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" />, group: 'core' },

    // Operations
    { id: 'sales-orders', label: 'أوامر البيع', icon: <ShoppingCart className="w-5 h-5" />, permission: 'sales_orders.view', group: 'operations' },
    { id: 'purchase-orders', label: 'أوامر الشراء', icon: <ShoppingBag className="w-5 h-5" />, permission: 'purchase_orders.view', group: 'operations' },
    { id: 'incoming-purchase-orders', label: 'الطلبات الواردة', icon: <ShoppingBag className="w-5 h-5" />, permission: 'purchase_orders.view', group: 'operations', badge: incomingCount },
    { id: 'invoices', label: 'الفواتير', icon: <FileText className="w-5 h-5" />, permission: 'invoices.view', group: 'operations' },
    { id: 'customers', label: 'العملاء', icon: <Users className="w-5 h-5" />, permission: 'customers.view', group: 'operations' },
    { id: 'suppliers', label: 'الموردون', icon: <Truck className="w-5 h-5" />, permission: 'suppliers.view', group: 'operations' },

    // Inventory
    { id: 'products', label: 'الأدوية والمنتجات', icon: <Pill className="w-5 h-5" />, permission: 'products.view', group: 'operations' },
    { id: 'warehouses', label: 'المستودعات والدفعات', icon: <Warehouse className="w-5 h-5" />, permission: 'warehouses.view', group: 'operations' },

    // Finance
    { id: 'payments', label: 'سندات القبض والصرف', icon: <CreditCard className="w-5 h-5" />, permission: 'payments.view', group: 'finance' },
    { id: 'expenses',  label: 'المصروفات التشغيلية',icon: <Receipt className="w-5 h-5" />,  permission: 'expenses.view',group: 'finance',},
    { id: 'returns', label: 'المرتجعات', icon: <RotateCcw className="w-5 h-5" />, permission: 'invoices.view', group: 'finance' },
    { id: 'accounts', label: 'شجرة الحسابات', icon: <BookOpen className="w-5 h-5" />, permission: 'accounts.view', group: 'finance' },
    { id: 'journal-entries', label: 'القيود اليومية', icon: <Scale className="w-5 h-5" />, permission: 'journal_entries.view', group: 'finance' },
    { id: 'currencies', label: 'العملات والصرف', icon: <DollarSign className="w-5 h-5" />, group: 'finance' },
    { id: 'reports', label: 'التقارير والميزانيات', icon: <BarChart3 className="w-5 h-5" />, permission: 'reports.view_financial', group: 'finance' },

    // B2B
    { id: 'b2b', label: 'سوق B2B والشبكة', icon: <Network className="w-5 h-5" />, group: 'b2b' },

    // System
    { id: 'users', label: 'المستخدمون والأدوار', icon: <ShieldCheck className="w-5 h-5" />, permission: 'users.view', group: 'system' },
    { id: 'settings', label: 'إعدادات المنشأة', icon: <Settings className="w-5 h-5" />, permission: 'companies.view', group: 'system' },
    { id: 'branches', label: 'الفروع', icon: <Building2 />, permission: 'branches.view', group: 'system' },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (isOwner) return true;
    return hasPermission(item.permission);
  });

  const groups = [
    { key: 'core', title: 'الرئيسية' },
    { key: 'operations', title: 'المبيعات والمخزون' },
    { key: 'finance', title: 'المالية والمحاسبة' },
    { key: 'b2b', title: 'شبكة الأعمال B2B' },
    { key: 'system', title: 'إدارة النظام' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden print:hidden" onClick={onClose} />
      )}

      <aside
        dir="rtl"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white font-black text-lg shadow-sm">PH</div>
            <div>
              <span className="font-black text-white text-base tracking-tight block">PharmaCore</span>
              <span className="text-[10px] text-emerald-400 font-semibold block tracking-wider uppercase">ERP &amp; Marketplace</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {groups.map((grp) => {
            const itemsInGroup = visibleItems.filter((it) => it.group === grp.key);
            if (itemsInGroup.length === 0) return null;

            return (
              <div key={grp.key}>
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{grp.title}</span>
                <nav className="mt-2 space-y-1">
                  {itemsInGroup.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 text-center text-[11px] text-slate-400">
          <p>PharmaCore ERP v2.4</p>
          <p className="text-[10px] text-slate-400 mt-0.5">نظام إدارة صيدلانية متكامل</p>
        </div>
      </aside>
    </>
  );
};