// pages/fixedAssets/FixedAssetsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Landmark,
  Plus,
  Search,
  RefreshCw,
  ArrowRightLeft,
  Wrench,
  Trash2,
  Calculator,
  Layers,
  PackageX,
} from 'lucide-react';
import { fixedAssetsApi } from '../../api/fixedAssetsApi';
import type {
  AssetCategory,
  FixedAsset,
  AssetDepreciationRecord,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
  FixedAssetStatus,
  DepreciationMethod,
  MaintenanceType,
  DisposalType,
} from '../../types/fixedAssets';

type ActiveSubTab = 'assets' | 'categories' | 'depreciation' | 'operations';

const STATUS_LABELS: Record<FixedAssetStatus, { label: string; cls: string }> = {
  active: { label: 'نشط', cls: 'bg-emerald-100 text-emerald-800' },
  under_maintenance: { label: 'تحت الصيانة', cls: 'bg-amber-100 text-amber-800' },
  disposed: { label: 'مستبعد', cls: 'bg-rose-100 text-rose-800' },
  sold: { label: 'مباع', cls: 'bg-sky-100 text-sky-800' },
  written_off: { label: 'مشطوب', cls: 'bg-slate-200 text-slate-700' },
};

const isDisposedStatus = (s: FixedAssetStatus) =>
  s === 'disposed' || s === 'sold' || s === 'written_off';

const fmtMoney = (v: number | string | null | undefined) =>
  Number(v || 0).toLocaleString('ar-YE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const FixedAssetsPage: React.FC = () => {
  const [subTab, setSubTab] = useState<ActiveSubTab>('assets');

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [depreciations, setDepreciations] = useState<AssetDepreciationRecord[]>([]);
  const [maintenances, setMaintenances] = useState<AssetMaintenanceRecord[]>([]);
  const [disposals, setDisposals] = useState<AssetDisposalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    category_id: '',
    purchase_cost: '',
    salvage_value: '0',
    purchase_date: new Date().toISOString().slice(0, 10),
    in_service_date: new Date().toISOString().slice(0, 10),
    serial_number: '',
    location: '',
    notes: '',
  });

  const [showCreateCat, setShowCreateCat] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    code: '',
    depreciation_method: 'straight_line' as DepreciationMethod,
    useful_life_years: '5',
    declining_rate: '20',
  });

  const now = new Date();
  const [depYear, setDepYear] = useState(now.getUTCFullYear());
  const [depMonth, setDepMonth] = useState(now.getUTCMonth() + 1);
  const [runningDep, setRunningDep] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [actionModal, setActionModal] = useState<
    'transfer' | 'maintenance' | 'dispose' | null
  >(null);
  const [actionForm, setActionForm] = useState({
    custodian_employee_id: '',
    location: '',
    notes: '',
    maintenance_type: 'routine' as MaintenanceType,
    cost: '0',
    description: '',
    is_capitalized: false,
    disposal_type: 'sale' as DisposalType,
    sale_price: '0',
    buyer_name: '',
    reason: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, assetsRes, depsRes, maintsRes, dispsRes] = await Promise.all([
        fixedAssetsApi.listCategories(),
        fixedAssetsApi.listAssets({
          search: search.trim() || undefined,
          status: (statusFilter as FixedAssetStatus) || undefined,
          category_id: categoryFilter || undefined,
          limit: 50,
        }),
        fixedAssetsApi.listDepreciations(),
        fixedAssetsApi.listMaintenances(),
        fixedAssetsApi.listDisposals(),
      ]);

      setCategories(catsRes);
      setAssets(assetsRes.items);
      setDepreciations(depsRes);
      setMaintenances(maintsRes);
      setDisposals(dispsRes);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل بيانات الأصول الثابتة');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await fixedAssetsApi.createAsset({
        name: newAsset.name,
        category_id: newAsset.category_id,
        purchase_cost: Number(newAsset.purchase_cost),
        salvage_value: Number(newAsset.salvage_value || 0),
        purchase_date: newAsset.purchase_date,
        in_service_date: newAsset.in_service_date || newAsset.purchase_date,
        serial_number: newAsset.serial_number || null,
        location: newAsset.location || null,
        notes: newAsset.notes || null,
      });
      setShowCreateAsset(false);
      setNewAsset({
        name: '',
        category_id: '',
        purchase_cost: '',
        salvage_value: '0',
        purchase_date: new Date().toISOString().slice(0, 10),
        in_service_date: new Date().toISOString().slice(0, 10),
        serial_number: '',
        location: '',
        notes: '',
      });
      setNotice('تم إضافة الأصل الثابت بنجاح');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر إضافة الأصل الثابت');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await fixedAssetsApi.createCategory({
        name: newCat.name,
        code: newCat.code || null,
        depreciation_method: newCat.depreciation_method,
        useful_life_years:
          newCat.depreciation_method === 'straight_line'
            ? Number(newCat.useful_life_years)
            : null,
        declining_rate:
          newCat.depreciation_method === 'declining_balance'
            ? Number(newCat.declining_rate)
            : null,
      });
      setShowCreateCat(false);
      setNewCat({
        name: '',
        code: '',
        depreciation_method: 'straight_line',
        useful_life_years: '5',
        declining_rate: '20',
      });
      setNotice('تم إنشاء تصنيف الأصول بنجاح');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر إنشاء التصنيف');
    }
  };

  const handleRunDepreciation = async () => {
    setRunningDep(true);
    setError(null);
    setNotice(null);
    try {
      const res: any = await fixedAssetsApi.runDepreciation({
        year: Number(depYear),
        month: Number(depMonth),
      });
      setNotice(
        `تم تشغيل الإهلاك للفترة ${depYear}/${depMonth} — عدد الأصول المُهلكة: ${
          res?.processed_count ?? 0
        }`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر تشغيل الإهلاك');
    } finally {
      setRunningDep(false);
    }
  };

  const openActionModal = (
    asset: FixedAsset,
    type: 'transfer' | 'maintenance' | 'dispose'
  ) => {
    setSelectedAsset(asset);
    setActionModal(type);
    setActionForm({
      custodian_employee_id: asset.custodian_employee_id || '',
      location: asset.location || '',
      notes: '',
      maintenance_type: 'routine',
      cost: '0',
      description: '',
      is_capitalized: false,
      disposal_type: 'sale',
      sale_price: '0',
      buyer_name: '',
      reason: '',
    });
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !actionModal) return;
    setError(null);
    setNotice(null);
    try {
      if (actionModal === 'transfer') {
        await fixedAssetsApi.transferCustody(selectedAsset.id, {
          custodian_employee_id: actionForm.custodian_employee_id.trim() || null,
          location: actionForm.location.trim() || null,
          notes: actionForm.notes || null,
        });
        setNotice(`تم تحديث عهدة الأصل ${selectedAsset.asset_number}`);
      } else if (actionModal === 'maintenance') {
        await fixedAssetsApi.createMaintenance(selectedAsset.id, {
          maintenance_type: actionForm.maintenance_type,
          cost: Number(actionForm.cost || 0),
          description: actionForm.description.trim() || 'صيانة أصل ثابت',
          is_capitalized: actionForm.is_capitalized,
        });
        setNotice(`تم تسجيل صيانة الأصل ${selectedAsset.asset_number}`);
      } else if (actionModal === 'dispose') {
        await fixedAssetsApi.disposeAsset(selectedAsset.id, {
          disposal_type: actionForm.disposal_type,
          sale_price: Number(actionForm.sale_price || 0),
          buyer_name: actionForm.buyer_name.trim() || null,
          reason: actionForm.reason.trim() || actionForm.notes.trim() || null,
        });
        setNotice(`تم استبعاد الأصل ${selectedAsset.asset_number}`);
      }
      setActionModal(null);
      setSelectedAsset(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر تنفيذ العملية');
    }
  };

  const handleDeleteAsset = async (asset: FixedAsset) => {
    setError(null);
    setNotice(null);
    try {
      await fixedAssetsApi.deleteAsset(asset.id);
      setNotice(`تم حذف الأصل ${asset.asset_number}`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر حذف الأصل');
    }
  };

  const totals = assets.reduce(
    (acc, a) => {
      const cost = Number(a.purchase_cost || 0);
      const accum = Number(a.accumulated_depreciation || 0);
      const book =
        a.book_value !== undefined && a.book_value !== null
          ? Number(a.book_value)
          : cost - accum;
      acc.cost += cost;
      acc.accum += accum;
      acc.book += book;
      return acc;
    },
    { cost: 0, accum: 0, book: 0 }
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">الأصول الثابتة</h1>
            <p className="text-xs text-slate-500">
              إدارة الأصول، التصنيفات، الإهلاك الدوري، الصيانة، والاستبعاد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            type="button"
            onClick={() => setShowCreateAsset(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            إضافة أصل ثابت
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100">
          <p className="text-xs font-bold text-slate-500">عدد الأصول</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{assets.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100">
          <p className="text-xs font-bold text-slate-500">إجمالي تكلفة الشراء</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{fmtMoney(totals.cost)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100">
          <p className="text-xs font-bold text-slate-500">مجمع الإهلاك</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{fmtMoney(totals.accum)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100">
          <p className="text-xs font-bold text-slate-500">صافي القيمة الدفترية</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{fmtMoney(totals.book)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'assets', label: 'قائمة الأصول', icon: <Landmark className="w-4 h-4" /> },
          { id: 'categories', label: 'التصنيفات', icon: <Layers className="w-4 h-4" /> },
          { id: 'depreciation', label: 'الإهلاك الدوري', icon: <Calculator className="w-4 h-4" /> },
          { id: 'operations', label: 'الصيانة والاستبعاد', icon: <PackageX className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id as ActiveSubTab)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === t.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-2xl bg-white p-4 border border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، الرقم، أو الرقم التسلسلي..."
                className="w-full rounded-xl border border-slate-200 pr-9 pl-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-100 shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">الرقم</th>
                  <th className="py-3 px-4">الأصل</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">التكلفة</th>
                  <th className="py-3 px-4">مجمع الإهلاك</th>
                  <th className="py-3 px-4">القيمة الدفترية</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => {
                  const st = STATUS_LABELS[a.status] || {
                    label: a.status,
                    cls: 'bg-slate-100 text-slate-700',
                  };
                  const bookVal =
                    a.book_value !== undefined && a.book_value !== null
                      ? Number(a.book_value)
                      : Number(a.purchase_cost || 0) -
                        Number(a.accumulated_depreciation || 0);
                  const locked = isDisposedStatus(a.status);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.asset_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{a.name}</div>
                        {a.location && (
                          <div className="text-[11px] text-slate-500">الموقع: {a.location}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{a.category_name || '-'}</td>
                      <td className="py-3 px-4 font-bold">{fmtMoney(a.purchase_cost)}</td>
                      <td className="py-3 px-4 text-amber-700 font-bold">
                        {fmtMoney(a.accumulated_depreciation)}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-black">
                        {fmtMoney(bookVal)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="نقل عهدة / موقع"
                            disabled={locked}
                            onClick={() => openActionModal(a, 'transfer')}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="تسجيل صيانة"
                            disabled={locked}
                            onClick={() => openActionModal(a, 'maintenance')}
                            className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="استبعاد / بيع"
                            disabled={locked}
                            onClick={() => openActionModal(a, 'dispose')}
                            className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <PackageX className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="حذف"
                            onClick={() => handleDeleteAsset(a)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && assets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد أصول ثابتة مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCreateCat(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              تصنيف جديد
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{c.name}</span>
                  {c.code && (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {c.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  الطريقة:{' '}
                  <strong className="text-slate-800">
                    {c.depreciation_method === 'straight_line'
                      ? `القسط الثابت (${c.useful_life_years ?? '-'} سنوات)`
                      : c.depreciation_method === 'declining_balance'
                      ? `الرصيد المتناقص (${c.declining_rate ?? '-'}%)`
                      : 'وحدات الإنتاج'}
                  </strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'depreciation' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السنة</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={depYear}
                onChange={(e) => setDepYear(Number(e.target.value))}
                className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الشهر</label>
              <select
                value={depMonth}
                onChange={(e) => setDepMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={runningDep}
              onClick={handleRunDepreciation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              {runningDep ? 'جاري الحساب...' : 'تشغيل إهلاك الفترة'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-100">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">الفترة</th>
                  <th className="py-3 px-4">الأصل</th>
                  <th className="py-3 px-4">تاريخ الإهلاك</th>
                  <th className="py-3 px-4">قيمة الإهلاك</th>
                  <th className="py-3 px-4">المجمع بعده</th>
                  <th className="py-3 px-4">القيمة الدفترية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depreciations.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-4 font-mono font-bold">
                      {d.period_year}/{String(d.period_month).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      {d.asset_number} — {d.asset_name}
                    </td>
                    <td className="py-3 px-4">
                      {String(d.depreciation_date).slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">
                      {fmtMoney(d.amount)}
                    </td>
                    <td className="py-3 px-4">{fmtMoney(d.accumulated_after)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {fmtMoney(d.book_value_after)}
                    </td>
                  </tr>
                ))}
                {depreciations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد سجلات إهلاك بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-4 border border-slate-100 space-y-3">
            <h3 className="text-sm font-black text-slate-900">
              سجل الصيانة ({maintenances.length})
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {maintenances.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      {m.asset_number} — {m.asset_name}
                    </div>
                    <div className="text-slate-500">
                      {String(m.maintenance_date).slice(0, 10)} • {m.description}
                    </div>
                  </div>
                  <span className="font-black text-amber-700">{fmtMoney(m.cost)}</span>
                </div>
              ))}
              {maintenances.length === 0 && (
                <p className="py-6 text-center text-slate-400">لا توجد صيانات مسجلة</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-100 space-y-3">
            <h3 className="text-sm font-black text-slate-900">
              سجل الاستبعاد والبيع ({disposals.length})
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {disposals.map((d) => {
                const gl = Number(d.gain_loss || 0);
                return (
                  <div key={d.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">
                        {d.asset_number} — {d.asset_name}
                      </div>
                      <div className="text-slate-500">
                        {String(d.disposal_date).slice(0, 10)} • سعر البيع:{' '}
                        {fmtMoney(d.sale_price)}
                      </div>
                    </div>
                    <span
                      className={`font-black ${
                        gl >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {gl >= 0 ? 'ربح ' : 'خسارة '}
                      {fmtMoney(Math.abs(gl))}
                    </span>
                  </div>
                );
              })}
              {disposals.length === 0 && (
                <p className="py-6 text-center text-slate-400">لا توجد استبعادات مسجلة</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateAsset}
            className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">إضافة أصل ثابت</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">اسم الأصل *</label>
                <input
                  required
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">التصنيف *</label>
                <select
                  required
                  value={newAsset.category_id}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, category_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">تكلفة الشراء *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAsset.purchase_cost}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, purchase_cost: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">قيمة الخردة</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAsset.salvage_value}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, salvage_value: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تاريخ الشراء *</label>
                <input
                  required
                  type="date"
                  value={newAsset.purchase_date}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, purchase_date: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تاريخ بدء التشغيل</label>
                <input
                  type="date"
                  value={newAsset.in_service_date}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, in_service_date: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الموقع</label>
                <input
                  value={newAsset.location}
                  onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateAsset(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
              >
                حفظ الأصل
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreateCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateCategory}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">تصنيف أصول جديد</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم التصنيف *</label>
                <input
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الرمز</label>
                <input
                  value={newCat.code}
                  onChange={(e) => setNewCat({ ...newCat, code: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">طريقة الإهلاك</label>
                <select
                  value={newCat.depreciation_method}
                  onChange={(e) =>
                    setNewCat({
                      ...newCat,
                      depreciation_method: e.target.value as DepreciationMethod,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="straight_line">القسط الثابت</option>
                  <option value="declining_balance">الرصيد المتناقص</option>
                  <option value="units_of_production">وحدات الإنتاج</option>
                </select>
              </div>
              {newCat.depreciation_method === 'straight_line' && (
                <div>
                  <label className="block font-bold mb-1">العمر الإنتاجي (سنوات) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newCat.useful_life_years}
                    onChange={(e) =>
                      setNewCat({ ...newCat, useful_life_years: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              )}
              {newCat.depreciation_method === 'declining_balance' && (
                <div>
                  <label className="block font-bold mb-1">نسبة الإهلاك المتناقص (%) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newCat.declining_rate}
                    onChange={(e) =>
                      setNewCat({ ...newCat, declining_rate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateCat(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
              >
                حفظ التصنيف
              </button>
            </div>
          </form>
        </div>
      )}

      {actionModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSubmitAction}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">
              {actionModal === 'transfer' && `نقل عهدة/موقع: ${selectedAsset.name}`}
              {actionModal === 'maintenance' && `تسجيل صيانة: ${selectedAsset.name}`}
              {actionModal === 'dispose' && `استبعاد / بيع: ${selectedAsset.name}`}
            </h2>

            <div className="space-y-3 text-xs">
              {actionModal === 'transfer' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">معرف الموظف المسؤول (UUID)</label>
                    <input
                      value={actionForm.custodian_employee_id}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          custodian_employee_id: e.target.value,
                        })
                      }
                      placeholder="اختياري"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الموقع الجديد</label>
                    <input
                      value={actionForm.location}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, location: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </>
              )}

              {actionModal === 'maintenance' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">نوع الصيانة</label>
                    <select
                      value={actionForm.maintenance_type}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          maintenance_type: e.target.value as MaintenanceType,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="routine">دورية</option>
                      <option value="repair">إصلاح</option>
                      <option value="upgrade">تطوير</option>
                      <option value="inspection">فحص</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الوصف *</label>
                    <input
                      required
                      value={actionForm.description}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">التكلفة</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={actionForm.cost}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, cost: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={actionForm.is_capitalized}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          is_capitalized: e.target.checked,
                        })
                      }
                    />
                    رسملة التكلفة على قيمة الأصل
                  </label>
                </>
              )}

              {actionModal === 'dispose' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">نوع الاستبعاد</label>
                    <select
                      value={actionForm.disposal_type}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          disposal_type: e.target.value as DisposalType,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="sale">بيع</option>
                      <option value="scrap">تكهين / خردة</option>
                      <option value="write_off">شطب</option>
                      <option value="donation">تبرع</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">سعر البيع / العائد</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={actionForm.sale_price}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, sale_price: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">اسم المشتري / الجهة</label>
                    <input
                      value={actionForm.buyer_name}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, buyer_name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">السبب</label>
                    <input
                      value={actionForm.reason}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, reason: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setSelectedAsset(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
              >
                تأكيد
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FixedAssetsPage;