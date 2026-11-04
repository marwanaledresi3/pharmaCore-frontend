import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Wallet,
  Building,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Pill,
  CreditCard,
  Network,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { DashboardReport } from '../types';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';
import { ProductsSection } from '../components/sections/ProductsSection';
import { CompanyPostsSection } from '../components/sections/CompanyPostsSection';
import { AboutSection } from '../components/sections/AboutSection';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}
const CustomersPage: React.FC = () => {
  return <div>Customers Page</div>;
};
export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { company } = useAuth();
  const [data, setData] = useState<DashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currency = company?.currency_code || 'YER';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات لوحة التحكم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: string | number | undefined) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">لوحة المؤشرات والعمليات</h1>
          <p className="text-xs text-slate-500 mt-1">
            ملخص الأداء المالي، حركة المبيعات، ومؤشرات المخزون الحالية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {isLoading && !data ? (
        <LoadingSpinner message="جاري احتساب مؤشرات لوحة التحكم من قاعدة البيانات..." fullHeight />
      ) : data ? (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="مبيعات اليوم"
              value={formatCurrency(data.salesToday?.amount)}
              subtitle={`${data.salesToday?.count || 0} فاتورة تم إتمامها اليوم`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />

            <StatCard
              title="مبيعات الشهر الحالي"
              value={formatCurrency(data.salesMonth?.amount)}
              subtitle={`${data.salesMonth?.count || 0} فاتورة خلال الشهر`}
              icon={<ShoppingCart className="w-5 h-5" />}
              color="blue"
            />

            <StatCard
              title="مشتريات الشهر"
              value={formatCurrency(data.purchasesMonth?.amount)}
              subtitle={`${data.purchasesMonth?.count || 0} فاتورة توريد`}
              icon={<ShoppingBag className="w-5 h-5" />}
              color="indigo"
            />

            <StatCard
              title="الذمم المدينة (مستحقات على العملاء)"
              value={formatCurrency(data.receivables?.balance)}
              subtitle="فواتير مبيعات غير مسددة أو جزئية"
              icon={<Wallet className="w-5 h-5" />}
              color="amber"
            />
          </div>

          {/* Secondary Financial & Inventory Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="الذمم الدائنة (مستحقات للموردين)"
              value={formatCurrency(data.payables?.balance)}
              subtitle="فواتير مشتريات مستحقة الدفع"
              icon={<Building className="w-5 h-5" />}
              color="rose"
            />

            <StatCard
              title="رصيد الصندوق النقدي"
              value={formatCurrency(data.cashBalance?.balance)}
              subtitle="السيولة المتاحة في الخزينة"
              icon={<CreditCard className="w-5 h-5" />}
              color="emerald"
            />

            <StatCard
              title="تنبيهات نواقص المخزون"
              value={`${data.lowStockCount?.count || 0} صنف`}
              subtitle="أصناف وصلت إلى الحد الأدنى للطلب"
              icon={<AlertTriangle className="w-5 h-5" />}
              color={Number(data.lowStockCount?.count) > 0 ? 'rose' : 'slate'}
            />

            <StatCard
              title="أدوية قريبة الانتهاء"
              value={`${data.expiringCount?.count || 0} دفعة`}
              subtitle="تنتهي صلاحيتها خلال 90 يوماً"
              icon={<Clock className="w-5 h-5" />}
              color={Number(data.expiringCount?.count) > 0 ? 'amber' : 'slate'}
            />
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('sales-orders')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">أمر بيع جديد</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('purchase-orders')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">أمر شراء جديد</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">إضافة دواء/صنف</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">تسجيل سند قبض</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">التقارير المالية</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('b2b')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">شبكة B2B</span>
              </button>
            </div>
          </div>
        </>
      ) : null}
      <div className="pt-2">
  <ProductsSection limit={8} showFilters title="🩺 كتالوج المنتجات" />
</div>

{/* منشورات الشركات */}
<div className="pt-2">
  <CompanyPostsSection limit={6} />
</div>

{/* عننا */}
<div className="pt-2">
  <AboutSection variant="dashboard" />
</div>
    </div>
  );
};
