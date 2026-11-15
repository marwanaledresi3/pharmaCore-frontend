import React, { useState, useEffect, useMemo } from 'react';
import {
  X, FileText, TrendingUp, TrendingDown, Plus, Trash2,
  Search, Calculator, AlertTriangle, CheckCircle,
  User, Truck, Link2, ChevronDown,
} from 'lucide-react';
import { notesApi, NoteType, PartyType, NoteReason } from '../../api/notesApi';
import { customersApi } from '../../api/customersApi';
import { suppliersApi } from '../../api/suppliersApi';
import { invoicesApi } from '../../api/invoicesApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const REASONS: Array<{ value: NoteReason; label: string }> = [
  { value: 'return',      label: 'مرتجع' },
  { value: 'discount',    label: 'خصم' },
  { value: 'correction',  label: 'تصحيح' },
  { value: 'price_diff',  label: 'فرق سعر' },
  { value: 'shipping',    label: 'شحن' },
  { value: 'other',       label: 'أخرى' },
];

interface LineItem {
  _key: string;
  product_id: string | null;
  description: string;
  quantity: number | '';
  unit_price: number | '';
  discount_rate: number | '';
  tax_rate: number | '';
}

const newLine = (): LineItem => ({
  _key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  product_id: null,
  description: '',
  quantity: 1,
  unit_price: '',
  discount_rate: 0,
  tax_rate: 0,
});

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId?: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const CreateNoteModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  // ─── Type ───
  const [noteType, setNoteType] = useState<NoteType>('credit');
  const [partyType, setPartyType] = useState<PartyType>('customer');

  // ─── Party ───
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [partyLoading, setPartyLoading] = useState(false);

  // ─── Invoice (optional) ───
  const [invoiceId, setInvoiceId] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // ─── Header ───
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<NoteReason>('return');
  const [description, setDescription] = useState('');

  // ─── Items ───
  const [lines, setLines] = useState<LineItem[]>([newLine()]);

  // ─── UI ───
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══ Load parties ═══
  useEffect(() => {
    if (!isOpen) return;
    setPartyLoading(true);
    (async () => {
      try {
        const [custRes, suppRes] = await Promise.all([
          customersApi.list({ limit: 100 }).catch(() => ({ items: [] })),
          suppliersApi.list({ limit: 100 }).catch(() => ({ items: [] })),
        ]);
        setCustomers(custRes.items || []);
        setSuppliers(suppRes.items || []);
      } catch {
        /* silent */
      } finally {
        setPartyLoading(false);
      }
    })();
  }, [isOpen]);

  // ═══ Reset on close ═══
  useEffect(() => {
    if (!isOpen) {
      setNoteType('credit');
      setPartyType('customer');
      setCustomerId('');
      setSupplierId('');
      setCustomerSearch('');
      setSupplierSearch('');
      setInvoiceId('');
      setInvoices([]);
      setInvoiceSearch('');
      setNoteDate(new Date().toISOString().slice(0, 10));
      setReason('return');
      setDescription('');
      setLines([newLine()]);
      setError(null);
    }
  }, [isOpen]);

  // ═══ Load invoices when party changes ═══
  useEffect(() => {
    if (!isOpen) return;
    const partyId = partyType === 'customer' ? customerId : supplierId;
    if (!partyId) {
      setInvoices([]);
      setInvoiceId('');
      return;
    }
    (async () => {
      try {
        const params: any = {
          limit: 100,
          invoice_type: partyType === 'customer' ? 'sales' : 'purchase',
          status: 'unpaid,partial,paid',  // كل الفواتير
        };
        if (partyType === 'customer') params.customer_id = partyId;
        else params.supplier_id = partyId;

        const res = await invoicesApi.list(params).catch(() => ({ items: [] }));
        setInvoices(res.items || []);
      } catch {
        /* silent */
      }
    })();
  }, [isOpen, customerId, supplierId, partyType]);

  // ═══ Filtered lists ═══
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }, [suppliers, supplierSearch]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return invoices;
    const q = invoiceSearch.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(q) ||
        String(i.total).includes(q)
    );
  }, [invoices, invoiceSearch]);

  // ═══ Line handlers ═══
  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (key: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  // ═══ Calculations ═══
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const line of lines) {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      const discRate = Number(line.discount_rate) || 0;
      const taxRate = Number(line.tax_rate) || 0;

      if (qty <= 0 || price < 0) continue;

      const lineSubtotal = qty * price;
      const discAmount = (lineSubtotal * discRate) / 100;
      const net = lineSubtotal - discAmount;
      const taxAmount = (net * taxRate) / 100;

      subtotal += net;
      discountTotal += discAmount;
      taxTotal += taxAmount;
    }

    const total = subtotal + taxTotal;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [lines]);

  // ═══ Journal preview ═══
  const journalPreview = useMemo(() => {
    if (totals.total <= 0) return null;

    const isCustomer = partyType === 'customer';
    const isCredit = noteType === 'credit';

    if (isCredit && isCustomer) {
      return {
        dr: { name: 'مرتجع مبيعات (411)', amount: totals.total },
        cr: { name: 'ذمم عملاء (112)', amount: totals.total },
        label: 'إشعار دائن لعميل — تخفيض ذمته',
      };
    }
    if (isCredit && !isCustomer) {
      return {
        dr: { name: 'ذمم موردين (211)', amount: totals.total },
        cr: { name: 'مرتجع مشتريات (511)', amount: totals.total },
        label: 'إشعار دائن لمورد — تخفيض مستحقاته',
      };
    }
    if (!isCredit && isCustomer) {
      return {
        dr: { name: 'ذمم عملاء (112)', amount: totals.total },
        cr: { name: 'إيرادات أخرى (411)', amount: totals.total },
        label: 'إشعار مدين لعميل — زيادة ذمته',
      };
    }
    return {
      dr: { name: 'مصاريف أخرى (518)', amount: totals.total },
      cr: { name: 'ذمم موردين (211)', amount: totals.total },
      label: 'إشعار مدين لمورد — زيادة مستحقاته',
    };
  }, [partyType, noteType, totals]);

  // ═══ Submit ═══
  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (partyType === 'customer' && !customerId) {
      return setError('اختر العميل');
    }
    if (partyType === 'supplier' && !supplierId) {
      return setError('اختر المورد');
    }

    const validLines = lines.filter(
      (l) => Number(l.quantity) > 0 && Number(l.unit_price) >= 0 && l.description.trim()
    );
    if (validLines.length === 0) {
      return setError('أضف بنداً واحداً على الأقل مع وصف وكمية وسعر');
    }
    if (totals.total <= 0) {
      return setError('إجمالي الإشعار يجب أن يكون أكبر من صفر');
    }

    setSaving(true);
    try {
      const res = await notesApi.create({
        note_type: noteType,
        party_type: partyType,
        customer_id: partyType === 'customer' ? customerId : undefined,
        supplier_id: partyType === 'supplier' ? supplierId : undefined,
        invoice_id: invoiceId || undefined,
        note_date: noteDate,
        reason,
        description: description.trim() || undefined,
        items: validLines.map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          discount_rate: Number(l.discount_rate) || 0,
          tax_rate: Number(l.tax_rate) || 0,
          product_id: l.product_id || undefined,
        })),
      });
      onCreated(res.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الإشعار');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">
              إشعار {noteType === 'credit' ? 'دائن' : 'مدين'} جديد
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══ Body ═══ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <ErrorAlert message={error} />}

          {/* ─── 1) النوع ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع الإشعار
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNoteType('credit')}
                  disabled={saving}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition ${
                    noteType === 'credit'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  إشعار دائن
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('debit')}
                  disabled={saving}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition ${
                    noteType === 'debit'
                      ? 'bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  إشعار مدين
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {noteType === 'credit'
                  ? 'تخفيض ذمة الطرف (مرتجع، خصم، تصحيح)'
                  : 'زيادة ذمة الطرف (بند منسي، فرق سعر)'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع الطرف
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPartyType('customer');
                    setSupplierId('');
                  }}
                  disabled={saving}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition ${
                    partyType === 'customer'
                      ? 'bg-sky-50 border-sky-600 text-sky-800 ring-2 ring-sky-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  عميل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPartyType('supplier');
                    setCustomerId('');
                  }}
                  disabled={saving}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition ${
                    partyType === 'supplier'
                      ? 'bg-purple-50 border-purple-600 text-purple-800 ring-2 ring-purple-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  مورد
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {partyType === 'customer' ? 'العميل الذي سيُعدّل رصيده' : 'المورد الذي سيُعدّل رصيده'}
              </p>
            </div>
          </div>

          {/* ─── 2) اختيار الطرف ─── */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {partyType === 'customer' ? 'العميل *' : 'المورد *'}
            </label>

            {partyLoading ? (
              <div className="py-4 text-center text-xs text-slate-500">جاري التحميل...</div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={partyType === 'customer' ? customerSearch : supplierSearch}
                    onChange={(e) =>
                      partyType === 'customer'
                        ? setCustomerSearch(e.target.value)
                        : setSupplierSearch(e.target.value)
                    }
                    placeholder="ابحث بالاسم أو الهاتف..."
                    disabled={saving}
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-2"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-1">
                  {(partyType === 'customer' ? filteredCustomers : filteredSuppliers).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">لا توجد نتائج</p>
                  ) : (
                    (partyType === 'customer' ? filteredCustomers : filteredSuppliers).map((p) => {
                      const isSelected =
                        partyType === 'customer' ? customerId === p.id : supplierId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (partyType === 'customer') setCustomerId(p.id);
                            else setSupplierId(p.id);
                          }}
                          disabled={saving}
                          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded-lg transition ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-right flex-1 min-w-0">
                            <p className="font-bold truncate">{p.name}</p>
                            {p.phone && <p className="text-[10px] text-slate-500 font-mono">{p.phone}</p>}
                          </div>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {(selectedCustomer || selectedSupplier) && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">
                  {selectedCustomer?.name || selectedSupplier?.name}
                </span>
              </div>
            )}
          </div>

          {/* ─── 3) الفاتورة (اختياري) ─── */}
          {(customerId || supplierId) && invoices.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                ربط بفاتورة (اختياري)
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="ابحث برقم الفاتورة..."
                  disabled={saving}
                  className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-2"
                />
              </div>
              <select
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="">بدون ربط</option>
                {filteredInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {Number(inv.total).toFixed(2)}
                    {inv.paid_amount < inv.total ? ' (غير مدفوع)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ─── 4) تفاصيل الإشعار ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الإشعار
              </label>
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                السبب *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as NoteReason)}
                disabled={saving}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف / ملاحظات
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              disabled={saving}
              placeholder="سبب الإشعار..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ─── 5) البنود ─── */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">البنود</h3>
              </div>
              <button
                type="button"
                onClick={addLine}
                disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة بند
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right px-2 py-2 font-bold text-slate-700 min-w-[180px]">الوصف *</th>
                    <th className="text-center px-2 py-2 font-bold text-slate-700 w-20">الكمية</th>
                    <th className="text-center px-2 py-2 font-bold text-slate-700 w-24">السعر</th>
                    <th className="text-center px-2 py-2 font-bold text-slate-700 w-20">خصم %</th>
                    <th className="text-center px-2 py-2 font-bold text-slate-700 w-20">ضريبة %</th>
                    <th className="text-left px-2 py-2 font-bold text-slate-700 w-24">الإجمالي</th>
                    <th className="px-1 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const qty = Number(line.quantity) || 0;
                    const price = Number(line.unit_price) || 0;
                    const discRate = Number(line.discount_rate) || 0;
                    const taxRate = Number(line.tax_rate) || 0;
                    const lineSubtotal = qty * price;
                    const disc = (lineSubtotal * discRate) / 100;
                    const net = lineSubtotal - disc;
                    const tax = (net * taxRate) / 100;
                    const lineTotal = net + tax;

                    return (
                      <tr key={line._key} className="border-b border-slate-100">
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line._key, 'description', e.target.value)}
                            disabled={saving}
                            placeholder="وصف البند..."
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line._key, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            disabled={saving}
                            className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(line._key, 'unit_price', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            disabled={saving}
                            className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={line.discount_rate}
                            onChange={(e) =>
                              updateLine(line._key, 'discount_rate', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            disabled={saving}
                            className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={line.tax_rate}
                            onChange={(e) =>
                              updateLine(line._key, 'tax_rate', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            disabled={saving}
                            className="w-full px-1.5 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        </td>
                        <td className="px-2 py-1 text-left font-mono font-bold text-slate-800">
                          {lineTotal > 0 ? lineTotal.toFixed(2) : '—'}
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(line._key)}
                            disabled={saving || lines.length === 1}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── 6) الإجماليات ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TotalBox label="المجموع" value={totals.subtotal} color="slate" />
            <TotalBox label="الخصم" value={-totals.discountTotal} color="rose" />
            <TotalBox label="الضريبة" value={totals.taxTotal} color="sky" />
            <TotalBox label="الإجمالي" value={totals.total} color="emerald" bold />
          </div>

          {/* ─── 7) معاينة القيد ─── */}
          {journalPreview && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-black text-amber-900">معاينة القيد المحاسبي</p>
              </div>
              <p className="text-[10px] text-amber-700 mb-2">{journalPreview.label}</p>
              <div className="bg-white rounded-lg p-2 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                  <span className="font-bold text-slate-800">Dr {journalPreview.dr.name}</span>
                  <span className="font-bold text-emerald-700">{journalPreview.dr.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>Cr {journalPreview.cr.name}</span>
                  <span>{journalPreview.cr.amount.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-700 mt-1">
                * سيُنشأ القيد تلقائياً عند تأكيد الإشعار
              </p>
            </div>
          )}
        </div>

        {/* ═══ Footer ═══ */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-600">
            {lines.length} بند ·{' '}
            <span className="font-bold font-mono">{totals.total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || totals.total <= 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  حفظ كمسودة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══ Sub-component ═══
const TotalBox: React.FC<{
  label: string;
  value: number;
  color: 'slate' | 'rose' | 'sky' | 'emerald';
  bold?: boolean;
}> = ({ label, value, color, bold }) => {
  const colors = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  return (
    <div className={`p-2 rounded-lg border ${colors[color]}`}>
      <p className="text-[10px] font-bold opacity-80">{label}</p>
      <p className={`font-mono ${bold ? 'text-base font-black' : 'text-sm font-bold'}`}>
        {value.toFixed(2)}
      </p>
    </div>
  );
};