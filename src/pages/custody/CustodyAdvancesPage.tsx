// pages/custody/CustodyAdvancesPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Banknote,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Receipt,
  Eye,
} from 'lucide-react';
import { custodyApi } from '../../api/custodyApi';
import type {
  CustodyType,
  Custody,
  EmployeeAdvance,
  CustodyStatus,
  CustodyTransactionType,
  AdvanceType,
  AdvanceStatus,
} from '../../types/custody';

type MainTab = 'custodies' | 'advances';

const CUSTODY_STATUS: Record<CustodyStatus, { label: string; cls: string }> = {
  open: { label: 'مفتوحة', cls: 'bg-emerald-100 text-emerald-800' },
  partially_settled: { label: 'مسواة جزئياً', cls: 'bg-amber-100 text-amber-800' },
  settled: { label: 'مسواة بالكامل', cls: 'bg-slate-200 text-slate-700' },
  overdue: { label: 'متأخرة', cls: 'bg-rose-100 text-rose-800' },
  cancelled: { label: 'ملغاة', cls: 'bg-slate-100 text-slate-500' },
};

const ADVANCE_STATUS: Record<AdvanceStatus, { label: string; cls: string }> = {
  pending: { label: 'بانتظار الاعتماد', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'معتمدة', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'مرفوضة', cls: 'bg-rose-100 text-rose-800' },
  paid: { label: 'مسددة بالكامل', cls: 'bg-sky-100 text-sky-800' },
  cancelled: { label: 'ملغاة', cls: 'bg-slate-100 text-slate-500' },
};

const ADVANCE_TYPE_LABEL: Record<AdvanceType, string> = {
  salary_advance: 'سلفة راتب',
  loan: 'قرض',
  emergency: 'سلفة طارئة',
};

const fmtMoney = (v: number | string | null | undefined) =>
  Number(v || 0).toLocaleString('ar-YE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const CustodyAdvancesPage: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('custodies');

  const [types, setTypes] = useState<CustodyType[]>([]);
  const [custodies, setCustodies] = useState<Custody[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [custodyStatus, setCustodyStatus] = useState<string>('');
  const [advanceStatus, setAdvanceStatus] = useState<string>('');

  // Create Custody modal
  const [showNewCustody, setShowNewCustody] = useState(false);
  const [custodyForm, setCustodyForm] = useState({
    custody_type_id: '',
    holder_employee_id: '',
    amount: '',
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    description: '',
    notes: '',
  });

  // Custody Transaction modal
  const [txCustody, setTxCustody] = useState<Custody | null>(null);
  const [txForm, setTxForm] = useState({
    transaction_type: 'spend' as CustodyTransactionType,
    amount: '',
    transaction_date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  // Custody Details drawer/modal
  const [detailCustody, setDetailCustody] = useState<Custody | null>(null);

  // Create Advance modal
  const [showNewAdvance, setShowNewAdvance] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    advance_type: 'salary_advance' as AdvanceType,
    amount: '',
    installments_count: '1',
    installment_amount: '',
    request_date: new Date().toISOString().slice(0, 10),
    first_installment_date: '',
    notes: '',
  });

  // Advance Details & Installments modal
  const [detailAdvance, setDetailAdvance] = useState<EmployeeAdvance | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, custRes, advRes] = await Promise.all([
        custodyApi.listTypes(),
        custodyApi.listCustodies({
          status: (custodyStatus as CustodyStatus) || undefined,
          limit: 50,
        }),
        custodyApi.listAdvances({
          status: (advanceStatus as AdvanceStatus) || undefined,
          limit: 50,
        }),
      ]);
      setTypes(typesRes);
      setCustodies(custRes.items);
      setAdvances(advRes.items);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل بيانات العهد والسلف');
    } finally {
      setLoading(false);
    }
  }, [custodyStatus, advanceStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await custodyApi.createCustody({
        custody_type_id: custodyForm.custody_type_id,
        holder_employee_id: custodyForm.holder_employee_id.trim(),
        amount: Number(custodyForm.amount || 0),
        issued_date: custodyForm.issued_date,
        due_date: custodyForm.due_date || null,
        description: custodyForm.description.trim() || null,
        notes: custodyForm.notes.trim() || null,
      });
      setShowNewCustody(false);
      setCustodyForm({
        custody_type_id: '',
        holder_employee_id: '',
        amount: '',
        issued_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        description: '',
        notes: '',
      });
      setNotice('تم إنشاء العهدة بنجاح');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'تعذر إنشاء العهدة');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txCustody) return;
    setError(null);
    setNotice(null);
    try {
      await custodyApi.addTransaction(txCustody.id, {
        transaction_type: txForm.transaction_type,
        amount: Number(txForm.amount || 0),
        transaction_date: txForm.transaction_date,
        description: txForm.description.trim() || null,
      });
      setTxCustody(null);
      setNotice('تم تسجيل حركة العهدة وتحديث حالتها');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'تعذر تسجيل حركة العهدة');
    }
  };

  const handleOpenCustodyDetails = async (id: string) => {
    setError(null);
    try {
      const full = await custodyApi.getCustody(id);
      setDetailCustody(full);
    } catch (err: any) {
      setError(err?.message || 'تعذر جلب تفاصيل العهدة');
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await custodyApi.createAdvance({
        employee_id: advanceForm.employee_id.trim(),
        advance_type: advanceForm.advance_type,
        amount: Number(advanceForm.amount),
        installments_count: Number(advanceForm.installments_count || 1),
        installment_amount: advanceForm.installment_amount
          ? Number(advanceForm.installment_amount)
          : null,
        request_date: advanceForm.request_date,
        first_installment_date: advanceForm.first_installment_date || null,
        notes: advanceForm.notes.trim() || null,
      });
      setShowNewAdvance(false);
      setAdvanceForm({
        employee_id: '',
        advance_type: 'salary_advance',
        amount: '',
        installments_count: '1',
        installment_amount: '',
        request_date: new Date().toISOString().slice(0, 10),
        first_installment_date: '',
        notes: '',
      });
      setNotice('تم إنشاء طلب السلفة بنجاح');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'تعذر إنشاء طلب السلفة');
    }
  };

  const handleApproveAdvance = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      await custodyApi.approveAdvance(id);
      setNotice('تم اعتماد السلفة وتوليد جدول الأقساط');
      await loadAll();
      if (detailAdvance?.id === id) {
        const updated = await custodyApi.getAdvance(id);
        setDetailAdvance(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر اعتماد السلفة');
    }
  };

  const handleRejectAdvance = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      await custodyApi.rejectAdvance(id);
      setNotice('تم رفض السلفة');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'تعذر رفض السلفة');
    }
  };

  const handleOpenAdvanceDetails = async (id: string) => {
    setError(null);
    try {
      const full = await custodyApi.getAdvance(id);
      setDetailAdvance(full);
    } catch (err: any) {
      setError(err?.message || 'تعذر جلب تفاصيل السلفة');
    }
  };

  const handlePayInstallment = async (installmentId: string, remainingAmt: number) => {
    setError(null);
    setNotice(null);
    try {
      await custodyApi.payInstallment(installmentId, { amount: remainingAmt });
      setNotice('تم سداد القسط بنجاح');
      await loadAll();
      if (detailAdvance) {
        const updated = await custodyApi.getAdvance(detailAdvance.id);
        setDetailAdvance(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر سداد القسط');
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">العهد والسلف</h1>
            <p className="text-xs text-slate-500">
              متابعة عهد الموظفين، التسويات، وطلبات السلف والأقساط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          {tab === 'custodies' ? (
            <button
              type="button"
              onClick={() => setShowNewCustody(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              عهدة جديدة
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewAdvance(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              طلب سلفة
            </button>
          )}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('custodies')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'custodies'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          العهد ({custodies.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('advances')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'advances'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4" />
          السلف والأقساط ({advances.length})
        </button>
      </div>

      {/* Custodies Tab */}
      {tab === 'custodies' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 border border-slate-100">
            <select
              value={custodyStatus}
              onChange={(e) => setCustodyStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="">كل حالات العهد</option>
              {Object.entries(CUSTODY_STATUS).map(([k, v]) => (
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
                  <th className="py-3 px-4">رقم العهدة</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">المسوى</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">تاريخ الصرف</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {custodies.map((c) => {
                  const st = CUSTODY_STATUS[c.status] || {
                    label: c.status,
                    cls: 'bg-slate-100 text-slate-700',
                  };
                  const canAct = !['settled', 'cancelled'].includes(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.custody_number}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.custody_type_name || '-'}
                      </td>
                      <td className="py-3 px-4 font-bold">{fmtMoney(c.amount)}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {fmtMoney(c.settled_amount)}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        {fmtMoney(c.remaining_amount)}
                      </td>
                      <td className="py-3 px-4">{String(c.issued_date).slice(0, 10)}</td>
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
                            title="التفاصيل والحركات"
                            onClick={() => handleOpenCustodyDetails(c.id)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="تسجيل حركة / تسوية"
                            disabled={!canAct}
                            onClick={() => {
                              setTxCustody(c);
                              setTxForm({
                                transaction_type: 'spend',
                                amount: '',
                                transaction_date: new Date().toISOString().slice(0, 10),
                                description: '',
                              });
                            }}
                            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && custodies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد عهد مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advances Tab */}
      {tab === 'advances' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 border border-slate-100">
            <select
              value={advanceStatus}
              onChange={(e) => setAdvanceStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="">كل حالات السلف</option>
              {Object.entries(ADVANCE_STATUS).map(([k, v]) => (
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
                  <th className="py-3 px-4">رقم السلفة</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">الأقساط</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.map((a) => {
                  const st = ADVANCE_STATUS[a.status] || {
                    label: a.status,
                    cls: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.advance_number}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {ADVANCE_TYPE_LABEL[a.advance_type] || a.advance_type}
                      </td>
                      <td className="py-3 px-4 font-bold">{fmtMoney(a.amount)}</td>
                      <td className="py-3 px-4 text-slate-600">{fmtMoney(a.paid_amount)}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        {fmtMoney(a.remaining_amount)}
                      </td>
                      <td className="py-3 px-4 font-mono">{a.installments_count}</td>
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
                            title="الأقساط والتفاصيل"
                            onClick={() => handleOpenAdvanceDetails(a.id)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {a.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                title="اعتماد"
                                onClick={() => handleApproveAdvance(a.id)}
                                className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="رفض"
                                onClick={() => handleRejectAdvance(a.id)}
                                className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && advances.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد سلف مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Custody Modal */}
      {showNewCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateCustody}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">إنشاء عهدة جديدة</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">نوع العهدة *</label>
                <select
                  required
                  value={custodyForm.custody_type_id}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, custody_type_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">اختر النوع</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.kind})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">معرف الموظف المستلم (UUID) *</label>
                <input
                  required
                  value={custodyForm.holder_employee_id}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, holder_employee_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">المبلغ *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={custodyForm.amount}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, amount: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={custodyForm.issued_date}
                    onChange={(e) =>
                      setCustodyForm({ ...custodyForm, issued_date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={custodyForm.due_date}
                    onChange={(e) =>
                      setCustodyForm({ ...custodyForm, due_date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">الوصف</label>
                <input
                  value={custodyForm.description}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCustody(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custody Transaction Modal */}
      {txCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleAddTransaction}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">
              حركة على العهدة: {txCustody.custody_number}
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">نوع الحركة</label>
                <select
                  value={txForm.transaction_type}
                  onChange={(e) =>
                    setTxForm({
                      ...txForm,
                      transaction_type: e.target.value as CustodyTransactionType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="spend">إنفاق من العهدة</option>
                  <option value="return">استرداد نقدية</option>
                  <option value="settle">تسوية نهائية</option>
                  <option value="adjustment">تسوية/تعديل</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">المبلغ *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">التاريخ</label>
                <input
                  type="date"
                  value={txForm.transaction_date}
                  onChange={(e) =>
                    setTxForm({ ...txForm, transaction_date: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">البيان</label>
                <input
                  value={txForm.description}
                  onChange={(e) =>
                    setTxForm({ ...txForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTxCustody(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
              >
                تنفيذ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custody Details Modal */}
      {detailCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                تفاصيل العهدة: {detailCustody.custody_number}
              </h2>
              <button
                type="button"
                onClick={() => setDetailCustody(null)}
                className="rounded-lg px-2.5 py-1 bg-slate-100 font-bold"
              >
                إغلاق
              </button>
            </div>
            <p className="text-slate-600">{detailCustody.description || 'بدون وصف'}</p>
            <div>
              <h3 className="font-black text-slate-800 mb-2">حركات العهدة</h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {(detailCustody.transactions || []).map((tx) => (
                  <div key={tx.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{tx.transaction_type}</span>
                      <span className="text-slate-500 mr-2">
                        {String(tx.transaction_date).slice(0, 10)}
                      </span>
                      {tx.description && (
                        <div className="text-slate-500">{tx.description}</div>
                      )}
                    </div>
                    <span className="font-black text-emerald-700">{fmtMoney(tx.amount)}</span>
                  </div>
                ))}
                {(detailCustody.transactions || []).length === 0 && (
                  <p className="p-4 text-center text-slate-400">لا توجد حركات مسجلة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Advance Modal */}
      {showNewAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateAdvance}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-black text-slate-900">طلب سلفة جديدة</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">معرف الموظف (UUID) *</label>
                <input
                  required
                  value={advanceForm.employee_id}
                  onChange={(e) =>
                    setAdvanceForm({ ...advanceForm, employee_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">نوع السلفة</label>
                <select
                  value={advanceForm.advance_type}
                  onChange={(e) =>
                    setAdvanceForm({
                      ...advanceForm,
                      advance_type: e.target.value as AdvanceType,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="salary_advance">سلفة راتب</option>
                  <option value="loan">قرض</option>
                  <option value="emergency">سلفة طارئة</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">المبلغ *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={advanceForm.amount}
                    onChange={(e) =>
                      setAdvanceForm({ ...advanceForm, amount: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عدد الأقساط</label>
                  <input
                    type="number"
                    min="1"
                    value={advanceForm.installments_count}
                    onChange={(e) =>
                      setAdvanceForm({
                        ...advanceForm,
                        installments_count: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">تاريخ أول قسط</label>
                <input
                  type="date"
                  value={advanceForm.first_installment_date}
                  onChange={(e) =>
                    setAdvanceForm({
                      ...advanceForm,
                      first_installment_date: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">ملاحظات</label>
                <input
                  value={advanceForm.notes}
                  onChange={(e) =>
                    setAdvanceForm({ ...advanceForm, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewAdvance(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
              >
                إرسال الطلب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Advance Installments Modal */}
      {detailAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                أقساط السلفة: {detailAdvance.advance_number}
              </h2>
              <button
                type="button"
                onClick={() => setDetailAdvance(null)}
                className="rounded-lg px-2.5 py-1 bg-slate-100 font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {(detailAdvance.installments || []).map((inst) => {
                const rem = Number((Number(inst.amount) - Number(inst.paid_amount)).toFixed(2));
                return (
                  <div key={inst.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        قسط #{inst.installment_no} — استحقاق{' '}
                        {String(inst.due_date).slice(0, 10)}
                      </div>
                      <div className="text-slate-500">
                        المبلغ: {fmtMoney(inst.amount)} • المسدد: {fmtMoney(inst.paid_amount)} •
                        الحالة: {inst.status}
                      </div>
                    </div>
                    {rem > 0 && inst.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handlePayInstallment(inst.id, rem)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 font-black text-white hover:bg-emerald-700"
                      >
                        سداد ({fmtMoney(rem)})
                      </button>
                    )}
                  </div>
                );
              })}
              {(detailAdvance.installments || []).length === 0 && (
                <p className="p-4 text-center text-slate-400">
                  لم يتم توليد أقساط بعد (تُولّد تلقائياً عند اعتماد السلفة)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustodyAdvancesPage;