// components/settings/CustodySettingsSection.tsx
import React from 'react';
import { Construction, Wallet } from 'lucide-react';

export const CustodySettingsSection: React.FC = () => {
  return (
    <div dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">إعدادات العهد والسلف</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              <Construction className="w-3.5 h-3.5" />
              تحت التطوير
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            إعدادات العهد والسلف قيد التطوير حالياً وسيتم إتاحتها في تحديث قادم. تعمل إدارة العهد والسلف والأقساط حالياً بالقيم الافتراضية المعتمدة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustodySettingsSection;