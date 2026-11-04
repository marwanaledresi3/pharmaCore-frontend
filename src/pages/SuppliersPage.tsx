import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Download,
  Eye,
  Network,
  FileText,
} from 'lucide-react';
import { suppliersApi } from '../api/suppliersApi';
import { Supplier, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { pdfApi } from '../api/pdfApi1';
import { DateRangeModal, type DateRange } from '../components/common/DateRangeModal';
export const SuppliersPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [connectedCompanyId, setConnectedCompanyId] = useState('');
  const [isActive, setIsActive] = useState(true);
const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);
const [pdfLoading, setPdfLoading] = useState(false);
  const loadSuppliers = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam = isActiveFilter === 'all' ? undefined : isActiveFilter === 'active';
      const res = await suppliersApi.list({
        search: search.trim() || undefined,
        is_active: activeParam,
        page,
        limit: 15,
      });

      setSuppliers(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل قائمة الموردين');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers(1);
  }, [isActiveFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSuppliers(1);
  };

  const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxNumber('');
    setConnectedCompanyId('');
    setIsActive(true);
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم المورد مطلوب');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await suppliersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        connected_company_id: connectedCompanyId.trim() || undefined,
      });
      setIsAddOpen(false);
      loadSuppliers(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المورد');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (s: Supplier) => {
    setSelectedSupplier(s);
    setName(s.name);
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setTaxNumber(s.tax_number || '');
    setConnectedCompanyId(s.connected_company_id || '');
    setIsActive(s.is_active);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    if (!name.trim()) {
      setFormError('اسم المورد مطلوب');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await suppliersApi.update(selectedSupplier.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        connected_company_id: connectedCompanyId.trim() || undefined,
        is_active: isActive,
      });
      setIsEditOpen(false);
      loadSuppliers(pagination.page);
    } catch (err: any) {
      setFormError(err.message || 'فشل تعديل المورد');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, supplierName: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المورد "${supplierName}"؟`)) {
      return;
    }
    try {
      await suppliersApi.delete(id);
      loadSuppliers(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المورد');
    }
  };

  const handleExportCsv = () => {
    const exportData = suppliers.map((s) => ({
      الاسم: s.name,
      الكود: s.code || '',
      الهاتف: s.phone || '',
      'البريد الإلكتروني': s.email || '',
      العنوان: s.address || '',
      'الرقم الضريبي': s.tax_number || '',
      'معرّف الشركة المرتبطة': s.connected_company_id || '',
      الحالة: s.is_active ? 'نشط' : 'معطل',
    }));
    exportToCsv(exportData, 'suppliers_list');
  };
  const openStatementModal = (s: Supplier) => {
  setStatementSupplier(s);
  setIsDateRangeOpen(true);
};

const handleGenerateStatement = async (range: DateRange) => {
  if (!statementSupplier) return;
  setPdfLoading(true);
  try {
    await pdfApi.previewStatement('supplier', statementSupplier.id, {
      date_from: range.from,
      date_to: range.to,
    });
    setIsDateRangeOpen(false);
    setStatementSupplier(null);
  } catch (err: any) {
    alert(err?.message || 'فشل توليد كشف الحساب');
  } finally {
    setPdfLoading(false);
  }
};

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الموردين</h1>
          <p className="text-xs text-slate-500 mt-1">
            شركات الأدوية ومستودعات التوزيع، الأرصدة المستحقة، والربط بالشبكة الرقمية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={suppliers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
          
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم المورد، الهاتف، أو البريد..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">الموردون النشطون فقط</option>
            <option value="inactive">الموردون المعطلون</option>
          </select>

          <button
            type="button"
            onClick={() => loadSuppliers(pagination.page)}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadSuppliers(pagination.page)} />}

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب قائمة الموردين..." fullHeight />
        ) : suppliers.length === 0 ? (
          <EmptyState
            title="لا يوجد موردون مسجلون"
            description="يمكنك البدء بإضافة شركات الأدوية والموردين الذين تتعامل معهم."
            actionLabel="إضافة أول مورد"
            onAction={openAddModal}
            icon={<Truck className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">اسم المورد</th>
                    <th className="py-3 px-4">معلومات الاتصال</th>
                    <th className="py-3 px-4">العنوان</th>
                    <th className="py-3 px-4 text-center">الربط الرقمي B2B</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold">{s.name}</span>
                            {s.tax_number && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                ضريبي: {s.tax_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {s.phone && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span dir="ltr">{s.phone}</span>
                            </span>
                          )}
                          {s.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span dir="ltr">{s.email}</span>
                            </span>
                          )}
                          {!s.phone && !s.email && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {s.address ? (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {s.address}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.connected_company_id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Network className="w-3 h-3" />
                            مرتبط رقمياً
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">مورد محلي</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {/* ← جديد: كشف حساب PDF */}
                          <button
                            type="button"
                            onClick={() => openStatementModal(s)}
                            title="كشف حساب PDF"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            title="تعديل المورد"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id, s.name)}
                            title="حذف المورد"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={loadSuppliers} />
          </>
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة مورد جديد">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد أو الشركة *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شركة ابن سينا للأدوية"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="770000000"
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supplier@pharma.com"
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الضريبي</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="اختياري"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                معرّف الشركة المتصلة (B2B UUID)
              </label>
              <input
                type="text"
                value={connectedCompanyId}
                onChange={(e) => setConnectedCompanyId(e.target.value)}
                placeholder="معرف الشركة على المنصة إن وجد"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المدينة، الشارع"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ المورد'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="تعديل بيانات المورد">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد أو الشركة *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الضريبي</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                معرّف الشركة المتصلة (B2B UUID)
              </label>
              <input
                type="text"
                value={connectedCompanyId}
                onChange={(e) => setConnectedCompanyId(e.target.value)}
                placeholder="اختياري"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="sup_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="sup_active" className="text-xs font-bold text-slate-700">
              حساب نشط ومفعل
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'تحديث البيانات'}
            </button>
          </div>
        </form>
      </Modal>
      <DateRangeModal
  isOpen={isDateRangeOpen}
  onClose={() => {
    if (pdfLoading) return;
    setIsDateRangeOpen(false);
    setStatementSupplier(null);
  }}
  title="كشف حساب مورد — اختر الفترة"
  description={
    statementSupplier
      ? `كشف حساب للمورد: ${statementSupplier.name}`
      : undefined
  }
  onSubmit={handleGenerateStatement}
  loading={pdfLoading}
/>
    </div>
  );
};
