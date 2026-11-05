import { API_BASE, TOKEN_KEY } from './api';

function getToken(): string {
  const t = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('auth_token');
  if (!t) throw new Error('انتهت الجلسة — الرجاء تسجيل الدخول');
  return t;
}

async function fetchPdfBlob(path: string, params?: Record<string, any>): Promise<Blob> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (res.status === 401) throw new Error('انتهت الجلسة — الرجاء تسجيل الدخول');
  if (!res.ok) {
    let msg = `فشل تحميل PDF (${res.status})`;
    try {
      const t = await res.text();
      if (t) msg = t.slice(0, 200);
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.blob();
}


export async function openPdf(
  path: string,
  params?: Record<string, any>
): Promise<void> {
  // فتح نافذة مباشرة عند ضغط المستخدم
  const win = window.open('about:blank', '_blank');

  if (!win) {
    throw new Error('يرجى السماح بالنوافذ المنبثقة لعرض PDF');
  }

  try {
    win.document.title = 'جاري تحميل ملف PDF...';
    win.document.body.innerHTML = `
      <div style="font-family:Arial;text-align:center;padding:40px">
        جاري تحميل ملف PDF...
      </div>
    `;

    const blob = await fetchPdfBlob(path, params);

    const url = URL.createObjectURL(blob);

    win.location.replace(url);

    // تحرير الذاكرة بعد انتهاء الاستخدام
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);

  } catch (error) {
    win.close();
    throw error;
  }
}


export async function downloadPdf(path: string, baseName: string, params?: Record<string, any>): Promise<void> {
  const blob = await fetchPdfBlob(path, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // ضمان امتداد واحد فقط
  a.download = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}