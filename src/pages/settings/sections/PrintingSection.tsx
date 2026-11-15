import React from 'react';
import { Printer, Save, CheckCircle, RefreshCw, FileText } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface PrintingSettings {
  pdf_paper_size: 'A4' | 'A5' | 'Letter';
  pdf_orientation: 'portrait' | 'landscape';
  pdf_font: string;
  pdf_font_size: number;
  pdf_show_watermark: boolean;
  pdf_watermark_text: string;
  pdf_show_page_numbers: boolean;
  pdf_header_text: string;
}

const DEFAULTS: PrintingSettings = {
  pdf_paper_size: 'A4',
  pdf_orientation: 'portrait',
  pdf_font: 'Cairo',
  pdf_font_size: 12,
  pdf_show_watermark: false,
  pdf_watermark_text: 'مسودة',
  pdf_show_page_numbers: true,
  pdf_header_text: '',
};

const FONT_OPTIONS = ['Cairo', 'Amiri', 'Tajawal', 'Almarai', 'Noto Naskh Arabic'];

export const PrintingSection: React.FC = () => {
  const { settings, loading, saving, error, success, updateField, save, reload } =
    useSettingsSection<PrintingSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الطباعة..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات الطباعة والـ PDF</h3>
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
        <p className="text-xs text-slate-600 leading-relaxed p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          هذه الإعدادات تنطبق على كل ملفات PDF (فواتير، سندات، تقارير، أوامر شراء).
        </p>

        {/* الورق + الاتجاه */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حجم الورق
            </label>
            <select
              value={settings.pdf_paper_size ?? 'A4'}
              onChange={(e) => updateField('pdf_paper_size', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="A4">A4 (210×297 mm)</option>
              <option value="A5">A5 (148×210 mm)</option>
              <option value="Letter">Letter (216×279 mm)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اتجاه الصفحة
            </label>
            <select
              value={settings.pdf_orientation ?? 'portrait'}
              onChange={(e) => updateField('pdf_orientation', e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="portrait">طولي (Portrait)</option>
              <option value="landscape">عرضي (Landscape)</option>
            </select>
          </div>
        </div>

        {/* الخط + الحجم */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الخط العربي
            </label>
            <select
              value={settings.pdf_font ?? 'Cairo'}
              onChange={(e) => updateField('pdf_font', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              حجم الخط (pt)
            </label>
            <input
              type="number"
              min={6}
              max={24}
              value={settings.pdf_font_size ?? 12}
              onChange={(e) => updateField('pdf_font_size', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* رأس الصفحة */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            نص رأس الصفحة (اختياري)
          </label>
          <input
            type="text"
            value={settings.pdf_header_text ?? ''}
            onChange={(e) => updateField('pdf_header_text', e.target.value)}
            maxLength={500}
            placeholder="مثال: شركة النيل للأدوية — سجل تجاري 12345"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* العلامة المائية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!!settings.pdf_show_watermark}
              onChange={(e) => updateField('pdf_show_watermark', e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-emerald-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-700 block">إظهار علامة مائية</span>
              <span className="text-[10px] text-slate-500">مفيد للمسودات</span>
            </div>
          </label>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نص العلامة المائية
            </label>
            <input
              type="text"
              value={settings.pdf_watermark_text ?? ''}
              onChange={(e) => updateField('pdf_watermark_text', e.target.value)}
              maxLength={100}
              disabled={!settings.pdf_show_watermark}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* أرقام الصفحات */}
        <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={!!settings.pdf_show_page_numbers}
            onChange={(e) => updateField('pdf_show_page_numbers', e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-xs font-bold text-slate-700">إظهار أرقام الصفحات</span>
        </label>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الطباعة'}
          </button>
        </div>
      </div>
    </div>
  );
};