import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usersApi, type User, type UserInput } from '../api/usersApi1';
import { branchesApi } from '../api/branchesApi';
import type { Branch } from '../types';

/* ============================ Types ============================ */

type FormMode = 'create' | 'edit';
type SortField = 'name' | 'email' | 'is_active' | 'created_at';

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  branch_id: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  branch_id: '',
  is_active: true,
};

/* ============================ Component ============================ */

export default function UsersPage() {
  /* ---------- list ---------- */
  const [data, setData] = useState<Awaited<ReturnType<typeof usersApi.list>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- filters ---------- */
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [sort, setSort] = useState<SortField>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  /* ---------- branches ---------- */
  const [branches, setBranches] = useState<Branch[]>([]);

  /* ---------- modal ---------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------- password modal ---------- */
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [pwdValue, setPwdValue] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  /* ---------- busy ---------- */
  const [busyId, setBusyId] = useState<string | null>(null);

  /* ---------- debounce search ---------- */
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [searchInput]);

  /* ---------- load users ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof usersApi.list>[0] = { page, limit, sort, order };
      if (isActiveFilter !== 'all') params.is_active = isActiveFilter === 'true';
      if (branchFilter) params.branch_id = branchFilter;
      if (search) params.search = search;
      setData(await usersApi.list(params));
    } catch (e: any) {
      setError(e?.message ?? 'فشل تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActiveFilter, branchFilter, search, sort, order]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [isActiveFilter, branchFilter, limit, sort, order]);

  /* ---------- load branches (once) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await branchesApi.list({ page: 1, limit: 100 });
        setBranches(res.items);
      } catch { /* optional */ }
    })();
  }, []);

  /* ---------- handlers ---------- */
  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setMode('edit');
    setEditingId(u.id);
    setForm({
      name: u.name ?? '',
      email: u.email ?? '',
      password: '',
      phone: u.phone ?? '',
      branch_id: u.branch_id ?? '',
      is_active: u.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => { if (!saving) setModalOpen(false); };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'الاسم مطلوب';
    if (!form.email.trim()) return 'البريد الإلكتروني مطلوب';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'البريد الإلكتروني غير صالح';
    if (mode === 'create' && form.password.length < 8) return 'كلمة المرور مطلوبة (8 أحرف على الأقل)';
    return null;
  };

  const submit = async () => {
    const v = validateForm();
    if (v) { setFormError(v); return; }

    setSaving(true);
    setFormError(null);
    try {
      const base: UserInput = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        branch_id: form.branch_id || null,
        is_active: form.is_active,
      };

      if (mode === 'create') {
        await usersApi.create({ ...base, password: form.password });
      } else if (editingId) {
        await usersApi.update(editingId, base);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message ?? 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    try {
      await usersApi.setActive(u.id, !u.is_active);
      await load();
    } catch (e: any) {
      alert(e?.message ?? 'فشل تغيير الحالة');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (u: User) => {
    if (!window.confirm(`هل تريد حذف الموظف «${u.name}»؟ لا يمكن التراجع.`)) return;
    setBusyId(u.id);
    try {
      await usersApi.remove(u.id);
      const total = data?.pagination.total ?? 1;
      const isLastOnLastPage =
        (data?.items.length ?? 0) === 1 && page > 1 && total - 1 <= (page - 1) * limit;
      if (isLastOnLastPage) setPage((p) => Math.max(1, p - 1));
      else await load();
    } catch (e: any) {
      alert(e?.message ?? 'فشل الحذف');
    } finally {
      setBusyId(null);
    }
  };

  const openPassword = (u: User) => {
    setPwdUser(u);
    setPwdValue('');
    setPwdError(null);
  };

  const submitPassword = async () => {
    if (!pwdUser) return;
    if (pwdValue.length < 8) { setPwdError('كلمة المرور 8 أحرف على الأقل'); return; }
    setPwdSaving(true);
    setPwdError(null);
    try {
      await usersApi.setPassword(pwdUser.id, pwdValue);
      setPwdUser(null);
    } catch (e: any) {
      setPwdError(e?.message ?? 'فشل تحديث كلمة المرور');
    } finally {
      setPwdSaving(false);
    }
  };

  const toggleSort = (f: SortField) => {
    if (sort === f) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(f); setOrder('asc'); }
  };

  /* ---------- derived ---------- */
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const pages = pagination?.pages ?? 1;
  const SortIcon = ({ f }: { f: SortField }) =>
    sort === f ? <span className="text-xs">{order === 'asc' ? '▲' : '▼'}</span> : null;

  const branchOptions = useMemo(() => branches, [branches]);

  /* ---------- render ---------- */
  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الموظفون</h1>
          <p className="text-sm text-gray-500">إدارة حسابات الموظفين وربطهم بالفروع</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          + إضافة موظف
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="بحث بالاسم / البريد / الهاتف..."
          className="border rounded-lg px-3 py-1.5 text-sm w-64"
        />

        <select
          value={isActiveFilter}
          onChange={(e) => setIsActiveFilter(e.target.value as any)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">معطّل</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">كل الفروع</option>
          {branchOptions.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / صفحة</option>
          ))}
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
                <SortIcon f="name" />
              </Th>
              <Th label="البريد" onClick={() => toggleSort('email')}>
                <SortIcon f="email" />
              </Th>
              <Th label="الهاتف" />
              <Th label="الفرع" />
              <Th label="الأدوار" />
              <Th label="الحالة" center onClick={() => toggleSort('is_active')}>
                <SortIcon f="is_active" />
              </Th>
              <Th label="إجراءات" center />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">جارٍ التحميل...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">لا يوجد موظفون مطابقون</td></tr>
            )}
            {!loading && items.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">{u.email}</td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">{u.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.branch_name ?? '—'}</td>
                <td className="px-4 py-3">
                  {(u.roles ?? []).length ? (
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((r) => (
                        <span
                          key={r.id}
                          className="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {u.is_active ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">نشط</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">معطّل</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-blue-600 hover:underline text-sm mx-1"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => openPassword(u)}
                    className="text-amber-600 hover:underline text-sm mx-1"
                  >
                    كلمة المرور
                  </button>
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={busyId === u.id}
                    className="text-gray-700 hover:underline text-sm mx-1 disabled:opacity-50"
                  >
                    {u.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => confirmDelete(u)}
                    disabled={busyId === u.id}
                    className="text-red-600 hover:underline text-sm mx-1 disabled:opacity-50"
                  >
                    حذف
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
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              السابق
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* ============ Create/Edit Modal ============ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {mode === 'create' ? 'إضافة موظف' : 'تعديل الموظف'}
              </h2>
              <button onClick={closeModal} disabled={saving} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="الاسم *">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="اسم الموظف"
                />
              </Field>

              <Field label="البريد الإلكتروني *">
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  type="email"
                  dir="ltr"
                  placeholder="user@company.com"
                />
              </Field>

              {mode === 'create' && (
                <Field label="كلمة المرور *">
                  <input
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    type="password"
                    dir="ltr"
                    placeholder="8 أحرف على الأقل"
                  />
                </Field>
              )}

              <Field label="الهاتف">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  dir="ltr"
                />
              </Field>

              <Field label="الفرع">
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">— بدون فرع —</option>
                  {branchOptions.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  نشط
                </label>
              </div>

              {formError && (
                <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                  {formError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'جارٍ الحفظ...' : mode === 'create' ? 'إنشاء' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Password Modal ============ */}
      {pwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-lg">تغيير كلمة المرور</h2>
              <p className="text-sm text-gray-500 mt-1">
                للموظف: <span className="font-medium">{pwdUser.name}</span>
              </p>
            </div>

            <div className="p-5 space-y-3">
              <Field label="كلمة المرور الجديدة *">
                <input
                  value={pwdValue}
                  onChange={(e) => setPwdValue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  type="password"
                  dir="ltr"
                  placeholder="8 أحرف على الأقل"
                  autoFocus
                />
              </Field>
              {pwdError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                  {pwdError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setPwdUser(null)}
                disabled={pwdSaving}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={submitPassword}
                disabled={pwdSaving}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {pwdSaving ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ Helpers ============================ */

function Field({
  label, children, className = '',
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Th({
  label, children, center, onClick,
}: {
  label: string;
  children?: React.ReactNode;
  center?: boolean;
  onClick?: () => void;
}) {
  return (
    <th
      className={`px-4 py-3 font-medium ${
        center ? 'text-center' : 'text-right'
      } ${onClick ? 'cursor-pointer select-none hover:text-gray-900' : ''}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label} {children}
      </span>
    </th>
  );
}