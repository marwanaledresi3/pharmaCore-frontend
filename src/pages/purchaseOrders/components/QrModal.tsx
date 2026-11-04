import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { QRData } from '../types';

interface Props {
  isOpen: boolean;
  data: QRData | null;
  onClose: () => void;
}

export const QrModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="رمز QR للتسليم" maxWidth="md">
      {data && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-white rounded-xl border-2 border-slate-200 inline-block">
            <img src={data.qr_data_url} alt="QR Code" className="w-64 h-64 mx-auto" />
          </div>
          {data.pin && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[11px] text-amber-800 mb-1">رمز PIN (للتأكيد العام):</p>
              <p className="text-3xl font-black font-mono text-amber-900 tracking-widest">
                {data.pin}
              </p>
            </div>
          )}
          <div className="text-xs text-slate-600">
            <p className="font-bold">
              ينتهي في: {new Date(data.expires_at).toLocaleString('ar-SA')}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl"
          >
            <Printer className="w-4 h-4 inline mr-1" /> طباعة
          </button>
        </div>
      )}
    </Modal>
  );
};