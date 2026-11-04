import React from 'react';
import { FileText } from 'lucide-react';

export const NoData: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <FileText className="w-12 h-12 mb-3 opacity-40" />
    <p className="text-sm font-semibold">{message || 'لا توجد بيانات للفترة المحددة'}</p>
    <p className="text-xs mt-1">جرّب تغيير الفترة الزمنية</p>
  </div>
);