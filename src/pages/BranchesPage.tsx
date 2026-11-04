import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { branchesApi, type BranchInput } from '../api/branchesApi';
import { warehousesApi, type WarehouseLite } from '../api/warehousesApi';
import type { Branch } from '../types';

/* ============================ Types ============================ */

type FormMode = 'create' | 'edit';
type SortField = 'name' | 'code' | 'is_main' | 'is_active' | 'created_at';

interface FormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  warehouse_id: string;
  is_active: boolean;
  is_main: boolean;
}

const emptyForm: FormState = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  manager_name: '',
  warehouse_id: '',
  is_active: true,
  is_main: false,
};

/* ============================ Component ============================ */

export const BranchesPage: React.FC = () => {
  /* ---------- list ---------- */
  const [data, setData] = useState<Awaited<ReturnType<typeof branchesApi.list>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- filters ---------- */
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [sort, setSort] = useState<SortField>('is_main');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  /* ---------- warehouses (for select) ---------- */
  const [warehouses, setWarehouses] = useState<WarehouseLite[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  /* ---------- modal ---------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------- delete ---------- */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ---------- debounce search ---------- */
  const searchTimer = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchInput]);

  /* ============================ Load list ============================ */

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof branchesApi.list>[0] = { page, limit, sort, order };
      if (isActiveFilter !== 'all') params.is_active = isActiveFilter === 'true';
      if (search) params.search = search;
      setData(await branchesApi.list(params));
    } catch (e: any) {
      setError(e?.message ?? 'فشل تحميل الفروع');
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActiveFilter, search, sort, order]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [isActiveFilter, limit, sort, order]);

  /* ============================ Load warehouses ============================ */

  const loadWarehouses = useCallback(async () => {
    if (warehouses.length) return;
    setWarehousesLoading(true);
    try {
      const res = await warehousesApi.lists({ is_active: true, page: 1, limit: 100 });
      setWarehouses(res.items);
    } catch {
      /* اختياري: لا نعطّل الشاشة لو فشل تحميل المستودعات */
    } finally {
      setWarehousesLoading(false);
    }
  }, [warehouses.length]);

  /* ============================ Handlers ============================ */

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
    void loadWarehouses();
  };

  const openEdit = (b: Branch) => {
    setMode('edit');
    setEditingId(b.id);
    setForm({
      name: b.name ?? '',
      code: b.code ?? '',
      address: b.address ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      manager_name: b.manager_name ?? '',
      warehouse_id: b.warehouse_id ?? '',
      is_active: b.is_active,
      is_main: b.is_main,
    });
    setFormError(null);
    setModalOpen(true);
    void loadWarehouses();
  };

  const closeModal = () => { if (!saving) setModalOpen(false); };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'اسم الفرع مطلوب';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'البريد الإلكتروني غير صالح';
    }
    if (form.is_main) {
      const otherMain = (data?.items ?? []).find(
        (x) => x.is_main && x.id !== editingId
      );
      if (otherMain) {
        return `يوجد فرع رئيسي بالفعل: «${otherMain.name}». ألغِ تعيينه أولاً.`;
      }
    }
    return null;
  };

  const submit = async () => {
    const v = validateForm();
    if (v) { setFormError(v); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload: BranchInput = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        manager_name: form.manager_name.trim() || null,
        warehouse_id: form.warehouse_id || null,
        is_active: form.is_active,
        is_main: form.is_main,
      };

      if (mode === 'create') await branchesApi.create(payload);
      else if (editingId) await branchesApi.update(editingId, payload);

      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message ?? 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (b: Branch) => {
    if (!window.confirm(`هل تريد حذف الفرع «${b.name}»؟`)) return;
    setDeletingId(b.id);
    try {
      await branchesApi.remove(b.id);
      const total = data?.pagination.total ?? 1;
      const isLastOnLastPage =
        (data?.items.length ?? 0) === 1 && page > 1 && total - 1 <= (page - 1) * limit;
      if (isLastOnLastPage) setPage((p) => Math.max(1, p - 1));
      else await load();
    } catch (e: any) {
      alert(e?.message ?? 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
  };

  /* ============================ Derived ============================ */

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const pages = pagination?.pages ?? 1;
  const canPrev = page > 1;
  const canNext = page < pages;

  const SortIcon = ({ field }: { field: SortField }) =>
    sort === field ? <span className="text-xs">{order === 'asc' ? '▲' : '▼'}</span> : null;

  const warehouseOptions = useMemo(() => warehouses, [warehouses]);

  /* ============================ Render ============================ */

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الفروع</h1>
          <p className="text-sm text-gray-500">إدارة فروع الشركة وربطها بالمستودعات</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          + إضافة فرع
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="بحث بالاسم / الكود / المدير..."
          className="border rounded-lg px-3 py-1.5 text-sm w-64"
        />

        <select
          value={isActiveFilter}
          onChange={(e) => setIsActiveFilter(e.target.value as any)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="true">نشطة</option>
          <option value="false">غير نشطة</option>
        </select>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / صفحة</option>)}
        </select>

        <button
          onClick={() => void load()}
          className="mr-auto text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
        >
          تحديث
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th label="الاسم" onClick={() => toggleSort('name')}>
                <SortIcon field="name" />
              </Th>
              <Th label="الكود" onClick={() => toggleSort('code')}>
                <SortIcon field="code" />
              </Th>
              <Th label="المدير" />
              <Th label="الهاتف" />
              <Th label="البريد" />
              <Th label="المستودع" />
              <Th label="رئيسي" center onClick={() => toggleSort('is_main')}>
                <SortIcon field="is_main" />
              </Th>
              <Th label="الحالة" center onClick={() => toggleSort('is_active')}>
                <SortIcon field="is_active" />
              </Th>
              <Th label="إجراءات" center />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">جارٍ التحميل...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">لا توجد فروع مطابقة</td></tr>
            )}
            {!loading && items.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-gray-600">{b.code ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{b.manager_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">{b.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">{b.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{b.warehouse_name ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  {b.is_main
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">رئيسي</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {b.is_active
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">نشط</span>
                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">معطّل</span>}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button onClick={() => openEdit(b)} className="text-blue-600 hover:underline text-sm mx-1">تعديل</button>
                  <button
                    onClick={() => confirmDelete(b)}
                    disabled={deletingId === b.id}
                    className="text-red-600 hover:underline text-sm mx-1 disabled:opacity-50"
                  >
                    {deletingId === b.id ? '...' : 'حذف'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            إجمالي {pagination.total} — صفحة {pagination.page} من {pages}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40">السابق</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={!canNext}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40">التالي</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {mode === 'create' ? 'إضافة فرع' : 'تعديل الفرع'}
              </h2>
              <button onClick={closeModal} disabled={saving} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="الاسم *">
                <input value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" placeholder="فرع صنعاء" />
              </Field>

              <Field label="الكود">
                <input value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" placeholder="BR-01" dir="ltr" />
              </Field>

              <Field label="المدير">
                <input value={form.manager_name}
                  onChange={(e) => setForm((f) => ({ ...f, manager_name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" />
              </Field>

              <Field label="الهاتف">
                <input value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" dir="ltr" />
              </Field>

              <Field label="البريد الإلكتروني">
                <input value={form.email} type="email"
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" dir="ltr" />
              </Field>

              <Field label="المستودع">
                <select
                  value={form.warehouse_id}
                  onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={warehousesLoading}
                >
                  <option value="">— بدون مستودع —</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.code ? ` (${w.code})` : ''}
                    </option>
                  ))}
                </select>
                {warehousesLoading && (
                  <p className="text-xs text-gray-500 mt-1">جارٍ تحميل المستودعات...</p>
                )}
              </Field>

              <Field label="العنوان" className="md:col-span-2">
                <textarea value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2" rows={2} />
              </Field>

              <div className="flex items-center gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  نشط
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_main}
                    onChange={(e) => setForm((f) => ({ ...f, is_main: e.target.checked }))} />
                  فرع رئيسي
                </label>
              </div>

              {formError && (
                <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                  {formError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button onClick={closeModal} disabled={saving}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">إلغاء</button>
              <button onClick={submit} disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'جارٍ الحفظ...' : mode === 'create' ? 'إنشاء' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ Helpers ============================ */

function Field({ label, children, className = '' }: {
  label: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Th({ label, children, center, onClick }: {
  label: string; children?: React.ReactNode; center?: boolean; onClick?: () => void;
}) {
  return (
    <th className={`px-4 py-3 font-medium ${center ? 'text-center' : 'text-right'} ${onClick ? 'cursor-pointer select-none hover:text-gray-900' : ''}`}
        onClick={onClick}>
      <span className="inline-flex items-center gap-1">
        {label} {children}
      </span>
    </th>
  );
}