/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Rules Summary View (10 Deterministic SOP Rules)
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { PreprocessedWorkOrder, SOPRuleConfig, RuleResultStatus } from '../types/telco';
import { OPERATIONAL_RULES_CATALOG } from '../utils/ruleEngine';

interface RulesSummaryViewProps {
  records: PreprocessedWorkOrder[];
  config: SOPRuleConfig;
  onOpenConfig: () => void;
  onFilterByRule: (ruleId: string) => void;
}

export const RulesSummaryView: React.FC<RulesSummaryViewProps> = ({
  records,
  config,
  onOpenConfig,
  onFilterByRule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | RuleResultStatus>('ALL');

  // Calculate violation counts by ruleId
  const violationCounts: Record<string, number> = {};
  records.forEach(r => {
    r.ruleViolations.forEach(v => {
      violationCounts[v.ruleId] = (violationCounts[v.ruleId] || 0) + 1;
    });
  });

  const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);

  const getStatusBadge = (status: RuleResultStatus) => {
    switch (status) {
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/60">
            <XCircle className="w-3 h-3 text-red-400" />
            INVALID
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <HelpCircle className="w-3 h-3 text-purple-400" />
            NEEDS REVIEW
          </span>
        );
      case 'VALID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            VALID
          </span>
        );
    }
  };

  const filteredRules = OPERATIONAL_RULES_CATALOG.filter(rule => {
    if (selectedCategory === 'ALL') return true;
    return rule.defaultStatus === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              SOP VALIDATION ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">10 Aturan Deterministik</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Validasi Data Operasional Lapangan (Rule-Based Integrity)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
            Pemeriksaan kronologis dan integritas pencatatan tiket WO FTTH & HFC. Anomali operasional ditandai secara objektif dan non-akusatif untuk verifikasi supervisor.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Pelanggaran</span>
            <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">{totalViolations} Temuan</span>
          </div>
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-950" />
            <span>Konfigurasi Nilai Ambang SOP</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Category */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-medium text-slate-400 mr-2">Filter Kategori:</span>
        {(['ALL', 'INVALID', 'WARNING', 'NEEDS_REVIEW'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {cat === 'ALL' ? 'Semua (10 Aturan)' : cat}
          </button>
        ))}
      </div>

      {/* 10 Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map(rule => {
          const count = violationCounts[rule.id] || 0;
          const isTriggered = count > 0;

          return (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                isTriggered
                  ? 'border-slate-700 bg-slate-900/90 shadow-sm'
                  : 'border-slate-800/70 bg-slate-950/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(rule.defaultStatus)}
                    <span className="text-[10px] font-mono text-slate-500">{rule.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {rule.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {rule.desc}
                  </p>
                  <div className="mt-2 text-[11px] text-cyan-400/80 font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                    Standar SOP: {rule.sopParam}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-2xl font-bold font-mono tabular-nums block ${
                      count > 0 ? (rule.defaultStatus === 'INVALID' ? 'text-red-400' : 'text-amber-400') : 'text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Tiket</span>
                </div>
              </div>

              {isTriggered && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Terdeteksi pada <strong className="text-white font-mono">{count}</strong> WO
                  </span>
                  <button
                    onClick={() => onFilterByRule(rule.id)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tampilkan Daftar WO</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
