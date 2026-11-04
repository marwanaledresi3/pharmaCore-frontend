import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  UserPlus,
  Save,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Coins,
  RefreshCw,
  Upload,
  FileImage,
} from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { Company, Currency } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { company, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'currency' | 'portal'>('company');

  // Company Profile Form
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Currency Settings
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencySuccess, setCurrencySuccess] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // External Portal User Form
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
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [nameEn, setNameEn] = useState('');
const [logoUrl, setLogoUrl] = useState<string | null>(null);
const [logoUploading, setLogoUploading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);
const [saveSuccess, setSaveSuccess] = useState(false);
  // Load Company & Currencies
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

  // Update Company Profile
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setCompanySuccess(null);
    setCompanyError(null);

    try {
      await companyApi.updateCurrent({
        name: name.trim(),
        tax_number: taxNumber.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
      });
      setCompanySuccess('تم حفظ بيانات المنشأة بنجاح');
      refreshUser();
    } catch (err: any) {
      setCompanyError(err.message || 'تعذر حفظ بيانات المنشأة');
    } finally {
      setSavingCompany(false);
    }
  };

  // Change Base Currency
  const handleChangeCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrencyId) return;

    setSavingCurrency(true);
    setCurrencySuccess(null);
    setCurrencyError(null);

    try {
      await companyApi.changeBaseCurrency(selectedCurrencyId);
      setCurrencySuccess('تم تغيير العملة الأساسية للنظام بنجاح');
      refreshUser();
    } catch (err: any) {
      setCurrencyError(err.message || 'تعذر تغيير العملة الأساسية');
    } finally {
      setSavingCurrency(false);
    }
  };
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    setSaveError('حجم الشعار يجب أن يكون أقل من 2MB');
    return;
  }

  setLogoUploading(true);
  setSaveError(null);

  try {
    // رفع الصورة إلى API (إن كان موجوداً)
    // أو تحويلها إلى base64 (للتجربة)
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(String(reader.result));
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  } catch (err: any) {
    setSaveError(err?.message || 'فشل رفع الشعار');
    setLogoUploading(false);
  }
};
const handleSaveIdentity = async () => {
  if (!name.trim()) return setSaveError('اسم الشركة مطلوب');

  setIsSaving(true);
  setSaveError(null);
  setSaveSuccess(false);

  try {
    await companyApi.updateLogo(selectedFile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  } catch (err: any) {
    setSaveError(err?.message || 'فشل حفظ هوية الشركة');
  } finally {
    setIsSaving(false);
  }
};
  // Create External Portal User
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
    } catch (err: any) {
      setPortalError(err.message || 'تعذر إنشاء حساب البوابة الخارجية');
    } finally {
      setSavingPortal(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            إعدادات المنشأة والنظام
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            إدارة الهوية القانونية للمنشأة، العملة الأساسية المعتمدة، وبوابات العملاء والموردين
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loadingCompany}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingCompany ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
  <div className="flex items-center gap-2 mb-4">
    <Building2 className="w-5 h-5 text-emerald-600" />
    <h3 className="text-sm font-black text-slate-900">هوية الشركة</h3>
  </div>

  {saveError && <ErrorAlert error={saveError} className="mb-4" />}
  {saveSuccess && (
    <div className="mb-4 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
      ✅ تم حفظ هوية الشركة بنجاح
    </div>
  )}

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* الاسم العربي */}
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        اسم الشركة (بالعربي) *
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="شركة النيل للأدوية"
        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
      />
    </div>

    {/* الاسم الإنجليزي */}
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        اسم الشركة (بالإنجليزي)
      </label>
      <input
        type="text"
        value={nameEn}
        onChange={(e) => setNameEn(e.target.value)}
        placeholder="Al Nile Pharmaceutical Co."
        dir="ltr"
        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
      />
    </div>
  </div>

  {/* الشعار */}
  <div className="mt-4">
    <label className="block text-xs font-bold text-slate-700 mb-2">
      شعار الشركة
    </label>
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
        ) : (
          <FileImage className="w-10 h-10 text-slate-300" />
        )}
      </div>
      <div className="flex-1">
        <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          {logoUploading ? 'جاري الرفع...' : 'رفع شعار'}
         <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }}
/>
        </label>
        <p className="text-[10px] text-slate-500 mt-1">
          PNG / JPG / SVG — حد أقصى 2MB. سيُستخدم في الفواتير والسندات.
        </p>
        {logoUrl && (
          <button
            type="button"
            onClick={() => setLogoUrl(null)}
            className="mt-1 text-[10px] text-rose-600 hover:underline"
          >
            حذف الشعار
          </button>
        )}
      </div>
    </div>
  </div>

  {/* زر الحفظ */}
  <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
    <button
      type="button"
      onClick={handleSaveIdentity}
      disabled={isSaving}
      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
    >
      {isSaving ? 'جاري الحفظ...' : 'حفظ هوية الشركة'}
    </button>
  </div>
</div>

      {/* Tabs */}
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
          الملف القانوني للمنشأة
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
          <Coins className="w-4 h-4" />
          العملة الأساسية للنظام
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
          بوابات الشركاء (Portal)
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COMPANY PROFILE */}
      {/* ============================================================== */}
      {activeTab === 'company' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-3xl">
          {companyError && <ErrorAlert message={companyError} onRetry={loadData} />}

          {companySuccess && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {companySuccess}
            </div>
          )}

          {loadingCompany ? (
            <div className="py-12">
              <LoadingSpinner message="جاري استرجاع بيانات المنشأة..." />
            </div>
          ) : (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم التجاري للمنشأة *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مستودع الأدوية المركزي"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرقم الضريبي (VAT / Tax Number)
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="300123456789003"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف / التواصل
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 11 000 0000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني الرسمي
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@pharmacompany.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العنوان والموقع الجغرافي
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الرياض، طريق الملك فهد"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الإلكتروني</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://pharmacompany.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingCompany ? 'جاري الحفظ...' : 'حفظ تعديلات المنشأة'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BASE CURRENCY */}
      {/* ============================================================== */}
      {activeTab === 'currency' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            العملة المحاسبية الأساسية للمنشأة
          </h3>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            العملة الأساسية هي العملة التي تُقيد بها جميع قيود اليومية، القوائم المالية، وسندات القبض
            والصرف.
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

      {/* ============================================================== */}
      {/* TAB 3: PARTNER EXTERNAL PORTALS */}
      {/* ============================================================== */}
      {activeTab === 'portal' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">
              إنشاء حساب ولوج خارجي (بوابة العميل / المورد)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              يتيح هذا الحساب لشركائك تصفح فواتيرهم، متابعة الأرصدة، أو رفع عروض الأسعار بصلاحيات
              محدودة ومحمية
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
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={portalPhone}
                  onChange={(e) => setPortalPhone(e.target.value)}
                  placeholder="+966 50 000 0000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الضريبي</label>
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
