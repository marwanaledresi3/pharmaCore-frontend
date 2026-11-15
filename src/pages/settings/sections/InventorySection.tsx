import React from 'react';
import { Package, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface InventorySettings {
  inventory_method: 'fifo' | 'lifo' | 'average';
  inventory_allow_negative: boolean;
  inventory_low_stock_threshold: number;
  inventory_expiry_notify_days: number;
  inventory_expiry_warning_days: number;
  inventory_require_batch_on_sale: boolean;
  inventory_auto_reserve_on_approve: boolean;
  inventory_show_expired_in_sale: boolean;
}

const DEFAULTS: InventorySettings = {
  inventory_method: 'fifo',
  inventory_allow_negative: false,
  inventory_low_stock_threshold: 10,
  inventory_expiry_notify_days: 30,
  inventory_expiry_warning_days: 90,
  inventory_require_batch_on_sale: true,
  inventory_auto_reserve_on_approve: true,
  inventory_show_expired_in_sale: false,
};

const BOOL_FIELDS: Array<{ key: keyof InventorySettings; label: string; hint?: string }> = [
  { key: 'inventory_allow_negative', label: 'السماح بالمخزون السالب', hint: 'غير مستحسن في الصيدليات' },
  { key: 'inventory_require_batch_on_sale', label: 'إلزام اختيار الدفعة عند البيع' },
  { key: 'inventory_auto_reserve_on_approve', label: 'حجز تلقائي عند موافقة أمر الشراء' },
  { key: 'inventory_show_expired_in_sale', label: 'إظهار المنتجات المنتهية في البيع' },
];

export const InventorySection: React.FC = () => {
  const {
    settings, loading, saving, error, success, updateField, save, reload,
  } = useSettingsSection<InventorySettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات المخزون..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات المخزون</h3>
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
        {/* طريقة التقييم */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            طريقة تقييم المخزون
          </label>
          <select
            value={settings.inventory_method ?? 'fifo'}
            onChange={(e) => updateField('inventory_method', e.target.value as any)}
            className="w-full md:w-80 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="fifo">FIFO — الوارد أولاً صادر أولاً</option>
            <option value="lifo">LIFO — الوارد أخيراً صادر أولاً</option>
            <option value="average">المتوسط المرجّح</option>
          </select>
        </div>

        {/* الحدود الرقمية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حد المخزون المنخفض
            </label>
            <input
              type="number"
              min={0}
              value={settings.inventory_low_stock_threshold ?? 10}
              onChange={(e) => updateField('inventory_low_stock_threshold', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تنبيه قبل انتهاء الصلاحية (يوم)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={settings.inventory_expiry_notify_days ?? 30}
              onChange={(e) => updateField('inventory_expiry_notify_days', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تحذير مبكر (يوم)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={settings.inventory_expiry_warning_days ?? 90}
              onChange={(e) => updateField('inventory_expiry_warning_days', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* الخيارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BOOL_FIELDS.map(({ key, label, hint }) => (
            <label
              key={key}
              className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={!!(settings as any)[key]}
                onChange={(e) => updateField(key, e.target.checked as any)}
                className="w-4 h-4 mt-0.5 accent-emerald-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-700 block">{label}</span>
                {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
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
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات المخزون'}
          </button>
        </div>
      </div>
    </div>
  );
};