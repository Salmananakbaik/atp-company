/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supervisor Verification & Audit Review Modal
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, HelpCircle, Save, Shield } from 'lucide-react';
import { PreprocessedWorkOrder, SupervisorVerificationStatus, UserAccount } from '../types/telco';

interface SupervisorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PreprocessedWorkOrder | null;
  currentUser: UserAccount | null;
  onSaveReview: (woId: string, status: SupervisorVerificationStatus, notes: string) => void;
}

export const SupervisorReviewModal: React.FC<SupervisorReviewModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser,
  onSaveReview,
}) => {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState<SupervisorVerificationStatus>(
    record.supervisorVerification?.status || 'UNREVIEWED'
  );
  const [notes, setNotes] = useState<string>(
    record.supervisorVerification?.notes || ''
  );

  const handleSave = () => {
    onSaveReview(record.OFFERNUM, status, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              Tinjauan Verifikasi Supervisor Lapangan
            </span>
            <h2 className="text-base font-bold text-slate-900 font-mono mt-0.5">
              WO #{record.OFFERNUM}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Work Order Info Strip */}
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>Teknisi Pelaksana:</span>
              <strong className="text-slate-900">{record.installer} ({record.contractor})</strong>
            </div>
            <div className="flex justify-between">
              <span>Tugas & Jaringan:</span>
              <span>{record.jobTask} · {record.networkType}</span>
            </div>
            <div className="flex justify-between">
              <span>Skor Isolation Forest:</span>
              <span className="font-mono font-bold text-amber-700">{record.mlScore} ({record.compositeSeverity})</span>
            </div>
          </div>

          {/* Verification Status Selector */}
          <div>
            <label className="font-semibold text-slate-800 block mb-2">
              Keputusan Verifikasi Supervisor:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'CONFIRMED_DISCREPANCY',
                  label: 'Konfirmasi Deviasi',
                  sub: 'Temuan valid lapangan',
                  color: 'border-red-300 bg-red-50 text-red-900',
                },
                {
                  id: 'NORMAL_VERIFIED',
                  label: 'Normal Terverifikasi',
                  sub: 'Wajar setelah klarifikasi',
                  color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
                },
                {
                  id: 'INCONCLUSIVE',
                  label: 'Belum Konklusif',
                  sub: 'Perlu bukti tambahan BAPP',
                  color: 'border-amber-300 bg-amber-50 text-amber-900',
                },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id as SupervisorVerificationStatus)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    status === opt.id ? `${opt.color} ring-2 ring-slate-900` : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold block">{opt.label}</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Catatan Hasil Verifikasi Lapangan (Wajib/Opsional):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Telah dikonfirmasi ke pelanggan via telepon bahwa modem telah aktif, delay input disebabkan kendala hujan deras di lokasi..."
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Catatan verifikasi supervisor disimpan sebagai rekaman independen dan tidak mengubah skor murni model Isolation Forest.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Verifikasi Supervisor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
