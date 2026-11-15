import React, { useState, useEffect, useMemo } from 'react';
import {
  Ruler, Plus, Search, RefreshCw, Pencil, Trash2,
  CheckCircle, XCircle, Save, X,
} from 'lucide-react';
import { unitsApi, Unit, UnitPayload } from '../../api/unitsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';

/**
 * تبويب الوحدات — يُستخدم داخل SettingsPage
 * (بدون header صفحة، لأن الأب يوفره)
 */
export const UnitsTab: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (filterActive !== 'all') params.is_active = filterActive === 'active';

      const data = await unitsApi.list(params);
      setUnits(data || []);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل الوحدات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  useEffect(() => {
    const t = setTimeout(() => loadData(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Modal
  const openCreate = () => {
    setEditingUnit(null);
    setFormCode('');
    setFormName('');
    setFormNameEn('');
    setFormActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormCode(unit.code);
    setFormName(unit.name);
    setFormNameEn(unit.name_en || '');
    setFormActive(unit.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim() || !formName.trim()) {
      setFormError('الكود والاسم مطلوبان');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: formCode.trim(),
        name: formName.trim(),
        name_en: formNameEn.trim() || null,
        ...(editingUnit ? { is_active: formActive } : {}),
      };

      if (editingUnit) {
        await unitsApi.update(editingUnit.id, payload);
        setSuccess('تم تحديث الوحدة بنجاح');
      } else {
        await unitsApi.create(payload);
        setSuccess('تم إضافة الوحدة بنجاح');
      }
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذه الوحدة؟ لا يمكن الحذف إذا كانت مستخدمة في منتجات.')) return;
    setDeletingId(id);
    setError(null);
    try {
      await unitsApi.remove(id);
      setSuccess('تم حذف الوحدة');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  // Derived
  const stats = useMemo(() => ({
    total: units.length,
    active: units.filter((u) => u.is_active).length,
    inactive: units.filter((u) => !u.is_active).length,
  }), [units]);

  return (
    <div className="space-y-4">
      {/* Header داخلي (بدون h1 الصفحة) */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">وحدات القياس</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            إدارة الوحدات المستخدمة في المنتجات والمخزون
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            إضافة وحدة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="الإجمالي" value={stats.total} color="slate" />
        <StatCard label="نشطة" value={stats.active} color="emerald" />
        <StatCard label="معطلة" value={stats.inactive} color="rose" />
      </div>

      {/* Alerts */}
      {error && <ErrorAlert message={error} onRetry={loadData} />}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالكود أو الاسم..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="all">الكل</option>
          <option value="active">النشطة فقط</option>
          <option value="inactive">المعطلة فقط</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="جاري تحميل الوحدات..." />
          </div>
        ) : units.length === 0 ? (
          <div className="p-12 text-center">
            <Ruler className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">لا توجد وحدات</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {search ? 'جرب بحثاً آخر' : 'ابدأ بإضافة أول وحدة'}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                إضافة وحدة
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الكود</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الاسم (عربي)</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الاسم (إنجليزي)</th>
                <th className="text-right px-4 py-3 font-bold text-slate-700">الحالة</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                      {u.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">
                    {u.name_en || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold">
                        <XCircle className="w-3 h-3" /> معطل
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        title="تعديل"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-40"
                        title="حذف"
                      >
                        {deletingId === u.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">
                {editingUnit ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && <ErrorAlert message={formError} />}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكود *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  maxLength={20}
                  placeholder="PCS"
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم (عربي) *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={50}
                  placeholder="قطعة"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم (إنجليزي)</label>
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  maxLength={50}
                  placeholder="Piece"
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {editingUnit && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-700">نشط</span>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component
const StatCard: React.FC<{ label: string; value: number; color: 'slate' | 'emerald' | 'rose' }> = ({
  label,
  value,
  color,
}) => {
  const colors = {
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
  } as const;
  return (
    <div className={`p-3 rounded-xl border ${colors[color]}`}>
      <p className="text-[10px] font-bold opacity-70">{label}</p>
      <p className="text-xl font-black mt-0.5">{value}</p>
    </div>
  );
};