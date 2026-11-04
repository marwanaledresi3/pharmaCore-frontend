// api/pdfDownload.ts
export async function downloadPdf(path: string, filename: string): Promise<void> {
  const token =
    localStorage.getItem('pharmacore_token') ||
    localStorage.getItem('auth_token');
  if (!token) throw new Error('انتهت الجلسة — الرجاء تسجيل الدخول من جديد');

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const baseUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');

  let objectUrl: string | null = null;
  let link: HTMLAnchorElement | null = null;

  try {
    const res = await fetch(`${baseUrl}${path}`, { headers });
    if (res.status === 401) throw new Error('انتهت الجلسة');
    if (!res.ok) {
      let msg = 'فشل تحميل PDF';
      try {
        const j = await res.json();
        if (j?.message) msg = j.message;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    const blob = await res.blob();
    objectUrl = URL.createObjectURL(blob);

    const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
    link = document.createElement('a');
    link.href = objectUrl;
    link.download = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
  } finally {
    if (link?.parentNode) link.parentNode.removeChild(link);
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000);
  }
}