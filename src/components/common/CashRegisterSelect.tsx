// src/components/common/CashRegisterSelect.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { cashRegistersApi, CashRegister } from '../../api/cashRegistersApi';

interface CashRegisterSelectProps {
  value: string | null;
  onChange: (value: string | null, register?: CashRegister) => void;
  label?: string;
  branchId?: string | null;
  excludeId?: string | null;
  autoSelectDefault?: boolean;
  showBalance?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CashRegisterSelect: React.FC<CashRegisterSelectProps> = ({
  value,
  onChange,
  label = 'الصندوق النقدي',
  branchId = null,
  excludeId = null,
  autoSelectDefault = true,
  showBalance = true,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    cashRegistersApi
      .list({ is_active: true })
      .then((data) => {
        if (active) setRegisters(data);
      })
      .catch(() => {
        if (active) setRegisters([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableRegisters = useMemo(() => {
    if (!excludeId) return registers;
    return registers.filter((r) => r.id !== excludeId);
  }, [registers, excludeId]);

  // الاختيار التلقائي لصندوق الفرع أو الصندوق الافتراضي
  useEffect(() => {
    if (!autoSelectDefault || value || loading || availableRegisters.length === 0) return;

    const branchMatch = branchId
      ? availableRegisters.find((r) => r.branch_id === branchId && r.is_default) ||
        availableRegisters.find((r) => r.branch_id === branchId)
      : null;

    const chosen =
      branchMatch ||
      availableRegisters.find((r) => r.is_default) ||
      availableRegisters[0];

    if (chosen) {
      onChange(chosen.id, chosen);
    }
  }, [autoSelectDefault, value, loading, availableRegisters, branchId, onChange]);

  const selectedRegister = useMemo(
    () => availableRegisters.find((r) => r.id === value),
    [availableRegisters, value]
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {required && '*'}
        </label>
      )}

      <select
        required={required}
        disabled={disabled || loading || availableRegisters.length === 0}
        value={value || ''}
        onChange={(e) => {
          const id = e.target.value || null;
          const found = availableRegisters.find((r) => r.id === id);
          onChange(id, found);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
      >
        {loading ? (
          <option value="">جاري تحميل الصناديق...</option>
        ) : availableRegisters.length === 0 ? (
          <option value="">لا توجد صناديق نشطة</option>
        ) : (
          <>
            {!required && <option value="">-- الصندوق الافتراضي تلقائياً --</option>}
            {availableRegisters.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name} ({reg.code})
                {reg.branch_name ? ` - ${reg.branch_name}` : ''}
                {reg.is_default ? ' ★' : ''}
                {showBalance
                  ? ` [${Number(reg.current_balance || 0).toLocaleString()} ${reg.currency_symbol || reg.currency_code || ''}]`
                  : ''}
              </option>
            ))}
          </>
        )}
      </select>

      {showBalance && selectedRegister && (
        <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
          <span>
            الحساب: <span className="font-mono">{selectedRegister.account_code}</span>
          </span>
          <span
            className={`font-mono font-bold ${
              Number(selectedRegister.current_balance) < 0
                ? 'text-rose-600'
                : 'text-emerald-700'
            }`}
          >
            الرصيد: {Number(selectedRegister.current_balance || 0).toLocaleString()}{' '}
            {selectedRegister.currency_symbol || selectedRegister.currency_code || ''}
          </span>
        </p>
      )}
    </div>
  );
};