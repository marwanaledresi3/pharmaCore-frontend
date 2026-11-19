// pages/hr/HRPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HR_TABS } from './constants';
import { HRDashboardPage } from './dashboard/HRDashboardPage';
import { EmployeesPage } from './employees/EmployeesPage';
import { DepartmentsPage } from './departments/DepartmentsPage';
import { JobTitlesPage } from './jobTitles/JobTitlesPage';
import { AttendancePage } from './attendance/AttendancePage';
import { LeaveTypesPage } from './leaves/LeaveTypesPage';
import { LeaveRequestsPage } from './leaves/LeaveRequestsPage';
import { LeaveBalancesPage } from './leaves/LeaveBalancesPage';
import { PayrollPage } from './payroll/PayrollPage';
import { MyPayslipsPage } from './payroll/MyPayslipsPage';
import { HRReportsPage } from './reports/HRReportsPage';

export const HRPage: React.FC = () => {
  const { hasPermission, isOwner, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const myTabs = user?.employee_id
    ? [...HR_TABS, { id: 'my-payslips', label: 'قسائم راتبي' }]
    : HR_TABS;

  const visibleTabs = myTabs.filter((tab) => {
    if (!tab.permission) return true;
    if (isOwner) return true;
    return hasPermission(tab.permission);
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <HRDashboardPage />;
      case 'employees': return <EmployeesPage />;
      case 'departments': return <DepartmentsPage />;
      case 'job-titles': return <JobTitlesPage />;
      case 'attendance': return <AttendancePage />;
      case 'leave-types': return <LeaveTypesPage />;
      case 'leave-requests': return <LeaveRequestsPage />;
      case 'leave-balances': return <LeaveBalancesPage />;
      case 'payroll': return <PayrollPage />;
      case 'my-payslips': return <MyPayslipsPage />;
      case 'reports': return <HRReportsPage />;
      default: return <HRDashboardPage />;
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">الموارد البشرية</h1>
        <p className="text-xs text-slate-500 mt-1">
          إدارة الموظفين، الحضور، الإجازات، والرواتب
        </p>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};