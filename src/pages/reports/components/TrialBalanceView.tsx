import React from 'react';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { fmtMoney, fmtDate, toNum, exportToCsv } from '../utils';
import { Download } from 'lucide-react';
import { pdfApi } from '../../../api/pdfApi1';
interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  total_debit: number;
  total_credit: number;
  balance: number;
  balance_side: 'debit' | 'credit' | 'zero';
  raw_balance: number;
}

interface TrialBalanceData {
  date_from: string | null;
  date_to: string;
  accounts: TrialBalanceAccount[];
  totals: {
    debit: number;
    credit: number;
    balanced: boolean;
    difference: number;
  };
}

interface Props {
  data: TrialBalanceData;
  dateFrom: string;
  dateTo: string;
  baseCurrency: string;
}

const TYPE_LABELS: Record<string, string> = {
  asset: 'أصول',
  liability: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

const TYPE_COLORS: Record<string, string> = {
  asset: 'text-blue-700 bg-blue-50',
  liability: 'text-rose-700 bg-rose-50',
  equity: 'text-violet-700 bg-violet-50',
  revenue: 'text-emerald-700 bg-emerald-50',
  expense: 'text-amber-700 bg-amber-50',
};

export const TrialBalanceView: React.FC<Props> = ({ data, dateFrom, dateTo, baseCurrency }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold">لا توجد بيانات للفترة المحددة</p>
      </div>
    );
  }

  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const totals = data.totals || {
    debit: 0,
    credit: 0,
    balanced: true,
    difference: 0,
  };

  const handleExport = () => {
    exportToCsv(
      accounts.map((a) => ({
        'الكود': a.code,
        'اسم الحساب': a.name,
        'النوع': TYPE_LABELS[a.account_type] || a.account_type,
        'مدين': a.total_debit,
        'دائن': a.total_credit,
        'الرصيد': a.balance,
        'جهة الرصيد': a.balance_side === 'debit' ? 'مدين' : a.balance_side === 'credit' ? 'دائن' : 'صفر',
      })),
      `trial_balance_${dateTo}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">ميزان المراجعة</h3>
          <p className="text-xs text-slate-500 font-mono">
            من {dateFrom} إلى {dateTo}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" /> تصدير CSV
        </button>
       <button
  onClick={() => pdfApi.downloadTrialBalancePdf({ date_from: dateFrom, date_to: dateTo })}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
>
  <Download className="w-3.5 h-3.5" /> PDF
</button>
      </div>

      {/* Status banner */}
      <div
        className={`p-4 rounded-xl border ${
          totals.balanced
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {totals.balanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span
              className={`text-sm font-bold ${
                totals.balanced ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {totals.balanced ? 'الميزان متوازن ✅' : 'الميزان غير متوازن ⚠️'}
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-500">إجمالي المدين: </span>
              <span className="font-bold">{fmtMoney(totals.debit)}</span>
            </div>
            <div>
              <span className="text-slate-500">إجمالي الدائن: </span>
              <span className="font-bold">{fmtMoney(totals.credit)}</span>
            </div>
            {!totals.balanced && (
              <div>
                <span className="text-rose-600 font-bold">الفرق: </span>
                <span className="font-bold text-rose-700">{fmtMoney(totals.difference)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-20">الكود</th>
              <th className="py-2.5 px-3">اسم الحساب</th>
              <th className="py-2.5 px-3 w-24 text-center">النوع</th>
              <th className="py-2.5 px-3 text-left w-28">مدين</th>
              <th className="py-2.5 px-3 text-left w-28">دائن</th>
              <th className="py-2.5 px-3 text-left w-32">الرصيد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  لا توجد حركات في هذه الفترة
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-slate-500">{a.code}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{a.name}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${TYPE_COLORS[a.account_type] || 'bg-slate-100 text-slate-700'}`}>
                      {TYPE_LABELS[a.account_type] || a.account_type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-left font-mono">
                    {a.total_debit > 0 ? fmtMoney(a.total_debit) : '—'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono">
                    {a.total_credit > 0 ? fmtMoney(a.total_credit) : '—'}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold">
                    {a.balance_side === 'zero' ? (
                      <span className="text-slate-400">0.00</span>
                    ) : (
                      <span
                        className={
                          a.balance_side === 'debit'
                            ? 'text-blue-700'
                            : 'text-emerald-700'
                        }
                      >
                        {fmtMoney(Math.abs(a.balance))}{' '}
                        <span className="text-[9px]">
                          ({a.balance_side === 'debit' ? 'مدين' : 'دائن'})
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {accounts.length > 0 && (
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr className="font-black text-slate-900">
                <td colSpan={3} className="py-3 px-3">
                  الإجمالي
                </td>
                <td className="py-3 px-3 text-left font-mono">
                  {fmtMoney(totals.debit, baseCurrency)}
                </td>
                <td className="py-3 px-3 text-left font-mono">
                  {fmtMoney(totals.credit, baseCurrency)}
                </td>
                <td className="py-3 px-3 text-left font-mono">
                  {totals.balanced ? (
                    <span className="text-emerald-700">متوازن ✅</span>
                  ) : (
                    <span className="text-rose-700">فرق {fmtMoney(totals.difference)}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};