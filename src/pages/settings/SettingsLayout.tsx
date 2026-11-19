// pages/settings/SettingsLayout.tsx
import React, { useState } from 'react';
import {
  Settings, Building2, DollarSign, Ruler, FileText, Package,
  Hash, CreditCard, Bell, Printer, Globe, Users, Shield,
  BookOpen, UserPlus, Menu, X, UserCog,BarChart3,
} from 'lucide-react';

// الأقسام — كل قسم له id + label + icon + component
import { CompanyProfileSection } from './sections/CompanyProfileSection';
import { CurrencySection } from './sections/CurrencySection';
import { UnitsSection } from './sections/UnitsSection';
import { InvoicingSection } from './sections/InvoicingSection';
import { InventorySection } from './sections/InventorySection';
import { NumberingSection } from './sections/NumberingSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { PrintingSection } from './sections/PrintingSection';
import { LocalizationSection } from './sections/LocalizationSection';
import { PartnersSection } from './sections/PartnersSection';
import { SecuritySection } from './sections/SecuritySection';
import { AccountingSection } from './sections/AccountingSection';
import { PortalSection } from './sections/PortalSection';

// ⬇️ HR — جديد
import { HRGeneralSection } from './sections/HRGeneralSection';
import { HRLeavesSection } from './sections/HRLeavesSection';       
import { HRNotificationsSection } from './sections/HRNotificationsSection'; // ⬅️ جديد
import { HRAttendanceSection } from './sections/HRAttendanceSection';
import { HRLeaveBalanceSection } from './sections/HRLeaveBalanceSection';
import { HRPayrollSection } from './sections/HRPayrollSection';
import { HRReportsSection } from './sections/HRReportsSection';

export type SettingsSection =
  | 'company' | 'currency' | 'units' | 'invoicing' | 'inventory'
  | 'numbering' | 'payments' | 'notifications' | 'printing'
  | 'localization' | 'partners' | 'security' | 'accounting' | 'portal'
  | 'hr-general' | 'hr-leaves' | 'hr-attendance' | 'hr-leave-balance' | 'hr-payroll' | 'hr-notifications' | 'hr-reports';  // ⬅️ جديد   // ⬅️ جديد

interface SectionDef {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  group: 'general' | 'operations' | 'hr' | 'system';   // ⬅️ أضفنا 'hr'
}

const SECTIONS: SectionDef[] = [
  // عام
  { id: 'company',       label: 'بيانات المنشأة',   icon: <Building2 className="w-4 h-4" />, group: 'general' },
  { id: 'currency',      label: 'العملة الأساسية',  icon: <DollarSign className="w-4 h-4" />, group: 'general' },
  { id: 'localization',  label: 'اللغة والتوطين',   icon: <Globe className="w-4 h-4" />,     group: 'general' },

  // العمليات
  { id: 'invoicing',     label: 'الفواتير',          icon: <FileText className="w-4 h-4" />,  group: 'operations' },
  { id: 'numbering',     label: 'الترقيم',           icon: <Hash className="w-4 h-4" />,      group: 'operations' },
  { id: 'inventory',     label: 'المخزون',           icon: <Package className="w-4 h-4" />,   group: 'operations' },
  { id: 'units',         label: 'وحدات القياس',      icon: <Ruler className="w-4 h-4" />,     group: 'operations' },
  { id: 'payments',      label: 'المدفوعات',         icon: <CreditCard className="w-4 h-4" />, group: 'operations' },
  { id: 'partners',      label: 'الشركاء',           icon: <Users className="w-4 h-4" />,      group: 'operations' },

  // ⬇️ HR — جديد
  { id: 'hr-general',       label: 'الإعدادات العامة',       icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-leaves',        label: 'الإجازات',               icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-attendance',    label: 'الحضور والدوام',         icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-leave-balance', label: 'أرصدة الإجازات',         icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-payroll',       label: 'الرواتب والتأمينات',     icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-notifications', label: 'إشعارات الموارد البشرية', icon: <UserCog className="w-4 h-4" />, group: 'hr' },
  { id: 'hr-reports',       label: 'تقارير الموارد البشرية',  icon: <BarChart3 className="w-4 h-4" />, group: 'hr' },  // ⬅️ جديد
    // النظام
  { id: 'notifications', label: 'الإشعارات',         icon: <Bell className="w-4 h-4" />,       group: 'system' },
  { id: 'printing',      label: 'الطباعة والـ PDF',   icon: <Printer className="w-4 h-4" />,    group: 'system' },
  { id: 'security',      label: 'الأمان',            icon: <Shield className="w-4 h-4" />,     group: 'system' },
  { id: 'accounting',    label: 'المحاسبة',          icon: <BookOpen className="w-4 h-4" />,   group: 'system' },
  { id: 'portal',        label: 'بوابات الشركاء',    icon: <UserPlus className="w-4 h-4" />,   group: 'system' },
];

const GROUPS = {
  general:    { title: 'عام',              order: 1 },
  operations: { title: 'العمليات',         order: 2 },
  hr:         { title: 'الموارد البشرية',  order: 3 },   // ⬅️ جديد
  system:     { title: 'النظام',           order: 4 },
} as const;

export const SettingsLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'company':       return <CompanyProfileSection />;
      case 'currency':      return <CurrencySection />;
      case 'units':         return <UnitsSection />;
      case 'invoicing':     return <InvoicingSection />;
      case 'inventory':     return <InventorySection />;
      case 'numbering':     return <NumberingSection />;
      case 'payments':      return <PaymentsSection />;
      case 'notifications': return <NotificationsSection />;
      case 'printing':      return <PrintingSection />;
      case 'localization':  return <LocalizationSection />;
      case 'partners':      return <PartnersSection />;
      case 'security':      return <SecuritySection />;
      case 'accounting':    return <AccountingSection />;
      case 'portal':        return <PortalSection />;

      // ⬇️ HR — جديد
     case 'hr-general':       return <HRGeneralSection />;
     case 'hr-leaves':        return <HRLeavesSection />;           // ⬅️ جديد
     case 'hr-attendance':    return <HRAttendanceSection />;
     case 'hr-leave-balance': return <HRLeaveBalanceSection />;
     case 'hr-payroll':       return <HRPayrollSection />;
     case 'hr-notifications': return <HRNotificationsSection />;
     case 'hr-reports':       return <HRReportsSection />;

      default:              return <CompanyProfileSection />;
    }
  };

  const groupedSections = (Object.keys(GROUPS) as Array<keyof typeof GROUPS>)
    .sort((a, b) => GROUPS[a].order - GROUPS[b].order)
    .map((gKey) => ({
      key: gKey,
      title: GROUPS[gKey].title,
      items: SECTIONS.filter((s) => s.group === gKey),
    }));

  const SideNav = (
    <nav className="space-y-5">
      {groupedSections.map((group) => (
        <div key={group.key}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-r-2 border-emerald-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-right">{item.label}</span>
                  {/* ⬇️ شارة HR اختيارية — تظهر فقط في القسم العام */}
                  {item.group === 'hr' && !isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">
                      HR
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            إعدادات المنشأة والنظام
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            إدارة كل إعدادات النظام من مكان واحد
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileNavOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700"
          aria-label="فتح القائمة"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-4">{SideNav}</div>
        </aside>

        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <div
              className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {SideNav}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">{renderSection()}</div>
      </div>
    </div>
  );
};