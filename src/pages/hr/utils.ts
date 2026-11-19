// pages/hr/utils.ts

export const formatMoney = (
  value: number | string | null | undefined,
  currency = 'YER'
): string => {
  const n = Number(value ?? 0);
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

export const formatMoneyShort = (value: number | string | null | undefined): string => {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
};

export const formatDateArabic = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatTime = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const formatHours = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  const n = Number(value);
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const monthName = (year: number, month: number): string => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
};

export const daysBetween = (start: string, end: string): number => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};