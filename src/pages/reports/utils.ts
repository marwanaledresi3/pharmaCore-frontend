export const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const fmt2 = (v: unknown): string => toNum(v).toFixed(2);

export const fmtMoney = (v: unknown, currency = ''): string => {
  const n = toNum(v);
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
};

export const fmtDate = (d: unknown): string => {
  if (!d) return '-';
  return String(d).slice(0, 10);
};

export const exportToCsv = (data: Array<Record<string, any>>, filename: string) => {
  if (data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          const s = v == null ? '' : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];
  const csv = '\uFEFF' + rows.join('\n');  // BOM للعربية
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};