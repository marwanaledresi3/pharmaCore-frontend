import React, { useState, useEffect } from 'react';
import { CreditCard, Save, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { companyApi } from '../../../api/companyApi';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface PaymentsSettings {
  payment_allow_partial: boolean;
  payment_allow_overpayment: boolean;
  payment_default_terms_days: number;
  payment_auto_apply_credit: boolean;
  payment_cash_account_id: string | null;
  payment_bank_account_id: string | null;
}

const DEFAULTS: PaymentsSettings = {
  payment_allow_partial: true,
  payment_allow_overpayment: false,
  payment_default_terms_days: 30,
  payment_auto_apply_credit: true,
  payment_cash_account_id: null,
  payment_bank_account_id: null,
};

interface AccountOption { id: string; code: string; name: string }

export const PaymentsSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<PaymentsSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  const [accountsLoading, setAccountsLoading] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<AccountOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<AccountOption[]>([]);

  useEffect(() => {
    (async () => {
      setAccountsLoading(true);
      try {
        const res = await companyApi.getPaymentAccounts();
        setCashAccounts(res.cash_accounts || []);
        setBankAccounts(res.bank_accounts || []);
      } catch {
        /* silent — fallback will show empty dropdown */
      } finally {
        setAccountsLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات المدفوعات..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات المدفوعات</h3>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="space-y-5">
        {/* الحسابات */}
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-sky-800 leading-relaxed">
            اختر الحساب الذي تُسجّل عليه المدفوعات النقدية والبنكية.
            عند تركه فارغاً، يُستخدم الحساب الافتراضي (1111 للصندوق / 1112 للبنك).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حساب الصندوق (Cash Account)
            </label>
            <select
              value={settings.payment_cash_account_id ?? ''}
              onChange={(e) => updateField('payment_cash_account_id', e.target.value || null)}
              disabled={accountsLoading}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
            >
              <option value="">استخدم الافتراضي (1111)</option>
              {cashAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حساب البنك (Bank Account)
            </label>
            <select
              value={settings.payment_bank_account_id ?? ''}
              onChange={(e) => updateField('payment_bank_account_id', e.target.value || null)}
              disabled={accountsLoading}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
            >
              <option value="">استخدم الافتراضي (1112)</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* الحدود */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            أيام الاستحقاق الافتراضية للمدفوعات
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={settings.payment_default_terms_days ?? 30}
            onChange={(e) => updateField('payment_default_terms_days', Number(e.target.value))}
            className="w-full md:w-64 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              key: 'payment_allow_partial' as const,
              label: 'السماح بالدفع الجزئي',
              hint: 'إذا عُطّل، يجب دفع كامل مبلغ الفاتورة مرة واحدة',
            },
            {
              key: 'payment_allow_overpayment' as const,
              label: 'السماح بالدفع الزائد',
              hint: 'يُحوّل الزائد إلى رصيد دائن للعميل',
            },
            {
              key: 'payment_auto_apply_credit' as const,
              label: 'تطبيق الرصيد الدائن تلقائياً',
              hint: 'عند وجود رصيد دائن، يُطبَّق تلقائياً على الفاتورة الجديدة',
            },
          ].map(({ key, label, hint }) => (
            <label
              key={key}
              className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={(e) => updateField(key, e.target.checked as any)}
                className="w-4 h-4 mt-0.5 accent-emerald-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-700 block">{label}</span>
                <span className="text-[10px] text-slate-500">{hint}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات المدفوعات'}
          </button>
        </div>
      </div>
    </div>
  );
};