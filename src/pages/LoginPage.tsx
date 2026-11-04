import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Building, User, ArrowLeft, Pill, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
const searchParams = new URLSearchParams(window.location.search);
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register company state
  const [companyName, setCompanyName] = useState('');
  const [companyNameEnglish, setCompanyNameEnglish] = useState('');
  const [currencyCode, setCurrencyCode] = useState('YER');
  const [taxNumber, setTaxNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) {
    setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }

  setError(null);
  setIsLoading(true);
  try {
    await login(email.trim(), password);

    // ← أضف: بعد نجاح الدخول، تحقق من ?redirect=
    // استبدل في handleLoginSubmit:
const redirect = searchParams.get('redirect');
if (redirect && redirect.startsWith('/')) {
  window.location.href = redirect;
}
  } catch (err: any) {
    setError(err.message || 'فشل تسجيل الدخول. تحقق من بيانات الدخول.');
  } finally {
    setIsLoading(false);
  }
};

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyNameEnglish || !ownerName || !ownerEmail || !ownerPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (ownerPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await authApi.registerCompany({
        company: {
          name: companyName.trim(),
          name_english: companyNameEnglish.trim(),
          currency_code: currencyCode.trim().toUpperCase(),
          tax_number: taxNumber.trim() || undefined,
          address: companyAddress.trim() || undefined,
        },
        owner: {
          name: ownerName.trim(),
          email: ownerEmail.trim(),
          password: ownerPassword,
        },
      });

      setRegSuccess('تم إنشاء حساب الشركة بنجاح! يمكنك الآن تسجيل الدخول.');
      setEmail(ownerEmail);
      setPassword('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الشركة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans"
    >
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20 text-white font-black text-2xl">
            <Pill className="w-8 h-8" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
            PharmaCore ERP
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            النظام الصيدلاني لإدارة المبيعات، المخزون، والربط التجاري B2B
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 pb-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-sm font-bold border-b-2 transition ${
                mode === 'login'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setRegSuccess(null);
              }}
              className={`flex-1 text-center py-2 text-sm font-bold border-b-2 transition ${
                mode === 'register'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              تسجيل شركة جديدة
            </button>
          </div>

          {regSuccess && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {error && <ErrorAlert error={error} className="mb-6" />}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" message="" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الشركة / الصيدلية *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: صيدلية الأمل المركزية"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الشركة بالانجليزية / الصيدلية *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyNameEnglish}
                    onChange={(e) => setCompanyNameEnglish(e.target.value)}
                    placeholder="مثال: Al-Amal Central Pharmacy"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    العملة الأساسية
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الرقم الضريبي
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  العنوان
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="المدينة، الشارع"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="block text-xs font-bold text-emerald-400 mb-2">
                  بيانات حساب المالك (مدير النظام)
                </span>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="البريد الإلكتروني"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="كلمة المرور (8 أحرف كحد أدنى)"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" message="" />
                    <span>جاري التأسيس والتهيئة...</span>
                  </>
                ) : (
                  <span>تأسيس الشركة والدخول</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>ربط مباشر مع قاعدة بيانات PharmaCore الرسمية على السحابة</p>
        </div>
      </div>
    </div>
  );
};
