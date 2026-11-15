import React from 'react';
import { BookOpen, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface AccountingSettings {
  fiscal_year_start: string;
  accounting_auto_post_journal: boolean;
  accounting_allow_manual_journal: boolean;
  accounting_require_approval: boolean;
  accounting_rounding_method: 'nearest' | 'up' | 'down';
  accounting_cost_center_enabled: boolean;
}

const DEFAULTS: AccountingSettings = {
  fiscal_year_start: '01-01',
  accounting_auto_post_journal: true,
  accounting_allow_manual_journal: true,
  accounting_require_approval: false,
  accounting_rounding_method: 'nearest',
  accounting_cost_center_enabled: false,
};

export const AccountingSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<AccountingSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات المحاسبة..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات المحاسبة</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              بداية السنة المالية (MM-DD)
            </label>
            <input
              type="text"
              value={settings.fiscal_year_start ?? '01-01'}
              onChange={(e) => updateField('fiscal_year_start', e.target.value)}
              placeholder="01-01"
              dir="ltr"
              pattern="\d{2}-\d{2}"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              مثال: 01-01 = بداية يناير
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              طريقة التقريب
            </label>
            <select
              value={settings.accounting_rounding_method ?? 'nearest'}
              onChange={(e) => updateField('accounting_rounding_method', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="nearest">الأقرب</option>
              <option value="up">دائماً أعلى</option>
              <option value="down">دائماً أدنى</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              key: 'accounting_auto_post_journal' as const,
              label: 'ترحيل تلقائي للقيود',
              hint: 'عند إنشاء فاتورة/دفعة',
            },
            {
              key: 'accounting_allow_manual_journal' as const,
              label: 'السماح بالقيود اليدوية',
              hint: 'للمحاسب فقط',
            },
            {
              key: 'accounting_require_approval' as const,
              label: 'إلزام موافقة قبل الترحيل',
              hint: 'قد يبطئ العمل',
            },
            {
              key: 'accounting_cost_center_enabled' as const,
              label: 'تفعيل مراكز التكلفة',
              hint: 'للتوزيع المتقدم',
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
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات المحاسبة'}
          </button>
        </div>
      </div>
    </div>
  );
};