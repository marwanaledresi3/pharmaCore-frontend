import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
