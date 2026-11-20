// pages/settings/sections/FixedAssetsSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Hash,
  Calculator,
} from 'lucide-react';
import { settingsApi } from '../../../api/settingsApi';
import { useAuth } from '../../../context/AuthContext';
import type { DepreciationMethod } from '../../../types/fixedAssets';

export const FixedAssetsSection: React.FC = () => {
  const { hasPermission } = useAuth();

  const [faEnabled, setFaEnabled] = useState(true);
  const [defaultMethod, setDefaultMethod] = useState<DepreciationMethod>('straight_line');
  const [autoPostDepreciation, setAutoPostDepreciation] = useState(true);
  const [assetPrefix, setAssetPrefix] = useState('AST-');
  const [assetPadding, setAssetPadding] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await settingsApi.getAll();
      setFaEnabled(all.fa_enabled ?? true);
      setDefaultMethod(
        all.fa_default_depreciation_method === 'declining_balance' ||
          all.fa_default_depreciation_method === 'units_of_production'
          ? all.fa_default_depreciation_method
          : 'straight_line'
      );
      setAutoPostDepreciation(all.fa_auto_post_depreciation ?? true);
      setAssetPrefix(all.numbering_asset_prefix ?? 'AST-');
      setAssetPadding(Number(all.numbering_asset_padding ?? 5));
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل إعدادات الأصول الثابتة');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await settingsApi.updateMany({
        fa_enabled: faEnabled,
        numbering_asset_prefix: assetPrefix,
        numbering_asset_padding: Number(assetPadding),
        fa_default_depreciation_method: defaultMethod,
        fa_auto_post_depreciation: autoPostDepreciation,
      });
      setSuccess('✅ تم حفظ إعدادات الأصول الثابتة بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const preview = (prefix: string, padding: number): string => {
    const safePad = Math.max(1, Math.min(10, Number(padding) || 5));
    return `${prefix}${String(1).padStart(safePad, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">إعدادات الأصول الثابتة</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تفعيل الوحدة، طريقة الإهلاك الافتراضية، الترحيل المحاسبي، وترقيم الأصول
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-gradient-to-l from-emerald-50 to-white border border-emerald-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-black text-slate-900">تفعيل وحدة الأصول الثابتة</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                التحكم في تشغيل مهام الإهلاك التلقائي والعمليات المرتبطة بالأصول
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={faEnabled}
            onChange={(e) => setFaEnabled(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">الإهلاك والقيود المحاسبية</h4>
        </div>

        <div className="max-w-xs">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            طريقة الإهلاك الافتراضية
          </label>
          <select
            value={defaultMethod}
            onChange={(e) => setDefaultMethod(e.target.value as DepreciationMethod)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="straight_line">القسط الثابت (Straight Line)</option>
            <option value="declining_balance">الرصيد المتناقص (Declining Balance)</option>
            <option value="units_of_production">وحدات الإنتاج (Units of Production)</option>
          </select>
        </div>

        <label className="flex items-center justify-between cursor-pointer pt-1">
          <div>
            <span className="block text-xs font-bold text-slate-900">ترحيل قيود الإهلاك تلقائياً</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              ترحيل القيد المحاسبي مباشرة عند تشغيل إهلاك الفترة
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoPostDepreciation}
            onChange={(e) => setAutoPostDepreciation(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
          />
        </label>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Hash className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900">ترقيم الأصول الثابتة</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">بادئة رقم الأصل</label>
            <input
              type="text"
              maxLength={10}
              value={assetPrefix}
              onChange={(e) => setAssetPrefix(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">عدد الأصفار</label>
            <input
              type="number"
              min={1}
              max={10}
              value={assetPadding}
              onChange={(e) => setAssetPadding(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
            />
          </div>
        </div>
        <span className="text-[11px] text-slate-600 font-mono block">
          المثال: {preview(assetPrefix, assetPadding)}
        </span>
      </div>

      {hasPermission('settings.update') && (
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
};