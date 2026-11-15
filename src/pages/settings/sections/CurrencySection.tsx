import React, { useState, useEffect } from 'react';
import { DollarSign, Save, CheckCircle, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { companyApi } from '../../../api/companyApi';
import { Currency } from '../../../types';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { useAuth } from '../../../context/AuthContext';

export const CurrencySection: React.FC = () => {
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currentCurrencyId, setCurrentCurrencyId] = useState<string>('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [comp, list] = await Promise.all([
        companyApi.getCurrent(),
        companyApi.listCurrencies(),
      ]);
      setCurrentCurrencyId(comp.currency_id || '');
      setSelectedCurrencyId(comp.currency_id || '');
      setCurrencies(list || []);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل العملات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrencyId || selectedCurrencyId === currentCurrencyId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await companyApi.changeBaseCurrency(selectedCurrencyId);
      setCurrentCurrencyId(selectedCurrencyId);
      setSuccess('تم تغيير العملة الأساسية بنجاح');
      await refreshUser();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'تعذر تغيير العملة الأساسية');
    } finally {
      setSaving(false);
    }
  };

  const currentCurrency = currencies.find((c) => c.id === currentCurrencyId);
  const hasChange = selectedCurrencyId && selectedCurrencyId !== currentCurrencyId;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل بيانات العملة..." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">العملة الأساسية</h3>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      <p className="text-xs text-slate-600 mb-5 leading-relaxed">
        العملة التي تُقيَّد بها كل القيود المحاسبية والقوائم المالية.
        يمكن تغييرها فقط قبل بدء العمل المحاسبي.
      </p>

      {/* العملة الحالية */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-5">
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
          العملة الحالية
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-black text-emerald-900">
            {currentCurrency?.name || '—'}
          </p>
          <span className="text-sm font-bold text-emerald-700 font-mono">
            {currentCurrency?.code} {currentCurrency?.symbol && `(${currentCurrency.symbol})`}
          </span>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      <form onSubmit={handleChange} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اختر العملة الجديدة
          </label>
          <select
            value={selectedCurrencyId}
            onChange={(e) => setSelectedCurrencyId(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) {c.symbol && `— ${c.symbol}`}
              </option>
            ))}
          </select>
        </div>

        {hasChange && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              ⚠️ تحذير: تغيير العملة الأساسية يمنع لاحقاً إذا كانت هناك قيود مرحّلة،
              فواتير، مدفوعات، أو أوامر. تأكد من رغبتك قبل الحفظ.
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-xl">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-sky-800 leading-relaxed">
            بعد بدء العمل، لن تتمكن من التغيير إلا إذا كانت كل الجداول المالية فارغة.
            استخدم <code className="font-mono bg-sky-100 px-1 rounded">/companies/currency-change-check</code> للتحقق أولاً.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || !hasChange}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'تثبيت العملة الأساسية'}
          </button>
        </div>
      </form>
    </div>
  );
};