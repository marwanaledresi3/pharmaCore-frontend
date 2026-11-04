import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  FolderTree,
  ChevronDown,
  ChevronRight,
  FileText,
  Printer,
  Edit2,
  Trash2,
} from 'lucide-react';
import { accountsApi } from '../api/accountsApi';
import { Account } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { PrintPreviewModal } from '../components/common/PrintPreviewModal';
import { useAuth } from '../context/AuthContext';

export const AccountsPage: React.FC = () => {
  const { company } = useAuth();
  const baseCurrency = company?.currency_code || 'YER';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tree, setTree] = useState<Account[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Account Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<string>('asset');
  const [parentId, setParentId] = useState<string>('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Account Ledger Modal
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Print ledger modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const typeParam = typeFilter === 'all' ? undefined : typeFilter;
      const [treeRes, flatRes] = await Promise.all([
        accountsApi.getTree(),
        accountsApi.list({ type: typeParam }),
      ]);
      setTree(Array.isArray(treeRes) ? treeRes : []);
      setAccounts(flatRes);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل دليل الحسابات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const openAddModal = (parent?: Account) => {
    setCode(parent ? `${parent.code}01` : '');
    setName('');
    setAccountType(parent ? parent.account_type : 'asset');
    setParentId(parent ? parent.id : '');
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError('رمز الحساب واسم الحساب حقول إلزامية');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await accountsApi.create({
        code: code.trim(),
        name: name.trim(),
        account_type: accountType,
        parent_id: parentId || undefined,
      });
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة الحساب');
    } finally {
      setFormLoading(false);
    }
  };

  const openLedgerModal = async (acc: Account) => {
    setSelectedAccount(acc);
    setIsLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const res = await accountsApi.getLedger(acc.id);
      setLedgerEntries(Array.isArray(res) ? res : []);
    } catch {
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const getAccountTypeName = (type: string) => {
    const map: Record<string, string> = {
      asset: 'أصول (Assets)',
      liability: 'خصوم / التزامات (Liabilities)',
      equity: 'حقوق ملكية (Equity)',
      revenue: 'إيرادات (Revenue)',
      expense: 'مصروفات (Expenses)',
    };
    return map[type] || type;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: Account, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 ${
            depth === 0 ? 'bg-slate-50/70 font-bold' : ''
          }`}
          style={{ marginRight: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
              {node.code}
            </span>
            <span className="text-xs text-slate-900 font-semibold">{node.name}</span>
            <span className="text-[10px] text-slate-400">({getAccountTypeName(node.account_type)})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openLedgerModal(node)}
              title="كشف حساب الأستاذ"
              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openAddModal(node)}
              title="إضافة حساب فرعي"
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && (
          <div className="border-r border-slate-200 pr-2 mr-2 space-y-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">شجرة الحسابات (دليل الحسابات)</h1>
          <p className="text-xs text-slate-500 mt-1">
            دليل الحسابات الموحد، مستويات الأصول والخصوم والمصروفات، ودفاتر الأستاذ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة حساب جديد
          </button>
        </div>
      </div>

      {/* Filter and Mode Switcher */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'tree'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            عرض شجري
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'flat'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جدول مسطح
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">جميع أنواع الحسابات</option>
            <option value="asset">الأصول</option>
            <option value="liability">الخصوم والالتزامات</option>
            <option value="equity">حقوق الملكية</option>
            <option value="revenue">الإيرادات</option>
            <option value="expense">المصروفات</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={loadData} />}

      {/* Accounts Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6">
        {isLoading ? (
          <LoadingSpinner message="جاري جلب شجرة الحسابات..." fullHeight />
        ) : viewMode === 'tree' ? (
          tree.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">لا توجد حسابات مسجلة</p>
          ) : (
            <div className="space-y-2">{tree.map((node) => renderTreeNode(node, 0))}</div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">رمز الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب</th>
                  <th className="py-2.5 px-3">النوع المحاسبي</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{acc.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{acc.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{getAccountTypeName(acc.account_type)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={acc.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-2.5 px-3 text-left">
                      <button
                        type="button"
                        onClick={() => openLedgerModal(acc)}
                        title="كشف حساب الأستاذ"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        كشف الأستاذ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="إضافة حساب مالي جديد">
        {formError && <ErrorAlert error={formError} className="mb-4" />}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز الحساب *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: 1101"
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">النوع المحاسبي *</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              >
                <option value="asset">أصول (Assets)</option>
                <option value="liability">خصوم / التزامات (Liabilities)</option>
                <option value="equity">حقوق ملكية (Equity)</option>
                <option value="revenue">إيرادات (Revenue)</option>
                <option value="expense">مصروفات (Expenses)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: صندوق فرع شارع الستين"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الحساب الرئيسي (الأب)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            >
              <option value="">-- حساب رئيسي (بدون أب) --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'حفظ الحساب'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Account Ledger Modal */}
      {selectedAccount && (
        <Modal
          isOpen={isLedgerOpen}
          onClose={() => setIsLedgerOpen(false)}
          title={`كشف حساب دفتر الأستاذ: ${selectedAccount.code} - ${selectedAccount.name}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">حركات القيود اليومية المرتبطة بالحساب:</span>
              <button
                type="button"
                onClick={() => setIsPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                معاينة وطباعة الكشف
              </button>
            </div>

            {ledgerLoading ? (
              <LoadingSpinner message="جاري جلب حركات دفتر الأستاذ..." />
            ) : ledgerEntries.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                لا توجد حركات قيود مسجلة لهذا الحساب حتى الآن.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">رقم القيد</th>
                      <th className="p-2.5">البيان والشرح</th>
                      <th className="p-2.5 text-center">مدين</th>
                      <th className="p-2.5 text-center">دائن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono">{String(l.entry_date).slice(0, 10)}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">
                          #{l.entry_number}
                        </td>
                        <td className="p-2.5 text-slate-700">{l.description}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                          {Number(l.debit || 0) > 0 ? Number(l.debit).toLocaleString() : '-'}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-700">
                          {Number(l.credit || 0) > 0 ? Number(l.credit).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLedgerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Ledger Modal */}
      {selectedAccount && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`كشف حساب دفتر الأستاذ`}
          documentType="كشف حساب أستاذ"
          documentNumber={selectedAccount.code}
          documentDate={new Date().toISOString().slice(0, 10)}
          partyTitle="الحساب"
          partyName={`${selectedAccount.code} - ${selectedAccount.name}`}
          currencyCode={baseCurrency}
          company={company}
          summary={[
            {
              label: 'إجمالي الحركات المدنية',
              value: ledgerEntries.reduce((sum, it) => sum + (Number(it.debit) || 0), 0),
            },
            {
              label: 'إجمالي الحركات الدائنة',
              value: ledgerEntries.reduce((sum, it) => sum + (Number(it.credit) || 0), 0),
            },
          ]}
        />
      )}
    </div>
  );
};
