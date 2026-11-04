import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package, CheckCircle2, AlertCircle, RefreshCw, Lock,
  Building2, ArrowRight, ShieldCheck, FileText,
} from 'lucide-react';
import { ordersApi, DeliveryTokenPreview } from '../api/ordersApi';
import { useAuth } from '../context/AuthContext';

export const DeliveryConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const token = searchParams.get('token') || '';

  const [preview, setPreview] = useState<DeliveryTokenPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!token) {
      setError('رابط QR غير صالح — لا يوجد token');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.previewDeliveryToken(token);
      setPreview(data);
      if (data.delivery_token.used_at) {
        setError('تم استخدام رمز التسليم مسبقاً');
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر التحقق من رمز التسليم');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handleConfirm = async () => {
    if (!token) return;
    if (!window.confirm('هل أنت متأكد من تأكيد استلام البضاعة؟ سيتم استلام المخزون وتوليد الفواتير والقيود.')) return;

    setActionLoading(true);
    try {
      await ordersApi.confirmPurchaseOrderByToken(token);
      setSuccess(true);
      setTimeout(() => navigate('/purchase-orders'), 2000);
    } catch (err: any) {
      window.alert(err?.message || 'فشل تأكيد التسليم');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">جاري التحقق من رمز التسليم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2">تعذر فتح رابط التسليم</h1>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button onClick={() => navigate('/purchase-orders')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl">
            <ArrowRight className="w-4 h-4" /> رجوع للطلبات
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-emerald-900 mb-2">تم الاستلام بنجاح</h1>
          <p className="text-sm text-slate-600 mb-6">تم استلام المخزون وتوليد الفواتير والقيود.</p>
          <p className="text-xs text-slate-500">جاري التحويل...</p>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  const order = preview.order;

  // إذا لم يكن المستخدم مسجلاً، يجب عليه تسجيل الدخول أولاً
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2">تسجيل الدخول مطلوب</h1>
          <p className="text-sm text-slate-600 mb-6">
            لتأكيد استلام الطلب <span className="font-mono font-bold">PO#{order.order_number}</span>، يرجى تسجيل الدخول بحساب شركة المشتري.
          </p>
          <button onClick={() => navigate(`/login?redirect=/deliveries/confirm?token=${encodeURIComponent(token)}`)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl">
            <ArrowRight className="w-4 h-4" /> تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">تأكيد استلام الطلب</h1>
          <p className="text-sm text-slate-600 mt-1">راجع التفاصيل ثم أكّد الاستلام</p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">رقم الطلب</p>
                <p className="font-mono font-black text-slate-900 text-lg">PO#{order.order_number}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">الإجمالي</p>
                <p className="font-mono font-black text-emerald-700 text-lg">{Number(order.total).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4 text-xs border-b border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">المورد</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800">{preview.supplier_company_name || '—'}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">المشتري</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800">{preview.buyer_company_name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">البنود ({preview.items.length})</h3>
            <div className="space-y-2">
              {preview.items.map((it) => (
  <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
    <div>
      <p className="text-xs font-bold text-slate-800">{it.product_name}</p>
      {it.sku && <p className="text-[10px] text-slate-400 font-mono">{it.sku}</p>}
    </div>
    <div className="text-left">
      <p className="text-xs text-slate-600 font-mono">
        {Number(it.quantity)} × {Number(it.unit_price).toFixed(2)}
      </p>
      <p className="text-sm font-black text-slate-900 font-mono">
        {Number(it.line_total).toFixed(2)}
      </p>
    </div>
  </div>
))}
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <p>هذا الرمز موقّع رقمياً وصالح مرة واحدة فقط. لن تتمكن من استخدامه مجدداً بعد التأكيد.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate('/purchase-orders')}
            className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            إلغاء
          </button>
          <button onClick={handleConfirm} disabled={actionLoading}
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50">
            <CheckCircle2 className="w-5 h-5" />
            {actionLoading ? 'جاري التأكيد...' : 'تأكيد الاستلام'}
          </button>
        </div>
      </div>
    </div>
  );
};