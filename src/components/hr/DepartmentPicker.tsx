// components/hr/DepartmentPicker.tsx
import React from 'react';
import { Department } from '../../types/hr';

interface Props {
  departments: Department[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DepartmentPicker: React.FC<Props> = ({
  departments,
  value,
  onChange,
  placeholder = 'اختر القسم',
  required,
  disabled,
}) => {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      required={required}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
    >
      <option value="">{placeholder}</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  );
};