import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  FileText,
  Download,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { customersApi } from '../api/customersApi';
import { pdfApi } from '../api/pdfApi1';
import { Customer, Pagination as PaginationType } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { PrintPreviewModal, exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { DateRangeModal, type DateRange } from '../components/common/DateRangeModal';
export const CustomersPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0 });
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  // Statement print modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
const [pdfLoading, setPdfLoading] = useState(false);

  const loadCustomers = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam = isActiveFilter === 'all' ? undefined : isActiveFilter === 'active';
      const res = await customersApi.list({
        search: search.trim() || undefined,
        is_active: activeParam,
        page,
        limit: 15,
      });

      setCustomers(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل قائمة العملاء');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1);
  }, [isActiveFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(1);
  };

  const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxNumber('');
    setCreditLimit(0);
    setIsActive(true);
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم العميل مطلوب');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await customersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        credit_limit: Number(creditLimit) || 0,
      });
      setIsAddOpen(false);
      loadCustomers(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة العميل');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setTaxNumber(c.tax_number || '');
    setCreditLimit(c.credit_limit || 0);
    setIsActive(c.is_active);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!name.trim()) {
      setFormError('اسم العميل مطلوب');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await customersApi.update(selectedCustomer.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        credit_limit: Number(creditLimit) || 0,
        is_active: isActive,
      });
      setIsEditOpen(false);
      loadCustomers(pagination.page);
    } catch (err: any) {
      setFormError(err.message || 'فشل تعديل العميل');
    } finally {
      setFormLoading(false);
    }
  };

  const openViewModal = async (c: Customer) => {
    setSelectedCustomer(c);
    setIsViewOpen(true);
    try {
      const detailed = await customersApi.getOne(c.id);
      setSelectedCustomer(detailed);
    } catch {
      //
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف العميل "${customerName}"؟`)) {
      return;
    }
    try {
      await customersApi.delete(id);
      loadCustomers(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل حذف العميل');
    }
  };

  const handleExportCsv = () => {
    const exportData = customers.map((c) => ({
      الاسم: c.name,
      الكود: c.code || '',
      الهاتف: c.phone || '',
      'البريد الإلكتروني': c.email || '',
      العنوان: c.address || '',
      'الرقم الضريبي': c.tax_number || '',
      'الحد الائتماني': c.credit_limit || 0,
      الحالة: c.is_active ? 'نشط' : 'معطل',
    }));
    exportToCsv(exportData, 'customers_list');
  };
  const openStatementModal = (c: Customer) => {
  setStatementCustomer(c);
  setIsDateRangeOpen(true);
};

const handleGenerateStatement = async (range: DateRange) => {
  if (!statementCustomer) return;
  setPdfLoading(true);
  try {
    await pdfApi.previewStatement('customer', statementCustomer.id, {
      date_from: range.from,
      date_to: range.to,
    });
    setIsDateRangeOpen(false);
    setStatementCustomer(null);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة العملاء</h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل العملاء، الأرصدة المستحقة، كشوفات الحساب، وحدود الائتمان
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={customers.length === 0}
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
            إضافة عميل جديد
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
            placeholder="البحث بالاسم، الهاتف، أو الإيميل..."
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
            <option value="active">العملاء النشطون فقط</option>
            <option value="inactive">العملاء المعطلون</option>
          </select>

          <button
            type="button"
            onClick={() => loadCustomers(pagination.page)}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadCustomers(pagination.page)} />}

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب قائمة العملاء من قاعدة البيانات..." fullHeight />
        ) : customers.length === 0 ? (
          <EmptyState
            title="لا يوجد عملاء مطابقون"
            description="لم يتم العثور على أي عميل مسجل بالبيانات المدخلة."
            actionLabel="إضافة أول عميل"
            onAction={openAddModal}
            icon={<Users className="w-8 h-8" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">اسم العميل</th>
                    <th className="py-3 px-4">معلومات الاتصال</th>
                    <th className="py-3 px-4">العنوان</th>
                    <th className="py-3 px-4">الحد الائتماني</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold">{c.name}</span>
                            {c.code && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                #{c.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {c.phone && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span dir="ltr">{c.phone}</span>
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span dir="ltr">{c.email}</span>
                            </span>
                          )}
                          {!c.phone && !c.email && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.address ? (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {c.address}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {Number(c.credit_limit || 0).toLocaleString()} {currency}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(c)}
                            title="عرض التفاصيل وكشف الحساب"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                           <button
                                type="button"
                                onClick={() => openStatementModal(c)}
                                title="كشف حساب PDF"
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title="تعديل العميل"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.name)}
                            title="حذف العميل"
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

            <Pagination pagination={pagination} onPageChange={loadCustomers} />
          </>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة عميل جديد">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل أو الصيدلية *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: صيدلية الشفاء"
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
                placeholder="client@mail.com"
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
                الحد الائتماني ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">العنوان والموقع</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المدينة، الشارع، المعلم"
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
              {formLoading ? 'جاري الحفظ...' : 'حفظ العميل'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="تعديل بيانات العميل">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل أو الصيدلية *</label>
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
                الحد الائتماني ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
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
              id="cust_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="cust_active" className="text-xs font-bold text-slate-700">
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

      {/* View Customer Details & Balance Sheet Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`تفاصيل العميل: ${selectedCustomer.name}`}
        >
          <div className="space-y-6">
            {/* Balance Highlight Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">الرصيد المستحق الحالي (ذمم مدينة)</span>
                <span className="text-xl font-black text-rose-600 font-mono mt-0.5 block">
                  {Number(selectedCustomer.balance?.outstanding || 0).toLocaleString()} {currency}
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setIsPrintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                >
                  <FileText className="w-4 h-4" />
                  كشف حساب العميل
                </button>
                <button
  onClick={() => {
  setIsViewOpen(false);
  openStatementModal(selectedCustomer);
}}
  title="كشف حساب PDF"
  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
>
  <FileText className="w-4 h-4" />
</button>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">رقم الهاتف</span>
                <span className="font-semibold text-slate-800" dir="ltr">
                  {selectedCustomer.phone || 'غير مسجل'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">البريد الإلكتروني</span>
                <span className="font-semibold text-slate-800" dir="ltr">
                  {selectedCustomer.email || 'غير مسجل'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">الرقم الضريبي</span>
                <span className="font-semibold text-slate-800">
                  {selectedCustomer.tax_number || 'غير مسجل'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">الحد الائتماني المسموح</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {Number(selectedCustomer.credit_limit || 0).toLocaleString()} {currency}
                </span>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">العنوان</span>
                <span className="font-semibold text-slate-800">
                  {selectedCustomer.address || 'لا يوجد عنوان مسجل'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Statement Printable Modal */}
      {selectedCustomer && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title="كشف حساب عميل"
          documentType="كشف حساب مالي"
          documentNumber={selectedCustomer.code || selectedCustomer.id.slice(0, 8)}
          documentDate={new Date().toISOString().slice(0, 10)}
          partyTitle="العميل"
          partyName={selectedCustomer.name}
          partyInfo={`الهاتف: ${selectedCustomer.phone || '-'} | العنوان: ${selectedCustomer.address || '-'}`}
          currencyCode={currency}
          company={company}
          summary={[
            {
              label: 'الرصيد المستحق غير المسدد',
              value: Number(selectedCustomer.balance?.outstanding || 0),
              isTotal: true,
            },
            {
              label: 'الحد الائتماني المعتمد',
              value: Number(selectedCustomer.credit_limit || 0),
            },
          ]}
          hasBackendPdf={true}
          onBackendPdf={() => {
  setIsPrintOpen(false);
  openStatementModal(selectedCustomer);
}}
        />
      )}
      <DateRangeModal
  isOpen={isDateRangeOpen}
  onClose={() => {
    if (pdfLoading) return;
    setIsDateRangeOpen(false);
    setStatementCustomer(null);
  }}
  title="كشف حساب عميل — اختر الفترة"
  description={
    statementCustomer
      ? `كشف حساب للعميل: ${statementCustomer.name}`
      : undefined
  }
  onSubmit={handleGenerateStatement}
  loading={pdfLoading}
/>
    </div>
  );
};
