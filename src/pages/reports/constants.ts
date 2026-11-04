import React from 'react';
import {
  TrendingUp, DollarSign, FileText, Scale, Package, PieChart, Layers, BarChart3,
} from 'lucide-react';

export type ReportCategory =
  | 'income-statement'
  | 'balance-sheet'
  | 'trial-balance' 
  | 'sales'
  | 'purchases'
  | 'top-products'
  | 'inventory'
  | 'ar-aging'
  | 'ap-aging';

export const REPORT_TABS: Array<{
  id: ReportCategory;
  label: string;
  icon: React.ReactNode;
  requiresPeriod: boolean;
}> = [
  { id: 'income-statement', label: 'قائمة الدخل', icon: React.createElement(TrendingUp, { className: 'w-4 h-4' }), requiresPeriod: true },
  { id: 'balance-sheet', label: 'الميزانية العمومية', icon: React.createElement(DollarSign, { className: 'w-4 h-4' }), requiresPeriod: false },
  { id: 'sales', label: 'المبيعات التفصيلي', icon: React.createElement(FileText, { className: 'w-4 h-4' }), requiresPeriod: true },
  { 
  id: 'trial-balance', 
  label: 'ميزان المراجعة', 
  icon: React.createElement(Scale, { className: 'w-4 h-4' }), 
  requiresPeriod: true 
},
  { id: 'purchases', label: 'المشتريات والتوريد', icon: React.createElement(Package, { className: 'w-4 h-4' }), requiresPeriod: true },
  { id: 'top-products', label: 'الأكثر مبيعاً', icon: React.createElement(PieChart, { className: 'w-4 h-4' }), requiresPeriod: true },
  { id: 'inventory', label: 'قيمة المخزون', icon: React.createElement(Layers, { className: 'w-4 h-4' }), requiresPeriod: false },
  { id: 'ar-aging', label: 'أعمار ديون العملاء', icon: React.createElement(BarChart3, { className: 'w-4 h-4' }), requiresPeriod: false },
  { id: 'ap-aging', label: 'أعمار ذمم الموردين', icon: React.createElement(BarChart3, { className: 'w-4 h-4' }), requiresPeriod: false },
];