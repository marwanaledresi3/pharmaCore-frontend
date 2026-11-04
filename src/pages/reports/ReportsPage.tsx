import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Printer, RefreshCw, Calendar } from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { PrintPreviewModal } from '../../components/common/PrintPreviewModal';
import { useAuth } from '../../context/AuthContext';

import { REPORT_TABS, ReportCategory } from './constants';
import { IncomeStatementView } from './components/IncomeStatementView';
import { BalanceSheetView } from './components/BalanceSheetView';
import { SalesReportView } from './components/SalesReportView';
import { PurchasesReportView } from './components/PurchasesReportView';
import { TopProductsView } from './components/TopProductsView';
import { InventoryView } from './components/InventoryView';
import { AgingView } from './components/AgingView';
import { TrialBalanceView } from './components/TrialBalanceView';
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
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // ← استخدم ref لمنع تعارض الطلبات
  const reqIdRef = useRef(0);

  const loadReport = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    const currentReport = activeReport;

    setIsLoading(true);
    setError(null);
    setReportData(null);   // ← صفّر البيانات قبل الجلب

    try {
      let res: any = null;
      switch (currentReport) {
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
          res = await reportsApi.getTopProducts({ date_from: dateFrom, date_to: dateTo, limit: 20 });
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
        case 'trial-balance':
          res = await reportsApi.getTrialBalance({ date_from: dateFrom, date_to: dateTo,  });
          break;
      }

      // ← تجاهل النتيجة إن تغيّر التقرير
      if (reqId !== reqIdRef.current) {
        return;
      }

      setReportData(res);
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      setError(err?.message || 'فشل توليد التقرير');
    } finally {
      if (reqId === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeReport, dateFrom, dateTo]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const activeTab = REPORT_TABS.find((t) => t.id === activeReport);

  // ← استخرج البيانات بشكل موحّد
  const normalizedData = reportData?.data ?? reportData;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            مركز التقارير والقوائم المالية
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            القوائم المالية، تقارير المبيعات والمخزون، وأعمار الديون
          </p>
        </div>
        <button
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs"
        >
          <Printer className="w-4 h-4" /> طباعة
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600">من:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <span className="text-xs font-bold text-slate-600 mr-2">إلى:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono"
          />
          <button
            onClick={loadReport}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 mr-2"
          >
            تطبيق
          </button>
        </div>
        <button
          onClick={loadReport}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveReport(t.id)}
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

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6">
        {isLoading ? (
          <LoadingSpinner message="جاري توليد التقرير..." fullHeight />
        ) : !normalizedData ? (
          <p className="text-center py-12 text-xs text-slate-400">لا توجد بيانات متاحة</p>
        ) : (
          <div key={activeReport}>
            {activeReport === 'income-statement' && (
              <IncomeStatementView
                data={normalizedData}
                dateFrom={dateFrom}
                dateTo={dateTo}
                baseCurrency={baseCurrency}
              />
            )}
            {activeReport === 'balance-sheet' && (
              <BalanceSheetView data={normalizedData} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'sales' && (
              <SalesReportView data={normalizedData} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'purchases' && (
              <PurchasesReportView data={normalizedData} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'top-products' && (
              <TopProductsView data={normalizedData} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'inventory' && (
              <InventoryView data={normalizedData} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'trial-balance' && (
              <TrialBalanceView  data={normalizedData} dateFrom={dateFrom}  dateTo={dateTo} baseCurrency={baseCurrency} />
            )}
            {activeReport === 'ar-aging' && (
              <AgingView data={normalizedData} baseCurrency={baseCurrency} type="ar" />
            )}
            {activeReport === 'ap-aging' && (
              <AgingView data={normalizedData} baseCurrency={baseCurrency} type="ap" />
            )}
          </div>
        )}
      </div>

      {/* Print */}
      <PrintPreviewModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={activeTab?.label || 'تقرير'}
        documentType="تقرير محاسبي"
        documentNumber={new Date().getTime().toString().slice(-6)}
        documentDate={`${dateFrom} إلى ${dateTo}`}
        partyTitle="المنشأة"
        partyName={company?.name || 'PharmaCore'}
        currencyCode={baseCurrency}
        company={company}
        summary={[
          { label: 'الفترة', value: `${dateFrom} إلى ${dateTo}` },
          { label: 'النوع', value: activeTab?.label || '' },
        ]}
      />
    </div>
  );
};