import React from 'react';
import { Bell, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface NotificationsSettings {
  notify_new_order: boolean;
  notify_payment_received: boolean;
  notify_low_stock: boolean;
  notify_expiry: boolean;
  notify_daily_summary: boolean;
  notify_weekly_report: boolean;
  notify_channel_email: boolean;
  notify_channel_sms: boolean;
  notify_channel_whatsapp: boolean;
}

const DEFAULTS: NotificationsSettings = {
  notify_new_order: true,
  notify_payment_received: true,
  notify_low_stock: true,
  notify_expiry: true,
  notify_daily_summary: true,
  notify_weekly_report: false,
  notify_channel_email: false,
  notify_channel_sms: false,
  notify_channel_whatsapp: false,
};

export const NotificationsSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<NotificationsSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الإشعارات..." />
      </div>
    );
  }

  const events = [
    { key: 'notify_new_order' as const, label: 'أمر بيع/شراء جديد' },
    { key: 'notify_payment_received' as const, label: 'استلام دفعة' },
    { key: 'notify_low_stock' as const, label: 'مخزون منخفض' },
    { key: 'notify_expiry' as const, label: 'قرب انتهاء الصلاحية' },
    { key: 'notify_daily_summary' as const, label: 'ملخص يومي' },
    { key: 'notify_weekly_report' as const, label: 'تقرير أسبوعي' },
  ];

  const channels = [
    { key: 'notify_channel_email' as const, label: 'بريد إلكتروني' },
    { key: 'notify_channel_sms' as const, label: 'رسائل SMS' },
    { key: 'notify_channel_whatsapp' as const, label: 'واتساب' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات الإشعارات</h3>
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

      <div className="space-y-6">
        {/* الأحداث */}
        <div>
          <h4 className="text-xs font-black text-slate-800 mb-2">الأحداث المُنبَّه عنها</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {events.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={(e) => updateField(key, e.target.checked as any)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* القنوات */}
        <div>
          <h4 className="text-xs font-black text-slate-800 mb-2">قنوات الإرسال</h4>
          <p className="text-[10px] text-slate-500 mb-2">
            بغض النظر عن التفعيل، الإشعارات تظهر دائماً داخل النظام (In-app). هذه القنوات إضافية.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {channels.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={(e) => updateField(key, e.target.checked as any)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الإشعارات'}
          </button>
        </div>
      </div>
    </div>
  );
};