import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

// Pages
import { DashboardPage } from '../../pages/DashboardPage';
import { SalesOrdersPage } from '../../pages/SalesOrdersPage';
import { PurchaseOrdersPage } from '../../pages/purchaseOrders/PurchaseOrdersPage';
import { IncomingPurchaseOrdersPage } from '../../pages/IncomingPurchaseOrdersPage';
import { InvoicesPage } from '../../pages/InvoicesPage';
import { CustomersPage } from '../../pages/CustomersPage';
import { SuppliersPage } from '../../pages/SuppliersPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { WarehousesPage } from '../../pages/WarehousesPage';
import { PaymentsPage } from '../../pages/PaymentsPage';
import { ExpensesPage } from '../../pages/ExpensesPage1';  
import { ReturnsPage } from '../../pages/ReturnsPage';
import { AccountsPage } from '../../pages/AccountsPage';
import { JournalEntriesPage } from '../../pages/JournalEntriesPage';
import { CurrenciesPage } from '../../pages/CurrenciesPage';
import { ReportsPage } from '../../pages/reports/ReportsPage';
import { B2BMarketplacePage } from '../../pages/B2BMarketplacePage';
import { UsersPage } from '../../pages/UsersPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { BranchesPage } from '../../pages/BranchesPage';
export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'sales-orders':
        return <SalesOrdersPage />;
      case 'purchase-orders':
        return <PurchaseOrdersPage />;
      case 'incoming-purchase-orders':
        return <IncomingPurchaseOrdersPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'products':
        return <ProductsPage />;
      case 'warehouses':
        return <WarehousesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'journal-entries':
        return <JournalEntriesPage />;
      case 'currencies':
        return <CurrenciesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'b2b':
        return <B2BMarketplacePage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'branches':
        return <BranchesPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans" dir="rtl">
      {/* Sidebar (Desktop & Mobile) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderActivePage()}</div>
        </main>
      </div>
    </div>
  );
};
