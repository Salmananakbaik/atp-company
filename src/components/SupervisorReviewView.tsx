/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dedicated Supervisor Review & Audit Workflow View
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  User,
  ShieldCheck,
  History,
} from 'lucide-react';
import {
  PreprocessedWorkOrder,
  SupervisorVerificationStatus,
  UserAccount,
  AuditLogEntry,
} from '../types/telco';
import { maskCustomerData } from '../utils/columnMapper';

interface SupervisorReviewViewProps {
  records: PreprocessedWorkOrder[];
  currentUser: UserAccount | null;
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
  onOpenReviewModal: (record: PreprocessedWorkOrder) => void;
  auditLogs: AuditLogEntry[];
}

export const SupervisorReviewView: React.FC<SupervisorReviewViewProps> = ({
  records,
  currentUser,
  onSelectRecord,
  onOpenReviewModal,
  auditLogs,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'REVIEW_LIST' | 'AUDIT_TRAIL'>('REVIEW_LIST');

  // Filter anomalous or unreviewed records
  const targetRecords = useMemo(() => {
    return records.filter(r => {
      // Show records that either have an anomaly or already have a supervisor review
      const hasAnomaly = r.compositeSeverity !== 'NORMAL';
      const hasReview = r.supervisorVerification && r.supervisorVerification.status !== 'UNREVIEWED' && r.supervisorVerification.status !== 'BELUM_DIREVIEW';
      if (!hasAnomaly && !hasReview) return false;

      // Status filter
      const curStatus = r.supervisorVerification?.status || 'BELUM_DIREVIEW';
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'UNREVIEWED' && curStatus !== 'UNREVIEWED' && curStatus !== 'BELUM_DIREVIEW') return false;
        if (filterStatus === 'CONFIRMED' && curStatus !== 'CONFIRMED_DISCREPANCY' && curStatus !== 'TERKONFIRMASI_TIDAK_SESUAI') return false;
        if (filterStatus === 'VALID' && curStatus !== 'NORMAL_VERIFIED' && curStatus !== 'VALID') return false;
        if (filterStatus === 'INCONCLUSIVE' && curStatus !== 'INCONCLUSIVE' && curStatus !== 'MEMBUTUHKAN_KLARIFIKASI') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOffer = r.OFFERNUM.toLowerCase().includes(q);
        const matchCust = r.CUST_ACCT.toLowerCase().includes(q);
        const matchTech = r.installer.toLowerCase().includes(q);
        if (!matchOffer && !matchCust && !matchTech) return false;
      }

      return true;
    });
  }, [records, filterStatus, searchQuery]);

  // Status counts
  const unreviewedCount = records.filter(
    r => r.compositeSeverity !== 'NORMAL' && (!r.supervisorVerification || r.supervisorVerification.status === 'UNREVIEWED' || r.supervisorVerification.status === 'BELUM_DIREVIEW')
  ).length;

  const confirmedCount = records.filter(
    r => r.supervisorVerification?.status === 'CONFIRMED_DISCREPANCY' || r.supervisorVerification?.status === 'TERKONFIRMASI_TIDAK_SESUAI'
  ).length;

  const verifiedValidCount = records.filter(
    r => r.supervisorVerification?.status === 'NORMAL_VERIFIED' || r.supervisorVerification?.status === 'VALID'
  ).length;

  const getStatusBadge = (status?: SupervisorVerificationStatus) => {
    switch (status) {
      case 'CONFIRMED_DISCREPANCY':
      case 'TERKONFIRMASI_TIDAK_SESUAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-950/80 text-red-400 border border-red-800">
            <XCircle className="w-3.5 h-3.5" />
            TERKONFIRMASI TIDAK SESUAI
          </span>
        );
      case 'NORMAL_VERIFIED':
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            VALID (WAJAR)
          </span>
        );
      case 'INCONCLUSIVE':
      case 'MEMBUTUHKAN_KLARIFIKASI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            <HelpCircle className="w-3.5 h-3.5" />
            BUTUH KLARIFIKASI
          </span>
        );
      case 'DALAM_PEMERIKSAAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-950/80 text-cyan-400 border border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            DALAM PEMERIKSAAN
          </span>
        );
      case 'BELUM_DIREVIEW':
      case 'UNREVIEWED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            BELUM DIREVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
              SUPERVISOR VERIFICATION WORKFLOW
            </span>
            <span className="text-xs text-slate-400 font-mono">Pemisahan Hasil Audit vs Prediksi AI</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Review & Verifikasi Tiket Anomali Lapangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Supervisor berwenang memeriksa bukti indikasi deviasi, mencatat klarifikasi teknisi, dan mengubah status kepatuhan operasional tanpa mengubah prediksi model historis.
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Belum Review</span>
            <span className="text-base font-bold text-amber-400 font-mono tabular-nums">{unreviewedCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Terkonfirmasi</span>
            <span className="text-base font-bold text-red-400 font-mono tabular-nums">{confirmedCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Valid Wajar</span>
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">{verifiedValidCount}</span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation: Daftar Review vs Log Audit */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('REVIEW_LIST')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'REVIEW_LIST'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Daftar Tiket Antrean Review ({targetRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('AUDIT_TRAIL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'AUDIT_TRAIL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Jejak Audit Supervisor ({auditLogs.length})</span>
          </button>
        </div>

        {/* Search & Filter */}
        {activeSubTab === 'REVIEW_LIST' && (
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari OFFERNUM, CUST_ACCT, Teknisi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">Semua Status Review</option>
              <option value="UNREVIEWED">Belum Direview</option>
              <option value="CONFIRMED">Terkonfirmasi Tidak Sesuai</option>
              <option value="VALID">Valid (Wajar)</option>
              <option value="INCONCLUSIVE">Butuh Klarifikasi</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Review Content */}
      {activeSubTab === 'REVIEW_LIST' ? (
        <div className="rounded-2xl border border-slate-800 bg-[#091124] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">OFFERNUM / WO</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Teknisi & Branch</th>
                  <th className="py-3 px-4">Temuan Aturan SOP</th>
                  <th className="py-3 px-4 text-center">Skor AI</th>
                  <th className="py-3 px-4">Status Review</th>
                  <th className="py-3 px-4 text-right">Aksi Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {targetRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      Tidak ada tiket yang memerlukan review sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  targetRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <button
                          onClick={() => onSelectRecord(rec)}
                          className="font-bold text-cyan-400 hover:underline cursor-pointer block"
                        >
                          {rec.OFFERNUM}
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {rec.networkType} · {rec.jobTask}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white font-medium block">
                          {maskCustomerData(rec.Customer_Name, 'name')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {rec.CUST_ACCT}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-200 block">{rec.installer}</span>
                        <span className="text-[10px] text-slate-400 block">{rec.Branch}</span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        {rec.ruleViolations.length > 0 ? (
                          <div className="space-y-1">
                            {rec.ruleViolations.slice(0, 2).map((v, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-red-300">
                                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                <span className="truncate">{v.ruleName}</span>
                              </div>
                            ))}
                            {rec.ruleViolations.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{rec.ruleViolations.length - 2} aturan lainnya
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Tidak ada pelanggaran SOP</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={rec.mlScore >= 0.6 ? 'text-red-400' : 'text-slate-400'}>
                          {rec.mlScore.toFixed(3)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(rec.supervisorVerification?.status)}
                        {rec.supervisorVerification?.notes && (
                          <p className="text-[10px] text-slate-400 mt-1 italic truncate max-w-xs">
                            "{rec.supervisorVerification.notes}"
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenReviewModal(rec)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                        >
                          Verifikasi
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="rounded-2xl border border-slate-800 bg-[#091124] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Riwayat Aktivitas & Perubahan Status Supervisor</span>
          </h3>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada riwayat audit tersimpan dalam sesi ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {auditLogs.map(log => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.performedBy}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-cyan-400 border border-blue-800">
                        {log.userRole}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-1">
                      Aksi: <strong className="text-white">{log.action}</strong> pada tiket{' '}
                      <span className="font-mono text-cyan-400">{log.targetOfferNum}</span>
                    </p>
                    {log.notes && (
                      <p className="text-slate-400 text-[11px] mt-0.5 italic">
                        Catatan: "{log.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400">
                      Status Baru: <strong className="text-emerald-400">{log.newStatus}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
