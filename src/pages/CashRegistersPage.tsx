// src/pages/CashRegistersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Search,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  XCircle,
  Building2,
  FileText,
  Star,
} from 'lucide-react';
import { cashRegistersApi, CashRegister, CashTransfer } from '../api/cashRegistersApi';
import { companyApi } from '../api/companyApi';
import { Currency } from '../types';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { exportToCsv } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';
import { CashRegisterSelect } from '../components/common/CashRegisterSelect';

export const CashRegistersPage: React.FC = () => {
  const { company, user } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [activeTab, setActiveTab] = useState<'registers' | 'transfers'>('registers');
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Modal: Create Register
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regCurrencyId, setRegCurrencyId] = useState('');
  const [regOpeningBalance, setRegOpeningBalance] = useState<number>(0);
  const [regIsDefault, setRegIsDefault] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Create Transfer
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromRegisterId, setFromRegisterId] = useState<string | null>(null);
  const [toRegisterId, setToRegisterId] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════
  // Load Data
  // ══════════════════════════════════════════════════════════════════════

  const loadData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'registers') {
        const [regs, curs] = await Promise.all([
          cashRegistersApi.list(),
          companyApi.listCurrencies(),
        ]);
        setRegisters(regs);
        setCurrencies(curs);
      } else {
        const res = await cashRegistersApi.listTransfers({ page, limit: 15 });
        setTransfers(res.items);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات الصناديق النقدية');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData(1);
  }, [activeTab, loadData]);

  // ══════════════════════════════════════════════════════════════════════
  // Handlers: Create Register
  // ══════════════════════════════════════════════════════════════════════

  const openRegisterModal = () => {
    setRegName('');
    setRegCode('');
    setRegCurrencyId(currencies[0]?.id || '');
    setRegOpeningBalance(0);
    setRegIsDefault(false);
    setFormError(null);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setFormError('اسم الصندوق مطلوب');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await cashRegistersApi.create({
        name: regName.trim(),
        code: regCode.trim() || undefined,
        currency_id: regCurrencyId || undefined,
        opening_balance: regOpeningBalance,
        is_default: regIsDefault,
        branch_id: user?.branch_id || null,
      });
      setIsRegisterModalOpen(false);
      loadData(1);
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء الصندوق النقدي');
    } finally {
      setFormLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Handlers: Create Transfer
  // ══════════════════════════════════════════════════════════════════════

  const openTransferModal = () => {
    setFromRegisterId(null);
    setToRegisterId(null);
    setTransferAmount(0);
    setTransferNotes('');
    setTransferError(null);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromRegisterId || !toRegisterId) {
      setTransferError('يرجى اختيار صندوق المحول منه وإليه');
      return;
    }
    if (fromRegisterId === toRegisterId) {
      setTransferError('لا يمكن التحويل إلى نفس الصندوق');
      return;
    }
    if (transferAmount <= 0) {
      setTransferError('مبلغ التحويل يجب أن يكون أكبر من صفر');
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    try {
      await cashRegistersApi.createTransfer({
        from_register_id: fromRegisterId,
        to_register_id: toRegisterId,
        amount: transferAmount,
        notes: transferNotes.trim() || undefined,
      });
      setIsTransferModalOpen(false);
      setActiveTab('transfers');
      loadData(1);
    } catch (err: any) {
      setTransferError(err.message || 'فشل تنفيذ عملية التحويل النقدي');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCancelTransfer = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء وعكس حركة التحويل النقدي؟')) return;
    try {
      await cashRegistersApi.cancelTransfer(id);
      loadData(pagination.page);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء التحويل');
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Export CSV
  // ══════════════════════════════════════════════════════════════════════

  const handleExportCsv = () => {
    if (activeTab === 'registers') {
      const data = registers.map((r) => ({
        'كود الصندوق': r.code,
        'اسم الصندوق': r.name,
        'الفرع': r.branch_name || 'الرئيسي',
        'الحساب المحاسبي': r.account_code,
        'الرصيد الحالي': r.current_balance,
        'العملة': r.currency_code || baseCurrency,
        'الافتراضي': r.is_default ? 'نعم' : 'لا',
      }));
      exportToCsv(data, 'cash_registers');
    } else {
      const data = trans.map((t: any) => ({
        'رقم التحويل': t.transfer_number,
        'التاريخ': t.transfer_date,
        'من صندوق': t.from_register_name,
        'إلى صندوق': t.to_register_name,
        'المبلغ': t.amount,
        'الحالة': t.status,
      }));
      exportToCsv(data, 'cash_transfers');
    }
  };

  const trans = transfers;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            الصناديق النقدية والتحويلات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الخزائن النقدية، متابعة الأرصدة الحالية، وتنفيذ التحويلات النقدية بين الصناديق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={openTransferModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            تحويل نقدي جديد
          </button>
          <button
            type="button"
            onClick={openRegisterModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة صندوق جديد
          </button>
        </div>
      </div>

      {/* Tabs & Refresh Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('registers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'registers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الصناديق النقدية ({registers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'transfers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            سجل التحويلات النقدية
          </button>
        </div>

        <button
          type="button"
          onClick={() => loadData(pagination.page)}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => loadData(pagination.page)} />}

      {/* Content Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="جاري التحميل..." fullHeight />
        ) : activeTab === 'registers' ? (
          registers.length === 0 ? (
            <EmptyState
              title="لا توجد صناديق نقدية"
              description="قم بإنشاء صندوق نقدي للبدء بتسجيل المقبوضات والمصروفات النقدية."
              actionLabel="إضافة صندوق"
              onAction={openRegisterModal}
              icon={<Wallet className="w-8 h-8" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">الكود</th>
                    <th className="py-3 px-4">اسم الصندوق</th>
                    <th className="py-3 px-4">الفرع</th>
                    <th className="py-3 px-4">الحساب المحاسبي</th>
                    <th className="py-3 px-4 text-center">الرصيد الحالي</th>
                    <th className="py-3 px-4 text-center">الافتراضي</th>
                    <th className="py-3 px-4 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registers.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {r.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.branch_name || 'الرئيسي (General)'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {r.account_code} - {r.account_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                        <span
                          className={
                            Number(r.current_balance) < 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }
                        >
                          {Number(r.current_balance || 0).toLocaleString()}{' '}
                          {r.currency_symbol || r.currency_code || baseCurrency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            افتراضي
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          transfers.length === 0 ? (
            <EmptyState
              title="لا توجد تحويلات نقدية"
              description="لم يتم إجراء أي عمليات تحويل نقدي بين الصناديق بعد."
              actionLabel="تحويل نقدي جديد"
              onAction={openTransferModal}
              icon={<ArrowRightLeft className="w-8 h-8" />}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                      <th className="py-3 px-4">رقم التحويل</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">من صندوق</th>
                      <th className="py-3 px-4">إلى صندوق</th>
                      <th className="py-3 px-4 text-center">المبلغ</th>
                      <th className="py-3 px-4 text-center">الحالة</th>
                      <th className="py-3 px-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {t.transfer_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {String(t.transfer_date).slice(0, 10)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {t.from_register_name}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          {t.to_register_name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {Number(t.amount || 0).toLocaleString()} {t.currency_symbol || t.currency_code || baseCurrency}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              t.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {t.status === 'completed' ? 'مكتمل' : 'ملغي'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          {t.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleCancelTransfer(t.id)}
                              title="إلغاء وعكس التحويل"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={loadData} />
            </>
          )
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Modal: Create Register */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="إنشاء صندوق نقدي جديد"
        maxWidth="lg"
      >
        {formError && <ErrorAlert error={formError} className="mb-4" />}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصندوق *</label>
            <input
              type="text"
              required
              placeholder="مثال: صندوق المعرض الرئيسي"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود الصندوق</label>
              <input
                type="text"
                placeholder="تلقائي إذا ترك فارغاً"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة *</label>
              <select
                required
                value={regCurrencyId}
                onChange={(e) => setRegCurrencyId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رصيد الافتتاح</label>
            <input
              type="number"
              step="0.01"
              value={regOpeningBalance}
              onChange={(e) => setRegOpeningBalance(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultReg"
              checked={regIsDefault}
              onChange={(e) => setRegIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isDefaultReg" className="text-xs font-bold text-slate-700 cursor-pointer">
              تعيين كصندوق افتراضي رئيسي للشركة
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ الصندوق'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Modal: Create Transfer */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="إجراء تحويل نقدي بين الصناديق"
        maxWidth="lg"
      >
        {transferError && <ErrorAlert error={transferError} className="mb-4" />}

        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <CashRegisterSelect
            label="من الصندوق (المحول منه) *"
            value={fromRegisterId}
            onChange={(id) => setFromRegisterId(id)}
            required
          />

          <CashRegisterSelect
            label="إلى الصندوق (المحول إليه) *"
            value={toRegisterId}
            onChange={(id) => setToRegisterId(id)}
            excludeId={fromRegisterId}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المراد تحويله *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحويل</label>
            <textarea
              rows={2}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              placeholder="سبب التحويل أو تفاصيل إضافية..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={transferLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {transferLoading ? 'جاري التنفيذ...' : 'تأكيد التحويل النقدي'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};