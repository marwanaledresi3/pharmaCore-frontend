import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { Currency, ExchangeRate } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export const CurrenciesPage: React.FC = () => {
  const { company, isOwner } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Currency Modal
  const [isAddCurOpen, setIsAddCurOpen] = useState(false);
  const [curCode, setCurCode] = useState('');
  const [curName, setCurName] = useState('');
  const [curSymbol, setCurSymbol] = useState('');

  // Add Exchange Rate Modal
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [exchangeRateValue, setExchangeRateValue] = useState<number | string>('');
  const [rateDate, setRateDate] = useState(new Date().toISOString().slice(0, 10));

  // Converter tool
  const [convertAmount, setConvertAmount] = useState<number | string>(100);
  const [convertCurrencyId, setConvertCurrencyId] = useState('');
  const [convertResult, setConvertResult] = useState<any>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [curRes, rateRes] = await Promise.all([
        companyApi.listCurrencies(),
        companyApi.listExchangeRates(),
      ]);
      setCurrencies(curRes);
      setRates(rateRes);
      if (curRes.length > 0 && !convertCurrencyId) {
        setConvertCurrencyId(curRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات العملات وأسعار الصرف');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCurSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curCode.trim() || !curName.trim()) {
      setFormError('رمز العملة (3 أحرف) واسم العملة مطلوبان');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await companyApi.createCurrency({
        code: curCode.trim().toUpperCase(),
        name: curName.trim(),
        symbol: curSymbol.trim() || undefined,
      });
      setIsAddCurOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة العملة');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrencyId || !exchangeRateValue) {
      setFormError('يرجى اختيار العملة وإدخال سعر الصرف');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await companyApi.createExchangeRate({
        currency_id: selectedCurrencyId,
        rate: Number(exchangeRateValue),
        rate_date: rateDate,
      });
      setIsAddRateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل تسجيل سعر الصرف');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertCurrencyId || !convertAmount) return;
    setConvertLoading(true);
    try {
      const res = await companyApi.convertCurrency({
        amount: Number(convertAmount),
        currency_id: convertCurrencyId,
      });
      setConvertResult(res);
    } catch (err: any) {
      alert(err.message || 'فشل تحويل العملة');
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">العملات وأسعار الصرف</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة العملات الأجنبية، أسعار التحويل المعتمدة، وسجل التقلبات اليومية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCurCode('');
              setCurName('');
              setCurSymbol('');
              setFormError(null);
              setIsAddCurOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            إضافة عملة
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCurrencyId(currencies[0]?.id || '');
              setExchangeRateValue('');
              setRateDate(new Date().toISOString().slice(0, 10));
              setFormError(null);
              setIsAddRateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            تحديث سعر الصرف
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {/* Converter Widget & Base Currency Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Base Currency Card */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">العملة الأساسية للنظام</span>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black text-slate-900 font-mono">
                {company?.currency_code || 'YER'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                جميع الحسابات، القوائم المالية، والتقارير تُحسب بهذه العملة.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Live Currency Converter */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            حاسبة تحويل العملات الفورية
          </h3>
          <form onSubmit={handleConvert} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">تحويل من عملة</label>
              <select
                value={convertCurrencyId}
                onChange={(e) => setConvertCurrencyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={convertLoading}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
              >
                {convertLoading ? 'حساب...' : 'احتساب القيمة'}
              </button>
            </div>
          </form>

          {convertResult && (
            <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex justify-between items-center font-mono font-bold">
              <span>القيمة المعادلة بالعملة الأساسية:</span>
              <span className="text-base text-emerald-700">
                {Number(convertResult.converted_amount || convertResult.amount || 0).toLocaleString()}{' '}
                {company?.currency_code || 'YER'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Rates Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">سجل أسعار الصرف الحالية</h3>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message="جاري جلب أسعار الصرف..." fullHeight />
        ) : rates.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">لا توجد أسعار صرف مسجلة حالياً</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-4">العملة</th>
                  <th className="py-2.5 px-4">الرمز</th>
                  <th className="py-2.5 px-4 text-center">سعر الصرف مقابل العملة الأساسية</th>
                  <th className="py-2.5 px-4 text-center">تاريخ السريان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.currency_name || 'عملة أجنبية'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {r.currency_code}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      1 {r.currency_code} = {Number(r.rate).toLocaleString()}{' '}
                      {company?.currency_code || 'YER'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">
                      {r.rate_date ? String(r.rate_date).slice(0, 10) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Currency Modal */}
      <Modal isOpen={isAddCurOpen} onClose={() => setIsAddCurOpen(false)} title="إضافة عملة جديدة">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddCurSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز العملة (3 أحرف) *</label>
            <input
              type="text"
              required
              maxLength={3}
              value={curCode}
              onChange={(e) => setCurCode(e.target.value.toUpperCase())}
              placeholder="USD, SAR, EUR"
              dir="ltr"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم العملة *</label>
            <input
              type="text"
              required
              value={curName}
              onChange={(e) => setCurName(e.target.value)}
              placeholder="مثال: دولار أمريكي، ريال سعودي"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الرمز المختصر</label>
            <input
              type="text"
              value={curSymbol}
              onChange={(e) => setCurSymbol(e.target.value)}
              placeholder="$, ر.س, €"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddCurOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ العملة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Rate Modal */}
      <Modal isOpen={isAddRateOpen} onClose={() => setIsAddRateOpen(false)} title="تسجيل وتحديث سعر الصرف">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddRateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
            <select
              required
              value={selectedCurrencyId}
              onChange={(e) => setSelectedCurrencyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              سعر الصرف مقابل {company?.currency_code || 'YER'} *
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              required
              value={exchangeRateValue}
              onChange={(e) => setExchangeRateValue(e.target.value)}
              placeholder="مثال: 535.5"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ سريان السعر *</label>
            <input
              type="date"
              required
              value={rateDate}
              onChange={(e) => setRateDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddRateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              {formLoading ? 'جاري الحفظ...' : 'تأكيد السعر'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
