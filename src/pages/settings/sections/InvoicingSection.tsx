import React from 'react';
import { FileText, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface InvoicingSettings {
  invoice_prefix: string;
  invoice_due_days: number;
  invoice_show_logo: boolean;
  invoice_show_tax_number: boolean;
  invoice_show_barcode: boolean;
  invoice_show_signature: boolean;
  invoice_footer: string;
  invoice_terms: string;
  invoice_template: 'standard' | 'modern' | 'minimal';
  invoice_currency_display: 'symbol' | 'code' | 'both';
}

const DEFAULTS: InvoicingSettings = {
  invoice_prefix: 'INV-',
  invoice_due_days: 30,
  invoice_show_logo: true,
  invoice_show_tax_number: true,
  invoice_show_barcode: true,
  invoice_show_signature: true,
  invoice_footer: '',
  invoice_terms: '',
  invoice_template: 'standard',
  invoice_currency_display: 'symbol',
};

export const InvoicingSection: React.FC = () => {
  const {
    settings, loading, saving, error, success, updateField, save, reload,
  } = useSettingsSection<InvoicingSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الفواتير..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات الفواتير</h3>
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
        {/* بادئة + أيام الاستحقاق */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              بادئة رقم الفاتورة
            </label>
            <input
              type="text"
              value={settings.invoice_prefix ?? ''}
              onChange={(e) => updateField('invoice_prefix', e.target.value)}
              maxLength={10}
              dir="ltr"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              مثال: INV- → INV-0001
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              أيام الاستحقاق الافتراضية
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={settings.invoice_due_days ?? 30}
              onChange={(e) => updateField('invoice_due_days', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* قالب + عرض العملة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">قالب الفاتورة</label>
            <select
              value={settings.invoice_template ?? 'standard'}
              onChange={(e) => updateField('invoice_template', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="standard">قياسي</option>
              <option value="modern">حديث</option>
              <option value="minimal">بسيط</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              طريقة عرض العملة
            </label>
            <select
              value={settings.invoice_currency_display ?? 'symbol'}
              onChange={(e) => updateField('invoice_currency_display', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="symbol">الرمز (﷼)</option>
              <option value="code">الكود (YER)</option>
              <option value="both">كلاهما (YER ﷼)</option>
            </select>
          </div>
        </div>

        {/* خيارات العرض */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'invoice_show_logo' as const, label: 'إظهار الشعار' },
            { key: 'invoice_show_tax_number' as const, label: 'إظهار الرقم الضريبي' },
            { key: 'invoice_show_barcode' as const, label: 'إظهار الباركود' },
            { key: 'invoice_show_signature' as const, label: 'إظهار التوقيع' },
          ].map(({ key, label }) => (
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

        {/* تذييل + شروط */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            تذييل الفاتورة
          </label>
          <input
            type="text"
            value={settings.invoice_footer ?? ''}
            onChange={(e) => updateField('invoice_footer', e.target.value)}
            maxLength={500}
            placeholder="شكراً لتعاملكم معنا"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            شروط وأحكام الفاتورة
          </label>
          <textarea
            value={settings.invoice_terms ?? ''}
            onChange={(e) => updateField('invoice_terms', e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* حفظ */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الفواتير'}
          </button>
        </div>
      </div>
    </div>
  );
};