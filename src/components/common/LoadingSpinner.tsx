import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'جاري تحميل البيانات...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${
        fullHeight ? 'min-h-[300px]' : ''
      }`}
    >
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-600 mb-3`} />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );
};
