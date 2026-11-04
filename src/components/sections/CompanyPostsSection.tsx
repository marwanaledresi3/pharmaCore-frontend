import { useEffect, useState } from 'react';
import { publicApi, type CompanyPost } from '../../api/publicApi';

interface Props {
  limit?: number;
  title?: string;
  subtitle?: string;
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString('ar-SA');
}

export function CompanyPostsSection({
  limit = 6,
  title = '📰 منشورات الشركات',
  subtitle = 'آخر الأخبار والإعلانات من الشركات المشاركة في المنصة',
}: Props) {
  const [items, setItems] = useState<CompanyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .posts({ page: 1, limit })
      .then((res) => { if (!cancelled) setItems(res.items); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'فشل تحميل المنشورات'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 animate-pulse space-y-2">
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-5/6 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد منشورات حالياً</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function PostCard({ post }: { post: CompanyPost }) {
  const [expanded, setExpanded] = useState(false);
  const contentPreview = post.content.length > 140 && !expanded
    ? post.content.slice(0, 140) + '…'
    : post.content;

  return (
    <article className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition flex flex-col">
      {post.media_url && (
        <img
          src={post.media_url}
          alt={post.title}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Company header */}
        <div className="flex items-center gap-2 mb-2">
          {post.company_logo ? (
            <img
              src={post.company_logo}
              alt={post.company_name}
              className="w-7 h-7 rounded-full object-cover border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              {post.company_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{post.company_name}</p>
            <p className="text-[10px] text-gray-400">{relativeTime(post.created_at)}</p>
          </div>
        </div>

        <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>
        <p className="text-xs text-gray-600 mt-1 flex-1">{contentPreview}</p>

        {post.content.length > 140 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-600 hover:underline mt-1 self-start"
          >
            {expanded ? 'إخفاء' : 'اقرأ المزيد'}
          </button>
        )}

        <div className="mt-2 text-[10px] text-gray-400">
          👁️ {post.views_count} مشاهدة
        </div>
      </div>
    </article>
  );
}