import React from 'react';
import { Printer, Download, Copy } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { QRData } from '../types';

interface Props {
  isOpen: boolean;
  data: QRData | null;
  onClose: () => void;
}

export const QrModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  const handleDownload = () => {
    if (!data) return;
    const link = document.createElement('a');
    link.href = data.qr_data_url;
    link.download = `qr-delivery-${Date.now()}.png`;
    link.click();
  };

  const handleCopyUrl = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.url);
      alert('تم نسخ الرابط');
    } catch {
      alert('فشل النسخ');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="رمز QR للتسليم" maxWidth="md">
      {data && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-white rounded-xl border-2 border-slate-200 inline-block">
            <img src={data.qr_data_url} alt="QR Code" className="w-64 h-64 mx-auto" />
          </div>

          {data.pin && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[11px] text-amber-800 mb-1">
                رمز PIN (للتأكيد العام — لا تشاركه إلا مع مندوب الاستلام):
              </p>
              <p className="text-3xl font-black font-mono text-amber-900 tracking-widest">
                {data.pin}
              </p>
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold">
              ينتهي في: {new Date(data.expires_at).toLocaleString('ar-SA')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
            >
              <Printer className="w-4 h-4 inline mr-1" /> طباعة
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              <Download className="w-4 h-4 inline mr-1" /> تنزيل
            </button>
          </div>

          <button
            onClick={handleCopyUrl}
            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            <Copy className="w-4 h-4 inline mr-1" /> نسخ الرابط
          </button>
        </div>
      )}
    </Modal>
  );
};