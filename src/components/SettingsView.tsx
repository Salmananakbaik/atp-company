/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * System Configuration & Backend Diagnostic View
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import {
  Settings,
  Server,
  Sliders,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { BackendStatus, IsolationForestModelConfig, SOPRuleConfig } from '../types/telco';
import { apiService } from '../services/apiService';

interface SettingsViewProps {
  backendStatus: BackendStatus;
  onRefreshBackendStatus: () => void;
  onOpenRuleConfig: () => void;
  onOpenModelExperiment: () => void;
  onSelectSample50: () => void;
  onSelectHistorical1250: () => void;
  modelConfig: IsolationForestModelConfig;
  sopConfig: SOPRuleConfig;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  backendStatus,
  onRefreshBackendStatus,
  onOpenRuleConfig,
  onOpenModelExperiment,
  onSelectSample50,
  onSelectHistorical1250,
  modelConfig,
  sopConfig,
}) => {
  const [endpointInput, setEndpointInput] = useState<string>(backendStatus.endpointUrl);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    apiService.setEndpoint(endpointInput);
    const result = await apiService.checkHealth();
    setIsTesting(false);
    onRefreshBackendStatus();

    if (result.isConnected) {
      setTestResult(`Koneksi Sukses! Backend FastAPI merespons dalam ${result.latencyMs}ms.`);
    } else {
      setTestResult('Koneksi Gagal: Backend FastAPI belum aktif di port target. Sistem menjalankan simulasi DEMO lokal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              SYSTEM CONFIGURATION
            </span>
            <span className="text-xs text-slate-400 font-mono">Backend Engine & Model Tuning</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Pengaturan Sistem & Integrasi Backend
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Konfigurasi koneksi backend Python FastAPI (Scikit-Learn), penyesuaian batas toleransi validasi SOP, dan manajemen dataset.
          </p>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Backend Python FastAPI Diagnostic */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Integrasi Backend Python (FastAPI + Scikit-Learn)</span>
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                backendStatus.isConnected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {backendStatus.isConnected ? 'ONLINE (FASTAPI)' : 'OFFLINE (DEMO MODE)'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                URL Endpoint API FastAPI:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={endpointInput}
                  onChange={e => setEndpointInput(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Ping'}</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  backendStatus.isConnected
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800 text-amber-300'
                }`}
              >
                {testResult}
              </div>
            )}

            {/* How to run backend instructions */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Cara Menjalankan Backend Python:
              </span>
              <pre className="text-[10px] font-mono text-cyan-300/90 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto">
{`cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload`}
              </pre>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dokumentasi Swagger API otomatis tersedia di: <code className="text-cyan-400">http://localhost:8000/docs</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Configurations */}
        <div className="space-y-6">
          {/* Card: SOP Rule Tolerances */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Nilai Ambang Validasi SOP (10 Rules)</span>
              </h3>
              <button
                onClick={onOpenRuleConfig}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Ubah Nilai Ambang
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Durasi Min/Maks</span>
                <span className="text-white font-mono font-bold">
                  {sopConfig.minDurationMinutes} mnt - {sopConfig.maxDurationMinutes} mnt
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Toleransi Benturan</span>
                <span className="text-white font-mono font-bold">
                  {sopConfig.overlapToleranceMinutes} Menit
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Radius Presensi GPS</span>
                <span className="text-white font-mono font-bold">
                  {sopConfig.maxDistanceTechToWOMeters} Meter
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Kata Kunci Kendala</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {sopConfig.contradictoryNegativeKeywords.length} Frasa
                </span>
              </div>
            </div>
          </div>

          {/* Card: ML Hyperparameter Config */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Hyperparameter Isolation Forest (FTTH & HFC)</span>
              </h3>
              <button
                onClick={onOpenModelExperiment}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                Eksperimen Model
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">n_estimators</span>
                <span className="text-white font-mono font-bold">{modelConfig.n_estimators} Pohon</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Tingkat Kontaminasi</span>
                <span className="text-red-400 font-mono font-bold">{(modelConfig.contamination * 100).toFixed(1)}%</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Model FTTH Terpisah</span>
                <span className="text-emerald-400 font-mono font-bold">Aktif (Cohort)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono block">Model HFC Terpisah</span>
                <span className="text-emerald-400 font-mono font-bold">Aktif (Cohort)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
