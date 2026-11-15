import React from 'react';
import { Globe, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface LocalizationSettings {
  timezone: string;
  date_format: string;
  locale_language: 'ar' | 'en';
  locale_number_format: string;
  locale_decimal_places: number;
  locale_currency_position: 'prefix' | 'suffix';
  locale_week_start_day: 'saturday' | 'sunday' | 'monday';
  locale_calendar: 'gregorian' | 'hijri';
}

const DEFAULTS: LocalizationSettings = {
  timezone: 'Asia/Aden',
  date_format: 'YYYY-MM-DD',
  locale_language: 'ar',
  locale_number_format: '1,234.56',
  locale_decimal_places: 2,
  locale_currency_position: 'suffix',
  locale_week_start_day: 'saturday',
  locale_calendar: 'gregorian',
};

const TIMEZONES = [
  'Asia/Aden', 'Asia/Riyadh', 'Asia/Dubai', 'Africa/Cairo',
  'Africa/Khartoum', 'Asia/Amman', 'Asia/Beirut', 'UTC',
];

const DATE_FORMATS = [
  'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY',
];

export const LocalizationSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<LocalizationSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات اللغة..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">اللغة والتوطين</h3>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">اللغة</label>
            <select
              value={settings.locale_language ?? 'ar'}
              onChange={(e) => updateField('locale_language', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المنطقة الزمنية
            </label>
            <select
              value={settings.timezone ?? 'Asia/Aden'}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تنسيق التاريخ
            </label>
            <select
              value={settings.date_format ?? 'YYYY-MM-DD'}
              onChange={(e) => updateField('date_format', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {DATE_FORMATS.map((df) => (
                <option key={df} value={df}>{df}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              بداية الأسبوع
            </label>
            <select
              value={settings.locale_week_start_day ?? 'saturday'}
              onChange={(e) => updateField('locale_week_start_day', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="saturday">السبت</option>
              <option value="sunday">الأحد</option>
              <option value="monday">الإثنين</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تنسيق الأرقام
            </label>
            <select
              value={settings.locale_number_format ?? '1,234.56'}
              onChange={(e) => updateField('locale_number_format', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="1,234.56">1,234.56 (فاصلة + نقطة)</option>
              <option value="1.234,56">1.234,56 (نقطة + فاصلة)</option>
              <option value="1 234,56">1 234,56 (مسافة + فاصلة)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الخانات العشرية
            </label>
            <input
              type="number"
              min={0}
              max={6}
              value={settings.locale_decimal_places ?? 2}
              onChange={(e) => updateField('locale_decimal_places', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              موضع رمز العملة
            </label>
            <select
              value={settings.locale_currency_position ?? 'suffix'}
              onChange={(e) => updateField('locale_currency_position', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="suffix">بعد الرقم (1,000 ﷼)</option>
              <option value="prefix">قبل الرقم (﷼ 1,000)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">التقويم</label>
          <select
            value={settings.locale_calendar ?? 'gregorian'}
            onChange={(e) => updateField('locale_calendar', e.target.value as any)}
            className="w-full md:w-64 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="gregorian">ميلادي</option>
            <option value="hijri">هجري</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات اللغة'}
          </button>
        </div>
      </div>
    </div>
  );
};