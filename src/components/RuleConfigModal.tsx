/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { SOPRuleConfig } from '../types/telco';
import { DEFAULT_SOP_CONFIG } from '../utils/ruleEngine';

interface RuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SOPRuleConfig;
  onSaveConfig: (newConfig: SOPRuleConfig) => void;
}

export const RuleConfigModal: React.FC<RuleConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<SOPRuleConfig>({ ...config });
  const [keywordInput, setKeywordInput] = useState(config.contradictoryNegativeKeywords.join(', '));

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalConfig({ ...DEFAULT_SOP_CONFIG });
    setKeywordInput(DEFAULT_SOP_CONFIG.contradictoryNegativeKeywords.join(', '));
  };

  const handleSave = () => {
    const parsedKeywords = keywordInput
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    onSaveConfig({
      ...localConfig,
      contradictoryNegativeKeywords: parsedKeywords,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Konfigurasi Parameter SOP & Toleransi Validasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesuaikan ambang batas operasional sesuai standar operasional prosedur (SOP) telekomunikasi.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Toleransi Tumpang Tindih Jadwal (Menit)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={localConfig.overlapToleranceMinutes}
                onChange={e =>
                  setLocalConfig({ ...localConfig, overlapToleranceMinutes: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Rule 6: Ambang batas overlap pekerjaan teknisi yang sama (Default: 5 menit).
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Toleransi Update Sebelum Lapor (Menit)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={localConfig.allowUpdateBeforeReportWithGraceMinutes}
                onChange={e =>
                  setLocalConfig({
                    ...localConfig,
                    allowUpdateBeforeReportWithGraceMinutes: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Rule 5: Toleransi perbedaan sinkronisasi jam server (Default: 2 menit).
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Ambang Batas Volume Tiket Harian
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={localConfig.minTechDailyVolumeThreshold}
                onChange={e =>
                  setLocalConfig({
                    ...localConfig,
                    minTechDailyVolumeThreshold: parseInt(e.target.value, 10) || 8,
                  })
                }
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jumlah tiket harian per teknisi yang memicu tinjauan beban (Default: 8).
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Batas Minimum Sampel Model Terpisah (FTTH/HFC)
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={localConfig.minSampleSizeForSeparateModels}
                onChange={e =>
                  setLocalConfig({
                    ...localConfig,
                    minSampleSizeForSeparateModels: parseInt(e.target.value, 10) || 30,
                  })
                }
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ambang batas minimum observasi untuk melatih model terpisah (Default: 30).
              </span>
            </div>
          </div>

          {/* Rule 8 Contradiction Keywords */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Kata Kunci Kontradiksi Lapangan (Rule 8)
            </label>
            <textarea
              rows={4}
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="Pisahkan kata kunci dengan koma (contoh: gagal, batal, kendala fisik, redaman tinggi, reschedule)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Jika Result Choice = DONE namun catatan/WIP memuat kata-kata ini, sistem menandai Rule 8 (Pertentangan Status vs Catatan).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-xl">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default SOP</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Simpan Konfigurasi SOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
