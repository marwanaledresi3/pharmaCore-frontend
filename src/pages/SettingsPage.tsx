import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  UserPlus,
  Save,
  CheckCircle,
  RefreshCw,
  Upload,
  FileImage,
  Trash2,
  Percent,
  Info,
  Ruler,
} from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { Currency } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';
import { UnitsTab } from './settings/UnitsTab';  // مسار جديد
export const SettingsPage: React.FC = () => {
  const { refreshUser } = useAuth();
 const [activeTab, setActiveTab] = useState<'company' | 'currency' | 'portal' | 'units'>('company');

  // ═══════════════════════════════════════════════════════════
  // 1) COMPANY DATA (بيانات نصية فقط)
  // ═══════════════════════════════════════════════════════════
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultMarkup, setDefaultMarkup] = useState<number>(20);

  // ═══════════════════════════════════════════════════════════
  // 2) LOGO (منفصل تماماً عن البيانات)
  // ═══════════════════════════════════════════════════════════
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // 3) CURRENCY
  // ═══════════════════════════════════════════════════════════
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencySuccess, setCurrencySuccess] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // 4) PORTAL USER
  // ═══════════════════════════════════════════════════════════
  const [portalType, setPortalType] = useState<'customer' | 'supplier'>('customer');
  const [portalName, setPortalName] = useState('');
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalPhone, setPortalPhone] = useState('');
  const [portalAddress, setPortalAddress] = useState('');
  const [portalTaxNumber, setPortalTaxNumber] = useState('');
  const [portalCreditLimit, setPortalCreditLimit] = useState<number>(0);
  const [savingPortal, setSavingPortal] = useState(false);
  const [portalSuccess, setPortalSuccess] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════
  const loadData = async () => {
    setLoadingCompany(true);
    setCompanyError(null);
    try {
      const [comp, currList] = await Promise.all([
        companyApi.getCurrent(),
        companyApi.listCurrencies(),
      ]);

      setName(comp.name || '');
      setNameEn(comp.name_en || '');
      setLogoUrl(comp.logo_url || null);
      setTaxNumber(comp.tax_number || '');
      setAddress(comp.address || '');
      setPhone(comp.phone || '');
      setEmail(comp.email || '');
      setWebsite(comp.website || '');
      setDefaultMarkup(comp.default_markup_percentage ?? 20);
      setSelectedCurrencyId(comp.currency_id || '');
      setCurrencies(currList || []);
    } catch (err: any) {
      setCompanyError(err.message || 'تعذر تحميل بيانات المنشأة');
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HANDLER: حفظ بيانات الشركة (نصية فقط، بدون الشعار)
  // ═══════════════════════════════════════════════════════════
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setCompanySuccess(null);
    setCompanyError(null);

    try {
      await companyApi.updateCurrent({
        name: name.trim(),
        name_en: nameEn.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        default_markup_percentage: defaultMarkup,
      });
      setCompanySuccess('تم حفظ بيانات المنشأة بنجاح');
      await refreshUser();
      setTimeout(() => setCompanySuccess(null), 4000);
    } catch (err: any) {
      setCompanyError(err.message || 'تعذر حفظ بيانات المنشأة');
    } finally {
      setSavingCompany(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLER: رفع الشعار (فوري، مستقل)
  // ═══════════════════════════════════════════════════════════
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // نعيد ضبط القيمة حتى يتمكن المستخدم من اختيار نفس الملف مرة أخرى
    e.target.value = '';

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('حجم الشعار يجب أن يكون أقل من 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLogoError('يجب اختيار ملف صورة (PNG, JPG, SVG, WebP)');
      return;
    }

    setLogoUploading(true);
    setLogoError(null);
    setLogoSuccess(null);

    try {
      const result = await companyApi.updateLogo(file);
      const newLogoUrl =
        (result as any)?.logo_url ??
        (result as any)?.data?.logo_url ??
        null;

      setLogoUrl(newLogoUrl);
      setLogoSuccess('تم رفع الشعار بنجاح');
      await refreshUser();
      setTimeout(() => setLogoSuccess(null), 4000);
    } catch (err: any) {
      setLogoError(err?.message || 'فشل رفع الشعار');
    } finally {
      setLogoUploading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLER: حذف الشعار
  // ═══════════════════════════════════════════════════════════
  const handleDeleteLogo = async () => {
    if (!window.confirm('هل تريد حذف شعار الشركة؟')) return;

    setLogoDeleting(true);
    setLogoError(null);
    setLogoSuccess(null);

    try {
      await companyApi.updateCurrent({ logo_url: null });
      setLogoUrl(null);
      setLogoSuccess('تم حذف الشعار');
      await refreshUser();
      setTimeout(() => setLogoSuccess(null), 4000);
    } catch (err: any) {
      setLogoError(err?.message || 'فشل حذف الشعار');
    } finally {
      setLogoDeleting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLER: تغيير العملة
  // ═══════════════════════════════════════════════════════════
  const handleChangeCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrencyId) return;

    setSavingCurrency(true);
    setCurrencySuccess(null);
    setCurrencyError(null);

    try {
      await companyApi.changeBaseCurrency(selectedCurrencyId);
      setCurrencySuccess('تم تغيير العملة الأساسية بنجاح');
      await refreshUser();
      setTimeout(() => setCurrencySuccess(null), 4000);
    } catch (err: any) {
      setCurrencyError(err.message || 'تعذر تغيير العملة الأساسية');
    } finally {
      setSavingCurrency(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLER: إنشاء مستخدم بوابة خارجية
  // ═══════════════════════════════════════════════════════════
  const handleCreatePortalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPortal(true);
    setPortalSuccess(null);
    setPortalError(null);

    try {
      await companyApi.createExternalUser({
        user_type: portalType,
        name: portalName.trim(),
        email: portalEmail.trim(),
        password: portalPassword,
        phone: portalPhone.trim() || undefined,
        address: portalAddress.trim() || undefined,
        tax_number: portalTaxNumber.trim() || undefined,
        credit_limit: portalCreditLimit ? Number(portalCreditLimit) : undefined,
      });

      setPortalSuccess(
        `تم إنشاء حساب بوابة ${portalType === 'customer' ? 'العميل' : 'المورد'} بنجاح`
      );
      setPortalName('');
      setPortalEmail('');
      setPortalPassword('');
      setPortalPhone('');
      setPortalAddress('');
      setPortalTaxNumber('');
      setPortalCreditLimit(0);
      setTimeout(() => setPortalSuccess(null), 5000);
    } catch (err: any) {
      setPortalError(err.message || 'تعذر إنشاء حساب البوابة');
    } finally {
      setSavingPortal(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6" dir="rtl">
      {/* ─────────────── Header ─────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            إعدادات المنشأة والنظام
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            إدارة الهوية القانونية، الشعار، العملة الأساسية، سياسة التسعير، وبوابات الشركاء
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loadingCompany}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingCompany ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* ─────────────── Tabs ─────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'company'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          بيانات المنشأة
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('currency')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'currency'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          العملة الأساسية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'portal'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          بوابات الشركاء
        </button>
                <button
          type="button"
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'units'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Ruler className="w-4 h-4" />
          وحدات القياس
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 1: بيانات المنشأة + الشعار (منفصلان تماماً)          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'company' && (
        <div className="space-y-6 max-w-3xl">
          {loadingCompany ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12">
              <LoadingSpinner message="جاري تحميل بيانات المنشأة..." />
            </div>
          ) : (
            <>
              {/* ────────── بطاقة 1: الشعار (مستقلة) ────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <FileImage className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">شعار الشركة</h3>
                </div>

                {logoError && <ErrorAlert message={logoError} />}
                {logoSuccess && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {logoSuccess}
                  </div>
                )}

                <div className="flex items-center gap-5">
                  {/* معاينة الشعار */}
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                    {logoUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-slate-500">جاري الرفع...</span>
                      </div>
                    ) : logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="company logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <FileImage className="w-10 h-10 text-slate-300" />
                        <span className="text-[10px] text-slate-400">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex-1 space-y-2">
                    <label
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition ${
                        logoUploading
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {logoUploading ? 'جاري الرفع...' : 'رفع شعار جديد'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        disabled={logoUploading}
                        onChange={handleLogoChange}
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleDeleteLogo}
                        disabled={logoDeleting || logoUploading}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition disabled:opacity-50"
                      >
                        {logoDeleting ? (
                          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {logoDeleting ? 'جاري الحذف...' : 'حذف الشعار'}
                      </button>
                    )}

                    <p className="text-[10px] text-slate-500 pt-1">
                      PNG / JPG / SVG / WebP — حد أقصى 2MB.
                      سيُستخدم في الفواتير والسندات والتقارير.
                    </p>
                  </div>
                </div>
              </div>

              {/* ────────── بطاقة 2: البيانات النصية ────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">البيانات القانونية</h3>
                </div>

                {companyError && <ErrorAlert message={companyError} />}
                {companySuccess && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {companySuccess}
                  </div>
                )}

                <form onSubmit={handleSaveCompany} className="space-y-4">
                  {/* الاسم العربي + الإنجليزي */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الاسم التجاري (عربي) *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="شركة النيل للأدوية"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الاسم التجاري (إنجليزي)
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="Al Nile Pharmaceutical Co."
                        dir="ltr"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* الرقم الضريبي + الهاتف */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الرقم الضريبي (VAT / Tax Number)
                      </label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="300123456789003"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رقم الهاتف
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+967 1 000 000"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* البريد + الموقع */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@company.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الموقع الإلكتروني
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* العنوان */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="صنعاء، شارع الزبيري"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* ✅ نسبة الزيادة الافتراضية (هوامش الربح) */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      نسبة الزيادة الافتراضية على سعر الشراء
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.01"
                        value={defaultMarkup}
                        onChange={(e) => setDefaultMarkup(Number(e.target.value))}
                        className="w-full px-3 py-2 pr-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-sky-800 leading-relaxed">
                        تُستخدم هذه النسبة لحساب سعر البيع تلقائياً من سعر الشراء
                        عند إضافة أي منتج جديد. مثال: إذا كانت النسبة 20%، ومنتج
                        سعر شرائه 100 ريال، فسيُقترح سعر بيعه 120 ريال تلقائياً.
                        يمكنك تجاوزها لكل منتج على حدة.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingCompany}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingCompany ? 'جاري الحفظ...' : 'حفظ البيانات'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 2: العملة الأساسية                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'currency' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            العملة المحاسبية الأساسية للمنشأة
          </h3>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            العملة الأساسية هي العملة التي تُقيَّد بها جميع قيود اليومية،
            القوائم المالية، وسندات القبض والصرف.
          </p>

          {currencyError && <ErrorAlert message={currencyError} />}
          {currencySuccess && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {currencySuccess}
            </div>
          )}

          <form onSubmit={handleChangeCurrency} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اختر العملة الأساسية المعتمدة
              </label>
              <select
                value={selectedCurrencyId}
                onChange={(e) => setSelectedCurrencyId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- حدد عملة --</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) {c.symbol ? `— ${c.symbol}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={savingCurrency || !selectedCurrencyId}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingCurrency ? 'جاري الحفظ...' : 'تثبيت العملة الأساسية'}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 3: بوابات الشركاء                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'portal' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">
              إنشاء حساب ولوج خارجي (بوابة العميل / المورد)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              يتيح هذا الحساب لشركائك تصفح فواتيرهم، متابعة الأرصدة، أو رفع
              عروض الأسعار بصلاحيات محدودة ومحمية.
            </p>
          </div>

          {portalError && <ErrorAlert message={portalError} />}
          {portalSuccess && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {portalSuccess}
            </div>
          )}

          <form onSubmit={handleCreatePortalUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع الشريك *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPortalType('customer')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    portalType === 'customer'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  بوابة عميل (Customer Portal)
                </button>
                <button
                  type="button"
                  onClick={() => setPortalType('supplier')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                    portalType === 'supplier'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  بوابة مورد (Supplier Portal)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الشريك / المفوض *
                </label>
                <input
                  type="text"
                  required
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="صيدلية النخبة أو شركة التوريد"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بريد تسجيل الدخول *
                </label>
                <input
                  type="email"
                  required
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  placeholder="portal@partner.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الأولية *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={portalPhone}
                  onChange={(e) => setPortalPhone(e.target.value)}
                  placeholder="+967 77 000 0000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرقم الضريبي
                </label>
                <input
                  type="text"
                  value={portalTaxNumber}
                  onChange={(e) => setPortalTaxNumber(e.target.value)}
                  placeholder="3000..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحد الائتماني المسموح
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={portalCreditLimit}
                  onChange={(e) => setPortalCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
              <input
                type="text"
                value={portalAddress}
                onChange={(e) => setPortalAddress(e.target.value)}
                placeholder="المدينة، الحي، الشارع"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingPortal}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {savingPortal ? 'جاري الإنشاء...' : 'إنشاء حساب البوابة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};