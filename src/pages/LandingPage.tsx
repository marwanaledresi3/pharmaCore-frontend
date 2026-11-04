
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardApi,
  type PublicStats,
} from '../api/dashboardApi';
import { AboutSection } from '../components/sections/AboutSection';
import { CompanyPostsSection } from '../components/sections/CompanyPostsSection';
import { ProductsSection } from '../components/sections/ProductsSection';

export default function LandingPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    dashboardApi.publicStats().then(setStats).catch(() => {});
  }, []);

  const features = [
    {
      icon: '🧾',
      title: 'فواتير ومبيعات',
      desc: 'إصدار فواتير ومتابعة المدفوعات والمستحقات.',
      color: 'emerald',
    },
    {
      icon: '📦',
      title: 'مخزون ذكي',
      desc: 'تتبع الدفعات وتواريخ الانتهاء والحد الأدنى.',
      color: 'blue',
    },
    {
      icon: '🏢',
      title: 'فروع متعددة',
      desc: 'ربط الفروع بالمستودعات وإدارة الموظفين.',
      color: 'indigo',
    },
    {
      icon: '🧮',
      title: 'محاسبة كاملة',
      desc: 'قيود يومية وضريبة القيمة المضافة تلقائياً.',
      color: 'amber',
    },
    {
      icon: '📊',
      title: 'تقارير فورية',
      desc: 'مؤشرات لحظية ولوحات تحكم قابلة للتخصيص.',
      color: 'purple',
    },
    {
      icon: '🔒',
      title: 'أمان وصلاحيات',
      desc: 'أدوار دقيقة وسجل تدقيق لكل عملية.',
      color: 'rose',
    },
  ];

  const colorStyles: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white border-indigo-200',
    amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white border-amber-200',
    purple: 'bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white border-purple-200',
    rose: 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white border-rose-200',
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              PH
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">
                PharmaCore
              </div>
              <div className="text-[10px] text-slate-500">
                Pharmaceutical ERP & B2B
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition"
            >
              تسجيل الدخول
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition"
            >
              ابدأ مجاناً
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-28 text-center">

          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            نظام إدارة الصيدليات وسلاسل الإمداد
          </span>

          <h1 className="text-4xl md:text-6xl font-black leading-tight text-slate-900">
            أدِر أعمالك الدوائية
            <span className="block mt-3 text-emerald-600">
              من مكان واحد
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-600 mt-6 max-w-3xl mx-auto leading-relaxed">
            منصة متكاملة لإدارة المبيعات والمشتريات والمخزون والمحاسبة
            والشركات وسوق B2B الدوائي، كل ذلك في نظام واحد آمن وذكي.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
            >
              إنشاء حساب شركة
            </Link>

            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 hover:border-slate-400 transition"
            >
              تسجيل الدخول
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span>✓ إدارة مالية متكاملة</span>
            <span>✓ مخزون ذكي</span>
            <span>✓ شبكة B2B دوائية</span>
            <span>✓ تقارير لحظية</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-700">
            إمكانيات المنصة
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            كل ما تحتاجه لإدارة أعمالك
          </h2>
          <p className="text-slate-500 mt-3">
            أدوات متكاملة تساعدك على إدارة عملياتك بكفاءة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border transition duration-300 ${colorStyles[f.color]}`}>
                {f.icon}
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-800">
                {f.title}
              </h3>

              <p className="text-sm text-slate-500 mt-2 leading-7">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Public Statistics */}
      {stats && (
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-14">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-slate-900">
                PharmaCore بالأرقام
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                مؤشرات المنصة الحالية
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-black text-emerald-600">
                  {stats.companies_count}
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  شركة تستخدم النظام
                </p>
              </div>

              <div>
                <p className="text-4xl font-black text-blue-600">
                  {stats.global_products_count}
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  منتج في الكتالوج العام
                </p>
              </div>

              <div>
                <p className="text-4xl font-black text-indigo-600">
                  {stats.posts_count}
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  منشور عام
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <span className="text-xs font-bold text-purple-700">
            الكتالوج الدوائي
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            اكتشف المنتجات الدوائية
          </h2>
        </div>
        <ProductsSection limit={8} showFilters title="🩺 كتالوج المنتجات الدوائية" />
      </section>

      {/* Company Posts */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-slate-200">
        <div className="mb-8">
          <span className="text-xs font-bold text-blue-700">
            مجتمع الشركات
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            آخر منشورات الشركات
          </h2>
        </div>
        <CompanyPostsSection limit={3} />
      </section>

      {/* About */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <AboutSection variant="landing" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20 px-4 text-center">
        <h2 className="text-3xl font-black">
          جاهز لتطوير أعمالك؟
        </h2>
        <p className="text-slate-300 mt-3">
          أنشئ شركتك وابدأ إدارة عملياتك الدوائية من منصة واحدة.
        </p>
        <Link
          to="/register"
          className="inline-block mt-7 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition shadow-lg"
        >
          إنشاء حساب شركة
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-center text-xs py-7">
        © {new Date().getFullYear()} PharmaCore — جميع الحقوق محفوظة
      </footer>

    </div>
  );
}