
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OPERATIONAL REPORTING
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useMemo, useState } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Activity,
  Network,
  Users,
  Building2,
  ClipboardCheck,
} from 'lucide-react';

import {
  PreprocessedWorkOrder,
  PreprocessingStats,
  IsolationForestStats,
} from '../types/telco';

import { exportAuditReportToExcel } from '../utils/excelExporter';

interface ReportingViewProps {
  records: PreprocessedWorkOrder[];
  preprocStats: PreprocessingStats;
  mlStats: IsolationForestStats;
}

type ReportTab =
  | 'ALL'
  | 'ANOMALY'
  | 'FTTH'
  | 'HFC'
  | 'TECHNICIAN'
  | 'BRANCH'
  | 'SUPERVISOR';

type ReportRecord = PreprocessedWorkOrder & {
  is_ml_anomaly?: boolean;
  prediction?: number;
};

const getAnomalyStatus = (
  record: PreprocessedWorkOrder
): boolean => {
  const item = record as ReportRecord;

  if (typeof item.isMlAnomaly === 'boolean') {
    return item.isMlAnomaly;
  }

  if (typeof item.is_ml_anomaly === 'boolean') {
    return item.is_ml_anomaly;
  }

  if (typeof item.prediction === 'number') {
    return item.prediction === -1;
  }

  return false;
};

const formatNumber = (value: number): string =>
  value.toLocaleString('id-ID');

const formatDate = (value: unknown): string => {
  if (!value) return '-';

  const date = value instanceof Date
    ? value
    : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const tabs: { id: ReportTab; label: string }[] = [
  { id: 'ALL', label: 'Semua WO' },
  { id: 'ANOMALY', label: 'Anomali' },
  { id: 'FTTH', label: 'FTTH' },
  { id: 'HFC', label: 'HFC' },
  { id: 'TECHNICIAN', label: 'Teknisi' },
  { id: 'BRANCH', label: 'Cabang' },
  { id: 'SUPERVISOR', label: 'Supervisor' },
];

export const ReportingView: React.FC<ReportingViewProps> = ({
  records,
  preprocStats,
  mlStats,
}) => {
  const [activeTab, setActiveTab] =
    useState<ReportTab>('ALL');

  const [search, setSearch] = useState('');

  // ========================================================
  // SUMMARY
  // ========================================================

  const summary = useMemo(() => {
    const anomalies = records.filter(getAnomalyStatus);

    const normal = records.filter(
      record => !getAnomalyStatus(record)
    );

    const completed = records.filter(
      record => record.resultChoice === 'DONE'
    );

    const reviewed = records.filter(
      record => {
        const status = record.supervisorVerification?.status;

        return Boolean(
          status &&
          status !== 'UNREVIEWED' &&
          status !== 'BELUM_DIREVIEW'
        );
      }
    );

    return {
      total: records.length,
      anomalies: anomalies.length,
      normal: normal.length,
      completed: completed.length,
      reviewed: reviewed.length,
    };
  }, [records]);

  // ========================================================
  // FILTERED DATA
  // ========================================================

  const filteredRecords = useMemo(() => {
    let result = [...records];

    switch (activeTab) {
      case 'ANOMALY':
        result = result.filter(getAnomalyStatus);
        break;

      case 'FTTH':
        result = result.filter(
          record => record.networkType === 'FTTH'
        );
        break;

      case 'HFC':
        result = result.filter(
          record => record.networkType === 'HFC'
        );
        break;

      case 'TECHNICIAN':
        result = result.filter(
          record => Boolean(record.installer)
        );
        break;

      case 'BRANCH':
        result = result.filter(
          record => Boolean(record.Branch)
        );
        break;

      case 'SUPERVISOR':
        result = result.filter(
          record => Boolean(
            record.supervisorVerification?.status
          )
        );
        break;
    }

    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter(record => {
        const searchable = [
          record.OFFERNUM,
          record.WORDER,
          record.installer,
          record.Branch,
          record.networkType,
          record.resultChoice,
        ]
          .map(value => String(value ?? '').toLowerCase())
          .join(' ');

        return searchable.includes(keyword);
      });
    }

    return result;
  }, [records, activeTab, search]);

  // ========================================================
  // EXPORT
  // ========================================================

  const handleExport = () => {
    if (records.length === 0) {
      alert('Belum ada data Work Order untuk diunduh.');
      return;
    }

    exportAuditReportToExcel(
      records,
      preprocStats,
      mlStats
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // ========================================================
  // BRANCH SUMMARY
  // ========================================================

  const branchSummary = useMemo(() => {
    const grouped: Record<
      string,
      {
        total: number;
        ftth: number;
        hfc: number;
        anomalies: number;
      }
    > = {};

    records.forEach(record => {
      const branch = record.Branch || 'Tidak diketahui';

      if (!grouped[branch]) {
        grouped[branch] = {
          total: 0,
          ftth: 0,
          hfc: 0,
          anomalies: 0,
        };
      }

      grouped[branch].total++;

      if (record.networkType === 'FTTH') {
        grouped[branch].ftth++;
      }

      if (record.networkType === 'HFC') {
        grouped[branch].hfc++;
      }

      if (getAnomalyStatus(record)) {
        grouped[branch].anomalies++;
      }
    });

    return Object.entries(grouped).map(([branch, value]) => ({
      branch,
      ...value,
    }));
  }, [records]);

  // ========================================================
  // TECHNICIAN SUMMARY
  // ========================================================

  const technicianSummary = useMemo(() => {
    const grouped: Record<
      string,
      {
        total: number;
        completed: number;
        anomalies: number;
        durationSum: number;
        durationCount: number;
      }
    > = {};

    records.forEach(record => {
      const technician = record.installer || 'Tidak diketahui';

      if (!grouped[technician]) {
        grouped[technician] = {
          total: 0,
          completed: 0,
          anomalies: 0,
          durationSum: 0,
          durationCount: 0,
        };
      }

      const item = grouped[technician];

      item.total++;

      if (record.resultChoice === 'DONE') {
        item.completed++;
      }

      if (getAnomalyStatus(record)) {
        item.anomalies++;
      }

      const duration = Number(record.recordingWindowMinutes);

      if (Number.isFinite(duration) && duration > 0) {
        item.durationSum += duration;
        item.durationCount++;
      }
    });

    return Object.entries(grouped).map(([technician, value]) => ({
      technician,
      ...value,
      completionRate: value.total > 0
        ? (value.completed / value.total) * 100
        : 0,
      averageDuration: value.durationCount > 0
        ? value.durationSum / value.durationCount
        : 0,
    }));
  }, [records]);

  // ========================================================
  // SUPERVISOR SUMMARY
  // ========================================================

  const supervisorSummary = useMemo(() => {
    const counts = {
      confirmed: 0,
      normal: 0,
      inconclusive: 0,
      unreviewed: 0,
    };

    records.forEach(record => {
      const status = record.supervisorVerification?.status;

      if (status === 'CONFIRMED_DISCREPANCY') {
        counts.confirmed++;
      } else if (status === 'NORMAL_VERIFIED') {
        counts.normal++;
      } else if (status === 'INCONCLUSIVE') {
        counts.inconclusive++;
      } else {
        counts.unreviewed++;
      }
    });

    return counts;
  }, [records]);

  // ========================================================
  // UI
  // ========================================================

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2 text-blue-600">
            <FileSpreadsheet className="h-4 w-4" />

            <span className="text-[10px] font-bold uppercase tracking-wider">
              Reporting
            </span>
          </div>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Laporan Operasional
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Rekapitulasi Work Order, anomali, dan verifikasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Cetak
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={records.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Unduh Excel
          </button>

        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <SummaryCard
          label="Total Work Order"
          value={summary.total}
          icon={<FileSpreadsheet className="h-4 w-4" />}
          color="slate"
        />

        <SummaryCard
          label="Kandidat Anomali"
          value={summary.anomalies}
          icon={<Activity className="h-4 w-4" />}
          color="red"
        />

        <SummaryCard
          label="WO Selesai"
          value={summary.completed}
          icon={<CheckCircleIcon />}
          color="emerald"
        />

        <SummaryCard
          label="Sudah Ditinjau"
          value={summary.reviewed}
          icon={<ClipboardCheck className="h-4 w-4" />}
          color="blue"
        />

      </div>

      {/* REPORT NAVIGATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">

        <div className="flex items-center gap-2 overflow-x-auto">

          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}

        </div>

      </div>

      {/* TABLE PANEL */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>

            <p className="mt-1 text-[11px] text-slate-500">
              {formatNumber(filteredRecords.length)} data ditampilkan
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Cari WO, teknisi, cabang..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white"
            />

          </div>

        </div>

        {/* GENERAL WORK ORDER TABLE */}
        {(activeTab === 'ALL' ||
          activeTab === 'ANOMALY' ||
          activeTab === 'FTTH' ||
          activeTab === 'HFC') && (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px] text-left text-xs">

              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Work Order</th>
                  <th className="px-4 py-3">Jaringan</th>
                  <th className="px-4 py-3">Teknisi</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Tanggal Jadwal</th>
                  <th className="px-4 py-3">Durasi</th>
                  <th className="px-4 py-3">Hasil</th>
                  <th className="px-4 py-3">Prediksi AI</th>
                  <th className="px-4 py-3">SOP</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredRecords.map((record, index) => {
                  const anomaly = getAnomalyStatus(record);

                  return (
                    <tr
                      key={record.id ?? `${record.OFFERNUM}-${index}`}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {record.OFFERNUM || record.WORDER || '-'}
                      </td>

                      <td className="px-4 py-3">
                        <NetworkBadge type={record.networkType} />
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {record.installer || '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {record.Branch || '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(record.schDate)}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700">
                        {record.recordingWindowMinutes ?? '-'} mnt
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {record.resultChoice || '-'}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          label={anomaly ? 'Anomali' : 'Normal'}
                          type={anomaly ? 'red' : 'green'}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {record.ruleViolations?.length > 0 ? (
                          <StatusBadge
                            label={`${record.ruleViolations.length} Rule`}
                            type="amber"
                          />
                        ) : (
                          <StatusBadge
                            label="Tidak ada"
                            type="green"
                          />
                        )}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

            {filteredRecords.length === 0 && (
              <EmptyState />
            )}

          </div>
        )}

        {/* BRANCH TABLE */}
        {activeTab === 'BRANCH' && (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-xs">

              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3 text-right">Total WO</th>
                  <th className="px-4 py-3 text-right">FTTH</th>
                  <th className="px-4 py-3 text-right">HFC</th>
                  <th className="px-4 py-3 text-right">Anomali</th>
                  <th className="px-4 py-3 text-right">Rasio</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {branchSummary
                  .filter(item =>
                    item.branch.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(item => (
                    <tr key={item.branch} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.branch}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.total}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.ftth}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.hfc}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {item.anomalies}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.total > 0
                          ? ((item.anomalies / item.total) * 100).toFixed(1)
                          : '0.0'}%
                      </td>
                    </tr>
                  ))}
              </tbody>

            </table>

          </div>
        )}

        {/* TECHNICIAN TABLE */}
        {activeTab === 'TECHNICIAN' && (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-xs">

              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Teknisi</th>
                  <th className="px-4 py-3 text-right">Total WO</th>
                  <th className="px-4 py-3 text-right">Selesai</th>
                  <th className="px-4 py-3 text-right">Penyelesaian</th>
                  <th className="px-4 py-3 text-right">Rata-rata Durasi</th>
                  <th className="px-4 py-3 text-right">Anomali</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {technicianSummary
                  .filter(item =>
                    item.technician.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(item => (
                    <tr key={item.technician} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.technician}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.total}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.completed}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.completionRate.toFixed(1)}%
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.averageDuration.toFixed(1)} menit
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {item.anomalies}
                      </td>
                    </tr>
                  ))}
              </tbody>

            </table>

          </div>
        )}

        {/* SUPERVISOR TABLE */}
        {activeTab === 'SUPERVISOR' && (
          <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">

            <SupervisorCard
              label="Dikonfirmasi Deviasi"
              value={supervisorSummary.confirmed}
              color="red"
            />

            <SupervisorCard
              label="Normal Terverifikasi"
              value={supervisorSummary.normal}
              color="green"
            />

            <SupervisorCard
              label="Belum Konklusif"
              value={supervisorSummary.inconclusive}
              color="amber"
            />

            <SupervisorCard
              label="Belum Ditinjau"
              value={supervisorSummary.unreviewed}
              color="slate"
            />

          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="flex flex-col justify-between gap-2 text-[10px] text-slate-400 sm:flex-row">
        <span>
          Total {formatNumber(records.length)} Work Order
        </span>

        <span>
          Data bersumber dari dataset yang diimpor.
        </span>
      </div>

    </div>
  );
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const CheckCircleIcon = () => (
  <ClipboardCheck className="h-4 w-4" />
);

const SummaryCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'red' | 'emerald' | 'blue';
}> = ({ label, value, icon, color }) => {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {label}
        </span>

        <span className={`rounded-lg p-2 ${colors[color]}`}>
          {icon}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {formatNumber(value)}
      </p>
    </div>
  );
};

const NetworkBadge: React.FC<{ type: string }> = ({ type }) => {
  const isFtth = type === 'FTTH';

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
        isFtth
          ? 'bg-blue-50 text-blue-700'
          : type === 'HFC'
            ? 'bg-violet-50 text-violet-700'
            : 'bg-slate-100 text-slate-500'
      }`}
    >
      {type || 'Tidak diketahui'}
    </span>
  );
};

const StatusBadge: React.FC<{
  label: string;
  type: 'red' | 'green' | 'amber';
}> = ({ label, type }) => {
  const styles = {
    red: 'bg-red-50 text-red-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${styles[type]}`}>
      {label}
    </span>
  );
};

const SupervisorCard: React.FC<{
  label: string;
  value: number;
  color: 'red' | 'green' | 'amber' | 'slate';
}> = ({ label, value, color }) => {
  const styles = {
    red: 'text-red-600 bg-red-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-700 bg-slate-100',
  };

  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <span className="text-[11px] text-slate-500">
        {label}
      </span>

      <p className={`mt-2 inline-flex rounded-lg px-3 py-2 text-xl font-bold ${styles[color]}`}>
        {value.toLocaleString('id-ID')}
      </p>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FileSpreadsheet className="h-8 w-8 text-slate-300" />

    <p className="mt-3 text-sm font-semibold text-slate-700">
      Tidak ada data ditemukan
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Coba ubah pencarian atau kategori laporan.
    </p>
  </div>
);

export default ReportingView;
