import React from 'react';
import { Shield, Save, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface SecuritySettings {
  security_password_min_length: number;
  security_password_require_upper: boolean;
  security_password_require_number: boolean;
  security_session_timeout_minutes: number;
  security_max_login_attempts: number;
  security_require_2fa: boolean;
}

const DEFAULTS: SecuritySettings = {
  security_password_min_length: 8,
  security_password_require_upper: true,
  security_password_require_number: true,
  security_session_timeout_minutes: 60,
  security_max_login_attempts: 5,
  security_require_2fa: false,
};

export const SecuritySection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<SecuritySettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الأمان..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات الأمان</h3>
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-relaxed">
            هذه الإعدادات تنطبق على كل المستخدمين في الشركة. تغييرها يؤثر فوراً على
            تسجيل الدخول وكلمات المرور.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الحد الأدنى لطول كلمة المرور
            </label>
            <input
              type="number"
              min={6}
              max={128}
              value={settings.security_password_min_length ?? 8}
              onChange={(e) => updateField('security_password_min_length', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مهلة الجلسة (دقيقة)
            </label>
            <input
              type="number"
              min={5}
              max={10080}
              value={settings.security_session_timeout_minutes ?? 60}
              onChange={(e) => updateField('security_session_timeout_minutes', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            عدد محاولات تسجيل الدخول قبل الحظر
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.security_max_login_attempts ?? 5}
            onChange={(e) => updateField('security_max_login_attempts', Number(e.target.value))}
            className="w-full md:w-64 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: 'security_password_require_upper' as const,
              label: 'إلزام حرف كبير',
              hint: 'A-Z',
            },
            {
              key: 'security_password_require_number' as const,
              label: 'إلزام رقم',
              hint: '0-9',
            },
            {
              key: 'security_require_2fa' as const,
              label: 'إلزام 2FA',
              hint: 'لكل المستخدمين',
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
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان'}
          </button>
        </div>
      </div>
    </div>
  );
};