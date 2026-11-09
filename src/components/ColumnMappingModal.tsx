/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Shield, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { STANDARD_COLUMN_DEFINITIONS } from '../utils/columnMapper';
import { CanonicalWorkOrder } from '../types/telco';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawHeaders: string[];
  mapping: Record<string, keyof CanonicalWorkOrder | null>;
  onUpdateMapping: (newMapping: Record<string, keyof CanonicalWorkOrder | null>) => void;
  offerNumStats: {
    isUnique: boolean;
    totalRows: number;
    uniqueCount: number;
    duplicateKeys: string[];
    recommendation: string;
  };
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  rawHeaders,
  mapping,
  onUpdateMapping,
  offerNumStats,
}) => {
  const [currentMapping, setCurrentMapping] = useState<Record<string, keyof CanonicalWorkOrder | null>>({
    ...mapping,
  });

  if (!isOpen) return null;

  const handleSelectChange = (rawHeader: string, value: string) => {
    setCurrentMapping(prev => ({
      ...prev,
      [rawHeader]: value === '__NONE__' ? null : (value as keyof CanonicalWorkOrder),
    }));
  };

  const handleSave = () => {
    onUpdateMapping(currentMapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Modul Pemetaan Kolom & Validasi Primary Business Key
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem memetakan kolom asli Excel tanpa mengharuskan penggantian nama oleh pengguna.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Candidate Key Validation Box */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Evaluasi Keunikan Kandidat Kunci: OFFERNUM
                  </h3>
                  {offerNumStats.isUnique ? (
                    <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Unik
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Ditemukan Duplikasi
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {offerNumStats.recommendation}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                  <span>Total Baris: {offerNumStats.totalRows}</span>
                  <span aria-hidden="true">·</span>
                  <span>Nilai Unik: {offerNumStats.uniqueCount}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Duplikasi: {offerNumStats.totalRows - offerNumStats.uniqueCount} baris
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Privacy Shield Directive */}
          <div className="p-4 rounded-lg border border-emerald-200/80 bg-emerald-50/30 text-xs text-emerald-900 flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Protokol Keamanan Data Pelanggan Aktif:</span>
              <span className="text-emerald-800">
                Kolom identitas pelanggan (Customer Name, Address, CUST_ACCT, Phone No) secara ketat diblokir dari fitur Machine Learning, tidak digunakan sebagai variabel prediksi, dan dimasker pada laporan publik. Kolom SITE_ID hanya diperlakukan sebagai diskrit kategorikal (bukan numerik kontinu).
              </span>
            </div>
          </div>

          {/* Section 3: Mapping Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-700">
              <span>Kolom Asli Excel ({rawHeaders.length} kolom terdeteksi)</span>
              <span>Pemetaan Kanonikal Sistem</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {rawHeaders.map(raw => {
                const assignedKey = currentMapping[raw];
                const def = STANDARD_COLUMN_DEFINITIONS.find(d => d.canonicalKey === assignedKey);

                return (
                  <div key={raw} className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/60">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 block truncate">{raw}</span>
                      {def && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{def.category}</span>
                          {def.isProtectedCustomerData && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-medium flex items-center gap-0.5">
                                <Shield className="w-3 h-3" /> Protected
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-72 shrink-0">
                      <select
                        value={assignedKey || '__NONE__'}
                        onChange={e => handleSelectChange(raw, e.target.value)}
                        className="w-full text-xs py-1.5 px-2 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="__NONE__">— Tidak Dipetakan (Simpan Sebagai Raw) —</option>
                        {STANDARD_COLUMN_DEFINITIONS.map(d => (
                          <option key={d.canonicalKey} value={d.canonicalKey}>
                            {d.label} {d.isMandatory ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Terapkan Pemetaan
          </button>
        </div>
      </div>
    </div>
  );
};
