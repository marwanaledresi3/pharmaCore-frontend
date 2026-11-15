import React from 'react';
import { Users, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface PartnersSettings {
  partners_customer_default_terms: number;
  partners_supplier_default_terms: number;
  partners_customer_credit_check: boolean;
  partners_require_tax_number: boolean;
}

const DEFAULTS: PartnersSettings = {
  partners_customer_default_terms: 30,
  partners_supplier_default_terms: 30,
  partners_customer_credit_check: true,
  partners_require_tax_number: false,
};

export const PartnersSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<PartnersSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الشركاء..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">العملاء والموردون</h3>
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
              شروط الدفع الافتراضية — العملاء (يوم)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={settings.partners_customer_default_terms ?? 30}
              onChange={(e) => updateField('partners_customer_default_terms', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شروط الدفع الافتراضية — الموردون (يوم)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={settings.partners_supplier_default_terms ?? 30}
              onChange={(e) => updateField('partners_supplier_default_terms', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!!settings.partners_customer_credit_check}
              onChange={(e) => updateField('partners_customer_credit_check', e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-emerald-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                فحص الحد الائتماني للعميل عند البيع
              </span>
              <span className="text-[10px] text-slate-500">
                يمنع البيع إذا تجاوز الرصيد الحد المسموح
              </span>
            </div>
          </label>
          <label className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!!settings.partners_require_tax_number}
              onChange={(e) => updateField('partners_require_tax_number', e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-emerald-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                إلزام الرقم الضريبي للعميل
              </span>
              <span className="text-[10px] text-slate-500">
                عند إنشاء عميل جديد
              </span>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الشركاء'}
          </button>
        </div>
      </div>
    </div>
  );
};