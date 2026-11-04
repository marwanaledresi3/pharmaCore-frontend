import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  Layers,
  PieChart,
} from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import { pdfApi } from '../api/pdfApi1';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

type ReportCategory =
  | 'balance-sheet'
  | 'income-statement'
  | 'sales'
  | 'purchases'
  | 'top-products'
  | 'inventory'
  | 'ar-aging'
  | 'ap-aging'
  | 'tax';

export const ReportsPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [activeReport, setActiveReport] = useState<ReportCategory>('income-statement');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Print modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res: any = null;
      switch (activeReport) {
        case 'balance-sheet':
          res = await reportsApi.getBalanceSheet({ date_to: dateTo });
          break;
        case 'income-statement':
          res = await reportsApi.getIncomeStatement({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'sales':
          res = await reportsApi.getSalesReport({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'purchases':
          res = await reportsApi.getPurchasesReport({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'top-products':
          res = await reportsApi.getTopProducts({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'inventory':
          res = await reportsApi.getInventoryReport();
          break;
        case 'ar-aging':
          res = await reportsApi.getArAging({ as_of_date: dateTo });
          break;
        case 'ap-aging':
          res = await reportsApi.getApAging({ as_of_date: dateTo });
          break;
        case 'tax':
          res = await reportsApi.getTaxSummary({ date_from: dateFrom, date_to: dateTo });
          break;
      }
      setReportData(res);
    } catch (err: any) {
      setError(err.message || 'فشل توليد التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const reportTabs = [
    { id: 'income-statement', label: 'قائمة الدخل (الأرباح والخسائر)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'balance-sheet', label: 'الميزانية العمومية', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'sales', label: 'تقرير المبيعات التفصيلي', icon: <FileText className="w-4 h-4" /> },
    { id: 'purchases', label: 'تقرير المشتريات والتوريد', icon: <Package className="w-4 h-4" /> },
    { id: 'top-products', label: 'الأدوية الأكثر مبيعاً', icon: <PieChart className="w-4 h-4" /> },
    { id: 'inventory', label: 'تقرير قيمة المخزون', icon: <Layers className="w-4 h-4" /> },
    { id: 'ar-aging', label: 'أعمار ديون العملاء (AR)', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ap-aging', label: 'أعمار ذمم الموردين (AP)', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مركز التقارير والقوائم المالية</h1>
          <p className="text-xs text-slate-500 mt-1">
            القوائم المالية الختامية، تقارير المبيعات والأرباح، وأعمار الديون وفق البيانات الفعلية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReport === 'sales' && (
            <button
              type="button"
              onClick={() => pdfApi.downloadSalesReportPdf({ date_from: dateFrom, date_to: dateTo })}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
            >
              <Download className="w-4 h-4" />
              تحميل PDF رسمي
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* Date Filter & Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">من تاريخ:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <span className="text-xs font-bold text-slate-600 mr-2">إلى تاريخ:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={loadReport}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition mr-2"
          >
            تطبيق الفترة
          </button>
        </div>

        <button
          type="button"
          onClick={loadReport}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {reportTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveReport(t.id as ReportCategory)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeReport === t.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {error && <ErrorAlert error={error} onRetry={loadReport} />}

      {/* Report Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6">
        {isLoading ? (
          <LoadingSpinner message="جاري توليد واحتساب التقرير من القيود المحاسبية..." fullHeight />
        ) : !reportData ? (
          <p className="text-center py-12 text-xs text-slate-400">لا توجد بيانات متاحة لهذا التقرير</p>
        ) : activeReport === 'income-statement' ? (
          /* Income Statement View */
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">قائمة الدخل الشامل (الأرباح والخسائر)</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                عن الفترة من {dateFrom} إلى {dateTo}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Revenues */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex justify-between items-center font-bold text-emerald-900 text-sm">
                  <span>إجمالي الإيرادات والمبيعات:</span>
                  <span className="font-mono">
                    {Number(reportData.totalRevenue || reportData.revenue || 0).toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* COGS */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center font-semibold text-slate-800">
                  <span>تكلفة البضاعة المباعة (COGS):</span>
                  <span className="font-mono">
                    {Number(reportData.totalCogs || reportData.cogs || 0).toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
                <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>مجمل الربح (Gross Profit):</span>
                  <span className="font-mono">
                    {Number(reportData.grossProfit || 0).toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* Expenses */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex justify-between items-center font-semibold text-rose-900">
                  <span>إجمالي المصروفات التشغيلية:</span>
                  <span className="font-mono">
                    {Number(reportData.totalExpenses || reportData.expenses || 0).toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="p-5 rounded-2xl bg-emerald-600 text-white shadow-sm">
                <div className="flex justify-between items-center font-black text-base">
                  <span>صافي الربح / (الخسارة):</span>
                  <span className="font-mono text-lg">
                    {Number(reportData.netProfit || 0).toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeReport === 'balance-sheet' ? (
          /* Balance Sheet View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                الأصول والموجودات (Assets)
              </h3>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">الأصول المتداولة (نقدية، بنوك، مخزون):</span>
                <span className="font-mono font-bold text-slate-800">
                  {Number(reportData.currentAssets || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">ذمم مدينة (مستحقات العملاء):</span>
                <span className="font-mono font-bold text-slate-800">
                  {Number(reportData.receivables || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-xs text-emerald-800">
                <span>إجمالي الأصول:</span>
                <span className="font-mono text-sm">
                  {Number(reportData.totalAssets || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                الالتزامات وحقوق الملكية (Liabilities &amp; Equity)
              </h3>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">الالتزامات المتداولة (ذمم دائنة للموردين):</span>
                <span className="font-mono font-bold text-slate-800">
                  {Number(reportData.currentLiabilities || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">حقوق الملكية والأرباح المحتجزة:</span>
                <span className="font-mono font-bold text-slate-800">
                  {Number(reportData.equity || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-xs text-slate-900">
                <span>إجمالي الخصوم وحقوق الملكية:</span>
                <span className="font-mono text-sm">
                  {Number(reportData.totalLiabilitiesAndEquity || 0).toLocaleString()} {baseCurrency}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* General Raw / Table View */
          <div className="overflow-x-auto">
            <pre className="p-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-mono overflow-auto max-h-96">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={reportTabs.find((t) => t.id === activeReport)?.label || 'تقرير مالي'}
        documentType="تقرير محاسبي"
        documentNumber={new Date().getTime().toString().slice(-6)}
        documentDate={`${dateFrom} إلى ${dateTo}`}
        partyTitle="المنشأة"
        partyName={company?.name || 'PharmaCore ERP'}
        currencyCode={baseCurrency}
        company={company}
        summary={[
          {
            label: 'الفترة المحاسبية',
            value: `من ${dateFrom} إلى ${dateTo}`,
          },
        ]}
      />
    </div>
  );
};
