import { useEffect, useMemo, useState } from 'react';
import { publicApi, type GlobalProduct } from '../../api/publicApi';

interface Props {
  /** عدد العناصر المعروضة (limit) — افتراضي 8 في الداشبورد، 12 في Landing */
  limit?: number;
  /** هل نعرض بحث وتصفية؟ (Landing: نعم، Dashboard: نعم لكن أصغر) */
  showFilters?: boolean;
  /** عنوان القسم */
  title?: string;
  /** نص فرعي */
  subtitle?: string;
}

export function ProductsSection({
  limit = 8,
  showFilters = true,
  title = '🩺 كتالوج المنتجات',
  subtitle = 'تصفّح مجموعة من الأدوية والمنتجات المتاحة في النظام',
}: Props) {
  const [items, setItems] = useState<GlobalProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // debounce للبحث
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // التصنيفات
  useEffect(() => {
    publicApi.categories().then(setCategories).catch(() => {});
  }, []);

  // جلب المنتجات
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicApi
      .products({ search, category: category || undefined, page: 1, limit })
      .then((res) => { if (!cancelled) setItems(res.items); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'فشل تحميل المنتجات'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, category, limit]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث باسم الدواء أو المادة الفعالة..."
            className="border rounded-lg px-3 py-1.5 text-sm w-full md:w-72"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد منتجات مطابقة</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: GlobalProduct }) {
  const initials = useMemo(
    () => product.name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join(''),
    [product.name]
  );

  return (
    <article className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition">
      {/* صورة / بديل */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 to-blue-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-black text-emerald-600/40">{initials}</span>
          </div>
        )}
        {product.is_verified && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs bg-white/90 text-emerald-700 border border-emerald-200">
            ✓ موثّق
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1" title={product.name}>
          {product.name}
        </h3>
        {product.scientific_name && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.scientific_name}</p>
        )}
        {product.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {product.category && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700">
              {product.category}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
            {product.unit}
          </span>
        </div>
      </div>
    </article>
  );
}