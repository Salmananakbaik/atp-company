/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Isolation Forest Hyperparameter Experimentation & Model Versioning Modal
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import { X, Cpu, Sliders, RefreshCw, CheckCircle2, History } from 'lucide-react';
import { IsolationForestModelConfig, ModelMetadata } from '../types/telco';

interface ModelExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: IsolationForestModelConfig;
  onRetrainModel: (config: IsolationForestModelConfig) => void;
  modelHistory: ModelMetadata[];
}

export const ModelExperimentModal: React.FC<ModelExperimentModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onRetrainModel,
  modelHistory,
}) => {
  const [nEstimators, setNEstimators] = useState<number>(currentConfig.n_estimators || 100);
  const [contamination, setContamination] = useState<number>(currentConfig.contamination || 0.06);
  const [maxFeatures, setMaxFeatures] = useState<number>(currentConfig.max_features || 7);
  const [randomState, setRandomState] = useState<number>(currentConfig.random_state || 42);
  const [minSampleSeparate, setMinSampleSeparate] = useState<number>(
    currentConfig.minSampleSizeForSeparateModels || 30
  );

  if (!isOpen) return null;

  const handleApplyRetrain = () => {
    onRetrainModel({
      n_estimators: nEstimators,
      contamination,
      max_samples: 256,
      max_features: maxFeatures,
      random_state: randomState,
      minSampleSizeForSeparateModels: minSampleSeparate,
      isFtthSeparate: true,
      isHfcSeparate: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Eksperimen Hyperparameter & Versi Model Isolation Forest
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi parameter Scikit-Learn equivalent untuk pengujian dan evaluasi riset operasional.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Hyperparameters Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                n_estimators (Jumlah Pohon iTree)
              </label>
              <input
                type="number"
                min={20}
                max={300}
                step={10}
                value={nEstimators}
                onChange={e => setNEstimators(parseInt(e.target.value, 10) || 100)}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jumlah pohon partisi acak pada ensemble (Default: 100).
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                contamination (Proporsi Anomali Ekspektasi)
              </label>
              <input
                type="number"
                min={0.01}
                max={0.25}
                step={0.01}
                value={contamination}
                onChange={e => setContamination(parseFloat(e.target.value) || 0.06)}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ekspektasi rasio outlier dalam populasi (e.g. 0.06 = 6%).
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                max_features (Dimensi Fitur per Pohon)
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={maxFeatures}
                onChange={e => setMaxFeatures(parseInt(e.target.value, 10) || 7)}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maksimal fitur yang dipertimbangkan per pemisahan (Total: 7).
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                random_state (Seed Pengulangan Riset)
              </label>
              <input
                type="number"
                value={randomState}
                onChange={e => setRandomState(parseInt(e.target.value, 10) || 42)}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Seed acak untuk reproduktibilitas hasil penelitian (Default: 42).
              </span>
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-slate-800 block mb-1">
                Batas Minimum Observasi Model Terpisah (FTTH vs HFC)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={minSampleSeparate}
                onChange={e => setMinSampleSeparate(parseInt(e.target.value, 10) || 30)}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jika sampel FTTH atau HFC di bawah angka ini, sistem otomatis beralih ke Model Global Terpadu.
              </span>
            </div>
          </div>

          {/* Model Versioning History */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Riwayat Versi Model & Hasil Pelatihan</span>
            </h3>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto font-mono text-[11px]">
              {modelHistory.length === 0 ? (
                <div className="p-3 text-slate-400 text-center font-sans">
                  Versi awal sistem aktif (v1.0.0-PROD).
                </div>
              ) : (
                modelHistory.map((m, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900">{m.modelVersion}</span>
                      <span className="text-slate-500 ml-2">({m.trainedAt})</span>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        n={m.parameters.n_estimators}, contam={m.parameters.contamination}, seed={m.parameters.random_state}
                      </div>
                    </div>
                    <span className="text-amber-800 font-bold">
                      {m.anomaliesDetectedCount} anomali ({m.contaminationRate}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleApplyRetrain}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Terapkan & Latih Ulang Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
