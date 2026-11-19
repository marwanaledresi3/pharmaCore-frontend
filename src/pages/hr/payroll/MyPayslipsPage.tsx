// pages/hr/payroll/MyPayslipsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Wallet, Eye, Download, RefreshCw, FileText,
} from 'lucide-react';
import { payrollApi } from '../../../api/hr/payrollApi';
import { PayrollItem } from '../../../types/hr';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { formatMoney, formatDate, monthName } from '../utils';
import { pdfApi } from '../../../api/pdfApi1';

export const MyPayslipsPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [payslips, setPayslips] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PayrollItem | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await payrollApi.myPayslips();
      setPayslips(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل القسائم');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">قسائم راتبي</h1>
          <p className="text-xs text-slate-500 mt-1">
            {payslips.length} قسيمة راتب
          </p>
        </div>
        <button type="button" onClick={load} disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition self-start" title="تحديث">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={load} />}

      {isLoading ? (
        <LoadingSpinner message="جاري تحميل القسائم..." fullHeight />
      ) : payslips.length === 0 ? (
        <EmptyState
          title="لا توجد قسائم راتب"
          description="لم يتم ترحيل أي مسير رواتب يحتوي على اسمك بعد."
          icon={<FileText className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md border font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                  مدفوع
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 mb-1">
                {p.period_year && p.period_month ? monthName(p.period_year, p.period_month) : p.run_number || '-'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mb-3">
                #{p.run_number || '-'} · {p.payment_date ? formatDate(p.payment_date) : '-'}
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">الإجمالي</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(p.gross_salary, currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">الخصومات</span>
                  <span className="font-mono font-bold text-rose-700">{formatMoney(p.total_deductions, currency)}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">الصافي</span>
                  <span className="font-mono font-black text-emerald-700">{formatMoney(p.net_salary, currency)}</span>
                </div>
              </div>

              <button type="button" onClick={() => setSelected(p)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                <Eye className="w-3.5 h-3.5" /> عرض القسيمة
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    pdfApi.downloadPayslipPdf(
                      p.id,
                      `${p.run_number}-${p.period_year}-${p.period_month}`
                    );
                  } catch (err: any) {
                    alert(err.message || 'فشل تحميل القسيمة');
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 mt-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل PDF
              </button>

              // أو للمعاينة (بدون تنزيل):
              <button
                type="button"
                onClick={() => pdfApi.previewPayslip(p.id)}
                className="..."
              >
                <Eye className="w-3.5 h-3.5" />
                معاينة
              </button>

            </div>
          ))}
        </div>
      )}

      {selected && (
        <PayslipDetailModal payslip={selected} currency={currency} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Payslip Detail
// ═══════════════════════════════════════════════════════════════════════════
const PayslipDetailModal: React.FC<{ payslip: PayrollItem; currency: string; onClose: () => void }> = ({ payslip, currency, onClose }) => {
  const earnings = [
    { label: 'الراتب الأساسي', value: payslip.basic_salary },
    { label: 'بدل السكن', value: payslip.housing_allowance },
    { label: 'بدل النقل', value: payslip.transport_allowance },
    { label: 'بدلات أخرى', value: payslip.other_allowances },
    { label: 'العمل الإضافي', value: payslip.overtime_amount },
    { label: 'المكافآت', value: payslip.bonus_amount },
  ].filter((x) => Number(x.value) > 0);

  const deductions = [
    { label: 'خصم الغياب', value: payslip.absence_deduction },
    { label: 'ضريبة الدخل', value: payslip.tax_deduction },
    { label: 'التأمينات الاجتماعية', value: payslip.social_insurance },
    { label: 'خصم السلف', value: payslip.loan_deduction },
    { label: 'خصومات أخرى', value: payslip.other_deductions },
  ].filter((x) => Number(x.value) > 0);

  return (
    <Modal isOpen onClose={onClose} title="قسيمة الراتب">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-l from-emerald-50 to-white border border-emerald-200">
          <p className="text-xs text-slate-500">الفترة</p>
          <h3 className="text-lg font-black text-slate-900">
            {payslip.period_year && payslip.period_month ? monthName(payslip.period_year, payslip.period_month) : '-'}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            #{payslip.run_number} · دُفع في {payslip.payment_date ? formatDate(payslip.payment_date) : '-'}
          </p>
        </div>

        <section>
          <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">الإيرادات</h4>
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
            {earnings.map((e) => (
              <div key={e.label} className="flex justify-between">
                <span className="text-slate-600">{e.label}</span>
                <span className="font-mono text-slate-800">{formatMoney(e.value, currency)}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-bold text-slate-900">إجمالي الإيرادات</span>
              <span className="font-mono font-black text-slate-900">{formatMoney(payslip.gross_salary, currency)}</span>
            </div>
          </div>
        </section>

        {deductions.length > 0 && (
          <section>
            <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider mb-2">الخصومات</h4>
            <div className="bg-rose-50/50 rounded-xl p-3 space-y-1.5 text-xs border border-rose-100">
              {deductions.map((d) => (
                <div key={d.label} className="flex justify-between">
                  <span className="text-slate-600">{d.label}</span>
                  <span className="font-mono text-rose-700">{formatMoney(d.value, currency)}</span>
                </div>
              ))}
              <div className="border-t border-rose-200 pt-1.5 flex justify-between">
                <span className="font-bold text-slate-900">إجمالي الخصومات</span>
                <span className="font-mono font-black text-rose-700">{formatMoney(payslip.total_deductions, currency)}</span>
              </div>
            </div>
          </section>
        )}

        <div className="p-4 rounded-xl bg-emerald-600 text-white">
          <p className="text-[10px] opacity-75">صافي الراتب</p>
          <p className="text-2xl font-black font-mono mt-1">{formatMoney(payslip.net_salary, currency)}</p>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};