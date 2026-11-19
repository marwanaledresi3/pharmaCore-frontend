// pages/settings/sections/HRPayrollSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Wallet, Save, RefreshCw, AlertCircle, CheckCircle2, Calculator,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';

export const HRPayrollSection: React.FC = () => {
  const { hasPermission } = useAuth();

  const [paymentDay, setPaymentDay] = useState(25);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [roundMethod, setRoundMethod] = useState('nearest');
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [socialEmployee, setSocialEmployee] = useState(9.75);
  const [socialEmployer, setSocialEmployer] = useState(12);
  const [socialBase, setSocialBase] = useState('basic');
  const [socialMin, setSocialMin] = useState(0);
  const [socialMax, setSocialMax] = useState(45000);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxThreshold, setTaxThreshold] = useState(3000);
  const [taxRate, setTaxRate] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const all = await settingsApi.getAll();
      setPaymentDay(Number(all.hr_payroll_payment_day ?? 25));
      setAutoCalculate(all.hr_payroll_auto_calculate ?? false);
      setAutoPost(all.hr_payroll_auto_post_journal ?? false);
      setRoundMethod(all.hr_payroll_round_method ?? 'nearest');
      setSocialEnabled(all.hr_social_insurance_enabled ?? true);
      setSocialEmployee(Number(all.hr_social_employee_rate ?? 9.75));
      setSocialEmployer(Number(all.hr_social_employer_rate ?? 12));
      setSocialBase(all.hr_social_base ?? 'basic');
      setSocialMin(Number(all.hr_social_min_base ?? 0));
      setSocialMax(Number(all.hr_social_max_base ?? 45000));
      setTaxEnabled(all.hr_tax_enabled ?? true);
      setTaxThreshold(Number(all.hr_tax_exemption_threshold ?? 3000));
      setTaxRate(Number(all.hr_tax_rate ?? 5));
    } catch (err: any) {
      setError(err.message || 'فشل التحميل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await settingsApi.updateMany({
        hr_payroll_payment_day: paymentDay,
        hr_payroll_auto_calculate: autoCalculate,
        hr_payroll_auto_post_journal: autoPost,
        hr_payroll_round_method: roundMethod,
        hr_social_insurance_enabled: socialEnabled,
        hr_social_employee_rate: socialEmployee,
        hr_social_employer_rate: socialEmployer,
        hr_social_base: socialBase,
        hr_social_min_base: socialMin,
        hr_social_max_base: socialMax,
        hr_tax_enabled: taxEnabled,
        hr_tax_exemption_threshold: taxThreshold,
        hr_tax_rate: taxRate,
      });
      setSuccess('✅ تم حفظ إعدادات الرواتب');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div>
        <h3 className="text-sm font-black text-slate-900">إعدادات الرواتب</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          يوم الصرف، التأمينات الاجتماعية، ضريبة الدخل، الحساب التلقائي
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Payment Day + Auto */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">الدفع والحساب</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">يوم الصرف من الشهر</label>
            <input type="number" min="1" max="28" value={paymentDay}
              onChange={(e) => setPaymentDay(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">طريقة التقريب</label>
            <select value={roundMethod} onChange={(e) => setRoundMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
              <option value="nearest">أقرب رقم</option>
              <option value="up">أعلى</option>
              <option value="down">أدنى</option>
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="block text-xs font-bold text-slate-900">حساب تلقائي شهري</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              ينشئ مسير الرواتب تلقائياً في يوم 25 من كل شهر (كسدوة)
            </span>
          </div>
          <input type="checkbox" checked={autoCalculate} onChange={(e) => setAutoCalculate(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0" />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="block text-xs font-bold text-slate-900">ترحيل القيد تلقائياً</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              بعد حساب المسير مباشرة، يُرحّل القيد المحاسبي دون مراجعة يدوية
            </span>
          </div>
          <input type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0" />
        </label>
      </div>

      {/* Social Insurance */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900">التأمينات الاجتماعية</h4>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={socialEnabled} onChange={(e) => setSocialEnabled(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
            <span className="font-bold text-slate-700">مفعّل</span>
          </label>
        </div>

        {socialEnabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حصة الموظف (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={socialEmployee}
                  onChange={(e) => setSocialEmployee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حصة الشركة (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={socialEmployer}
                  onChange={(e) => setSocialEmployer(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الوعاء</label>
              <select value={socialBase} onChange={(e) => setSocialBase(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none">
                <option value="basic">الراتب الأساسي</option>
                <option value="gross">إجمالي الراتب</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حد أدنى للوعاء</label>
                <input type="number" min="0" value={socialMin}
                  onChange={(e) => setSocialMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حد أقصى للوعاء</label>
                <input type="number" min="0" value={socialMax}
                  onChange={(e) => setSocialMax(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Income Tax */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900">ضريبة الدخل</h4>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
            <span className="font-bold text-slate-700">مفعّلة</span>
          </label>
        </div>

        {taxEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">حد الإعفاء الشهري</label>
              <input type="number" min="0" value={taxThreshold}
                onChange={(e) => setTaxThreshold(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">النسبة (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {hasPermission('settings.update') && (
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
};