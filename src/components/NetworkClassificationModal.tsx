/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Network, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { NetworkMappingRule, NetworkType, PreprocessedWorkOrder } from '../types/telco';

interface NetworkClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminRules: NetworkMappingRule[];
  onSaveRules: (rules: NetworkMappingRule[]) => void;
  records: PreprocessedWorkOrder[];
}

export const NetworkClassificationModal: React.FC<NetworkClassificationModalProps> = ({
  isOpen,
  onClose,
  adminRules,
  onSaveRules,
  records,
}) => {
  const [rules, setRules] = useState<NetworkMappingRule[]>([...adminRules]);
  const [newField, setNewField] = useState<'FIBERNODE' | 'MKTTYPE' | 'SITE_ID' | 'Job Task'>('MKTTYPE');
  const [newPattern, setNewPattern] = useState('');
  const [newTarget, setNewTarget] = useState<NetworkType>('FTTH');

  if (!isOpen) return null;

  const ftthCount = records.filter(r => r.networkType === 'FTTH').length;
  const hfcCount = records.filter(r => r.networkType === 'HFC').length;
  const unclassifiedCount = records.filter(r => r.networkType === 'Unclassified').length;

  const handleAddRule = () => {
    if (!newPattern.trim()) return;
    const newRule: NetworkMappingRule = {
      id: `rule-${Date.now()}`,
      field: newField,
      pattern: newPattern.trim(),
      targetNetwork: newTarget,
      isRegex: false,
    };
    setRules([...rules, newRule]);
    setNewPattern('');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    onSaveRules(rules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Konfirmasi & Pemetaan Klasifikasi Jaringan (FTTH / HFC)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klasifikasi berbasis aturan teknis terverifikasi, bukan inferensi dari nama wilayah atau asumsi.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Population summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium block">FTTH (Fiber to the Home)</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">{ftthCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {records.length > 0 ? `${Math.round((ftthCount / records.length) * 100)}% populasi` : '0%'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium block">HFC (Hybrid Fiber-Coax)</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">{hfcCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {records.length > 0 ? `${Math.round((hfcCount / records.length) * 100)}% populasi` : '0%'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="text-xs text-amber-700 font-medium block">Belum Terklasifikasi</span>
              <span className="text-lg font-bold text-amber-900 font-mono tabular-nums">{unclassifiedCount}</span>
              <span className="text-[11px] text-amber-600 block mt-0.5">Perlu konfirmasi admin</span>
            </div>
          </div>

          {/* Add Rule Form */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Tambah Aturan Pemetaan Klasifikasi Jaringan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Kolom Acuan</label>
                <select
                  value={newField}
                  onChange={e => setNewField(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 rounded border border-slate-200 bg-white text-slate-800"
                >
                  <option value="MKTTYPE">MKTTYPE</option>
                  <option value="FIBERNODE">FIBERNODE</option>
                  <option value="SITE_ID">SITE_ID</option>
                  <option value="Job Task">Job Task</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Pola Teks / Kata Kunci (e.g. GPON, COAX, FN-)
                </label>
                <input
                  type="text"
                  value={newPattern}
                  onChange={e => setNewPattern(e.target.value)}
                  placeholder="Masukkan kata kunci atau awalan node..."
                  className="w-full text-xs py-1.5 px-2 rounded border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Target Jaringan</label>
                <div className="flex gap-1.5">
                  <select
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value as any)}
                    className="w-full text-xs py-1.5 px-2 rounded border border-slate-200 bg-white text-slate-800"
                  >
                    <option value="FTTH">FTTH</option>
                    <option value="HFC">HFC</option>
                  </select>
                  <button
                    onClick={handleAddRule}
                    className="px-2.5 py-1.5 bg-slate-900 text-white rounded text-xs hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Rules List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              Daftar Aturan Pemetaan Aktif ({rules.length})
            </h3>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {rules.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Belum ada aturan khusus admin. Sistem menggunakan pendeteksian pola otomatis bawaan (FTTH, FIBER, GPON vs HFC, COAX, DOCSIS).
                </div>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{rule.field}</span>
                      <span className="text-slate-400">memuat</span>
                      <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        "{rule.pattern}"
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-slate-900">{rule.targetNetwork}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            Terapkan & Klasifikasikan Ulang
          </button>
        </div>
      </div>
    </div>
  );
};
