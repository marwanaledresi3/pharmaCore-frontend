import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { companyApi } from '../../../api/companyApi';
import { ErrorAlert } from '../../../components/common/ErrorAlert';

export const PortalSection: React.FC = () => {
  const [portalType, setPortalType] = useState<'customer' | 'supplier'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await companyApi.createExternalUser({
        user_type: portalType,
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        credit_limit: creditLimit || undefined,
      });

      setSuccess(
        `تم إنشاء حساب بوابة ${portalType === 'customer' ? 'العميل' : 'المورد'} بنجاح`
      );
      // reset
      setName(''); setEmail(''); setPassword('');
      setPhone(''); setAddress(''); setTaxNumber(''); setCreditLimit(0);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'تعذر إنشاء الحساب');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
      <div className="mb-5">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          إنشاء حساب بوابة خارجي
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          حساب وصول محدود للعميل/المورد لتصفح فواتيره وأرصدته.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* النوع */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">نوع الشريك *</label>
          <div className="grid grid-cols-2 gap-3">
            {(['customer', 'supplier'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPortalType(t)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                  portalType === t
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'customer' ? 'بوابة عميل' : 'بوابة مورد'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الاسم *</label>
            <input
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد *</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
            <input
              type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الهاتف</label>
            <input
              type="text" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الضريبي</label>
            <input
              type="text" value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الحد الائتماني
            </label>
            <input
              type="number" min={0} step="any" value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
          <input
            type="text" value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </div>
      </form>
    </div>
  );
};