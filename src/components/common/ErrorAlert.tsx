import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { ValidationErrorDetail } from '../../types';

export interface ErrorAlertProps {
  error?: string | Error | null;
  message?: string | Error | null;
  details?: ValidationErrorDetail[];
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  message: msgProp,
  details,
  onRetry,
  className = '',
}) => {
  const activeError = error || msgProp;
  if (!activeError) return null;

  const displayMessage = typeof activeError === 'string' ? activeError : activeError.message;

  return (
    <div
      dir="rtl"
      className={`rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">حدث خطأ</h4>
            <p className="text-sm text-rose-700 mt-0.5 leading-relaxed">{displayMessage}</p>

            {details && details.length > 0 && (
              <ul className="mt-2 text-xs text-rose-600 list-disc list-inside space-y-1 bg-white/70 rounded-lg p-2.5 border border-rose-100">
                {details.map((d, i) => (
                  <li key={i}>
                    <span className="font-semibold text-rose-800">{d.field}:</span> {d.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
};
