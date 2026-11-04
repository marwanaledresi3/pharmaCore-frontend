import React from 'react';
import { Building2, Package } from 'lucide-react';
import { b2bApi } from '../../../api/b2bApi';
import { Supplier } from '../../../types';

interface Props {
  supplier?: Supplier;
  size?: 'sm' | 'md';
}

export const SupplierKindBadge: React.FC<Props> = ({ supplier, size = 'sm' }) => {
  const check = b2bApi.isNetworkSupplier(supplier);
  const cls = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[10px]';

  return check.isNetwork ? (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ${cls}`}
      title="مورد شبكي B2B"
    >
      <Building2 className="w-2.5 h-2.5" /> مورد شبكي B2B
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200 ${cls}`}
      title="مورد محلي"
    >
      <Package className="w-2.5 h-2.5" /> مورد محلي
    </span>
  );
};