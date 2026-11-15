import React, { useState, useEffect } from 'react';
import {
  Building2, Save, CheckCircle, RefreshCw, Upload, FileImage,
  Trash2, Percent, Info,
} from 'lucide-react';
import { companyApi } from '../../../api/companyApi';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { useAuth } from '../../../context/AuthContext';

export const CompanyProfileSection: React.FC = () => {
  const { refreshUser } = useAuth();

  // ═══ Data State ═══
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Company fields
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultMarkup, setDefaultMarkup] = useState<number>(20);
  const [saving, setSaving] = useState(false);

  // Logo (منفصل)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);

  // ═══ Load ═══
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const comp = await companyApi.getCurrent();
      setName(comp.name || '');
      setNameEn(comp.name_en || '');
      setLogoUrl(comp.logo_url || null);
      setTaxNumber(comp.tax_number || '');
      setAddress(comp.address || '');
      setPhone(comp.phone || '');
      setEmail(comp.email || '');
      setWebsite(comp.website || '');
      setDefaultMarkup(comp.default_markup_percentage ?? 20);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل بيانات المنشأة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══ Save Company Data ═══
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
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
      setSuccess('تم حفظ بيانات المنشأة بنجاح');
      await refreshUser();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'تعذر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  // ═══ Logo Upload ═══
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('حجم الشعار يجب أن يكون أقل من 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('يجب اختيار ملف صورة');
      return;
    }

    setLogoUploading(true);
    setLogoError(null);
    setLogoSuccess(null);

    try {
      const result = await companyApi.updateLogo(file);
      const newUrl =
        (result as any)?.logo_url ??
        (result as any)?.data?.logo_url ??
        null;
      setLogoUrl(newUrl);
      setLogoSuccess('تم رفع الشعار بنجاح');
      await refreshUser();
      setTimeout(() => setLogoSuccess(null), 4000);
    } catch (err: any) {
      setLogoError(err?.message || 'فشل رفع الشعار');
    } finally {
      setLogoUploading(false);
    }
  };

  // ═══ Logo Delete ═══
  const handleDeleteLogo = async () => {
    if (!window.confirm('هل تريد حذف الشعار؟')) return;
    setLogoDeleting(true);
    setLogoError(null);
    try {
      await companyApi.updateCurrent({ logo_url: null });
      setLogoUrl(null);
      setLogoSuccess('تم حذف الشعار');
      await refreshUser();
      setTimeout(() => setLogoSuccess(null), 3000);
    } catch (err: any) {
      setLogoError(err?.message || 'فشل حذف الشعار');
    } finally {
      setLogoDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner message="جاري تحميل بيانات المنشأة..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ Logo Card ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <FileImage className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">شعار الشركة</h3>
        </div>

        {logoError && <ErrorAlert message={logoError} />}
        {logoSuccess && (
          <div className="mb-3 flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {logoSuccess}
          </div>
        )}

        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
            {logoUploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-slate-500">جاري الرفع</span>
              </div>
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="company logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FileImage className="w-8 h-8 text-slate-300" />
                <span className="text-[10px] text-slate-400">لا يوجد</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <label
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer ${
                logoUploading
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
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
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-50"
              >
                {logoDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {logoDeleting ? 'جاري الحذف...' : 'حذف الشعار'}
              </button>
            )}

            <p className="text-[10px] text-slate-500 pt-1">
              PNG / JPG / SVG / WebP — حد أقصى 2MB
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Company Data Card ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">البيانات القانونية</h3>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </button>
        </div>

        {error && <ErrorAlert message={error} />}
        {success && (
          <div className="mb-3 flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {success}
          </div>
        )}

        <form onSubmit={handleSaveCompany} className="space-y-4">
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                dir="ltr"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرقم الضريبي
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                dir="ltr"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* نسبة markup */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              نسبة الزيادة الافتراضية على سعر الشراء
            </label>
            <div className="relative w-full md:w-64">
              <input
                type="number"
                min={0}
                max={1000}
                step="0.01"
                value={defaultMarkup}
                onChange={(e) => setDefaultMarkup(Number(e.target.value))}
                className="w-full px-3 py-2 pr-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                %
              </span>
            </div>
            <div className="mt-2 flex items-start gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-sky-800 leading-relaxed">
                تُستخدم لحساب سعر البيع تلقائياً من سعر الشراء. مثال: 20% على منتج بـ100 = 120.
                يمكن تجاوزها لكل منتج على حدة.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};