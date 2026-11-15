import React from 'react';
import { Hash, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

interface NumberingSettings {
  numbering_purchase_order_prefix: string;
  numbering_sales_order_prefix: string;
  numbering_payment_receipt_prefix: string;
  numbering_payment_voucher_prefix: string;
  numbering_expense_prefix: string;
  numbering_return_prefix: string;
  numbering_journal_prefix: string;
  numbering_padding: number;
  numbering_reset_yearly: boolean;
}

const DEFAULTS: NumberingSettings = {
  numbering_purchase_order_prefix: 'PO-',
  numbering_sales_order_prefix: 'SO-',
  numbering_payment_receipt_prefix: 'REC-',
  numbering_payment_voucher_prefix: 'PAY-',
  numbering_expense_prefix: 'EXP-',
  numbering_return_prefix: 'RET-',
  numbering_journal_prefix: 'JE-',
  numbering_padding: 4,
  numbering_reset_yearly: false,
};

const PREFIX_FIELDS: Array<{
  key: keyof NumberingSettings;
  label: string;
  example: string;
}> = [
  { key: 'numbering_purchase_order_prefix', label: 'أوامر الشراء', example: 'PO-' },
  { key: 'numbering_sales_order_prefix', label: 'أوامر البيع', example: 'SO-' },
  { key: 'numbering_payment_receipt_prefix', label: 'سندات القبض', example: 'REC-' },
  { key: 'numbering_payment_voucher_prefix', label: 'سندات الصرف', example: 'PAY-' },
  { key: 'numbering_expense_prefix', label: 'المصروفات', example: 'EXP-' },
  { key: 'numbering_return_prefix', label: 'المرتجعات', example: 'RET-' },
  { key: 'numbering_journal_prefix', label: 'القيود اليومية', example: 'JE-' },
];

export const NumberingSection: React.FC = () => {
  const {
    settings, loading, saving, error, success, updateField, save, reload,
  } = useSettingsSection<NumberingSettings>(DEFAULTS, Object.keys(DEFAULTS) as any);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل إعدادات الترقيم..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">إعدادات الترقيم</h3>
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
        <p className="text-xs text-slate-600 leading-relaxed p-3 bg-sky-50 border border-sky-200 rounded-xl">
          بادئات أرقام المستندات. تُستخدم عند إنشاء كل مستند جديد.
          لا تغيّر البادئة بعد وجود مستندات بنفس النوع إلا إذا كنت تعرف ما تفعل.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREFIX_FIELDS.map(({ key, label, example }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
              <input
                type="text"
                value={(settings as any)[key] ?? ''}
                onChange={(e) => updateField(key, e.target.value as any)}
                maxLength={10}
                dir="ltr"
                placeholder={example}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عدد الأرقام (الحشو)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.numbering_padding ?? 4}
              onChange={(e) => updateField('numbering_padding', Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              مثال: 4 → 0001 | 6 → 000001
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 h-full">
              <input
                type="checkbox"
                checked={!!settings.numbering_reset_yearly}
                onChange={(e) => updateField('numbering_reset_yearly', e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  إعادة الترقيم سنوياً
                </span>
                <span className="text-[10px] text-slate-500">
                  يبدأ التسلسل من جديد في كل سنة مالية
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الترقيم'}
          </button>
        </div>
      </div>
    </div>
  );
};