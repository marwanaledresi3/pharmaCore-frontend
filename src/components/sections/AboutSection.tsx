import { useEffect, useState } from 'react';
import { dashboardApi, type PublicStats } from '../../api/dashboardApi';

interface Props {
  variant?: 'landing' | 'dashboard';
}

export function AboutSection({ variant = 'dashboard' }: Props) {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    dashboardApi.publicStats().then(setStats).catch(() => {});
  }, []);

  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            عن المنصة
          </div>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            PharmaCore ERP — نظام إدارة سلاسل الإمداد الدوائي
          </h2>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            منصة متكاملة تجمع الشركات والموردين والصيدليات في مكان واحد. أدِر الفواتير،
            المخزون، الفروع، والموظفين بواجهة عربية بسيطة وآمنة. مصمّم ليعمل بسرعة،
            ويحفظ بياناتك في قاعدة بيانات علائقية قوية.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-400">
            <span className="px-2 py-1 rounded bg-white/5">🧾 فواتير ومبيعات</span>
            <span className="px-2 py-1 rounded bg-white/5">📦 مخزون ودفعات</span>
            <span className="px-2 py-1 rounded bg-white/5">🧮 محاسبة كاملة</span>
            <span className="px-2 py-1 rounded bg-white/5">🏢 فروع متعددة</span>
            <span className="px-2 py-1 rounded bg-white/5">🔐 أدوار وصلاحيات</span>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 gap-3">
            <StatBlock label="شركة تستخدم النظام" value={stats.companies_count} />
            <StatBlock label="منتج في الكتالوج" value={stats.global_products_count} />
            <StatBlock label="منشور عام" value={stats.posts_count} />
          </div>
        )}
      </div>

      {variant === 'landing' && (
        <p className="text-xs text-slate-500 mt-6 text-center">
          © {new Date().getFullYear()} PharmaCore — جميع الحقوق محفوظة
        </p>
      )}
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="text-2xl font-bold text-emerald-400">
        {new Intl.NumberFormat('ar-SA').format(value)}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}