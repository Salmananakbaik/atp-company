
import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  UserRound,
  MapPin,
  FileText,
  ClipboardCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';

import { PreprocessedWorkOrder } from '../types/telco';

interface AnomalyDrawerProps {
  record: PreprocessedWorkOrder | null;
  onClose: () => void;
  onOpenSupervisorReview?: (record: PreprocessedWorkOrder) => void;
}

type Severity = 'HIGH' | 'MEDIUM' | 'NORMAL';

const severityConfig = {
  HIGH: {
    label: 'Prioritas Tinggi',
    description: 'Ditemukan pola yang perlu diperiksa lebih lanjut.',
    container: 'border-red-500/30 bg-red-500/5',
    icon: 'text-red-400 bg-red-500/10',
    badge: 'border-red-500/30 bg-red-500/10 text-red-300',
    title: 'text-red-300',
  },
  MEDIUM: {
    label: 'Perlu Verifikasi',
    description: 'Terdapat indikasi yang membutuhkan pemeriksaan administratif.',
    container: 'border-amber-500/30 bg-amber-500/5',
    icon: 'text-amber-400 bg-amber-500/10',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    title: 'text-amber-300',
  },
  NORMAL: {
    label: 'Tidak Ada Indikasi',
    description: 'Tidak ditemukan indikasi penyimpangan berdasarkan pemeriksaan saat ini.',
    container: 'border-emerald-500/30 bg-emerald-500/5',
    icon: 'text-emerald-400 bg-emerald-500/10',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    title: 'text-emerald-300',
  },
} as const;

const getSeverityConfig = (severity: string) => {
  if (severity === 'HIGH') return severityConfig.HIGH;
  if (severity === 'MEDIUM') return severityConfig.MEDIUM;
  return severityConfig.NORMAL;
};

const getResultClass = (result: string) => {
  const value = result?.toUpperCase();

  if (['COMPLETE', 'DONE'].includes(value)) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }

  if (value === 'CANCEL') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }

  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
};

const getVerificationStatus = (status?: string) => {
  switch (status) {
    case 'CONFIRMED_DISCREPANCY':
      return {
        label: 'TERKONFIRMASI TIDAK SESUAI',
        className: 'border-red-500/30 bg-red-500/10 text-red-300',
      };

    case 'NORMAL_VERIFIED':
      return {
        label: 'VALID - NORMAL TERVERIFIKASI',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      };

    case 'INCONCLUSIVE':
      return {
        label: 'MEMBUTUHKAN KLARIFIKASI',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      };

    default:
      return {
        label: 'BELUM DIREVIEW',
        className: 'border-slate-700 bg-slate-800 text-slate-300',
      };
  }
};

interface InfoCardProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  label,
  children,
  className = '',
}) => (
  <div
    className={`min-w-0 rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}
  >
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    {children}
  </div>
);

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  children,
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-cyan-400">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        {title}
      </h3>
    </div>
    {children}
  </section>
);

export const AnomalyDrawer: React.FC<AnomalyDrawerProps> = ({
  record,
  onClose,
  onOpenSupervisorReview,
}) => {
  if (!record) return null;

  const severity = getSeverityConfig(record.compositeSeverity);
  const verification = getVerificationStatus(
    record.supervisorVerification?.status
  );

  const isZeroDuration = record.recordingWindowMinutes === 0;
  const hasViolations = record.ruleViolations.length > 0;

  const mlScore = Number.isFinite(record.mlScore)
    ? record.mlScore.toFixed(3)
    : 'N/A';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="anomaly-drawer-title"
        className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-[#0b1220] text-slate-100 shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#0e1729] px-6 py-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-400">
                Pemeriksaan Work Order
              </span>

              <span className="text-slate-600">/</span>

              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-300">
                {record.networkType || 'Jaringan tidak diketahui'}
              </span>

              <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                {record.Branch || 'Branch tidak tersedia'}
              </span>
            </div>

            <h2
              id="anomaly-drawer-title"
              className="truncate text-lg font-bold tracking-tight text-white"
            >
              WO #{record.CUST_ACCT}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Detail data dan hasil pemeriksaan operasional
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail work order"
            className="ml-4 rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <X size={19} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">

          {/* Anomaly Summary */}
          <section className={`rounded-xl border p-4 ${severity.container}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${severity.icon}`}>
                {record.compositeSeverity === 'NORMAL' ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <AlertTriangle size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-sm font-bold ${severity.title}`}>
                    {severity.label}
                  </h3>

                  <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${severity.badge}`}>
                    {record.compositeSeverity}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {record.neutralIndicationReason ||
                    severity.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/5 bg-black/10 p-3">
                    <p className="text-[10px] text-slate-500">
                      Isolation Forest Score
                    </p>
                    <p className="mt-1 font-mono text-base font-bold text-cyan-300">
                      {mlScore}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-black/10 p-3">
                    <p className="text-[10px] text-slate-500">
                      Aturan yang Terpicu
                    </p>
                    <p className="mt-1 font-mono text-base font-bold text-amber-300">
                      {record.ruleViolations.length}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  Skor model merupakan indikator pola data, bukan probabilitas
                  kesalahan atau bukti pelanggaran.
                </p>
              </div>
            </div>
          </section>

          {/* Work Order Information */}
          <Section
            title="Informasi Work Order"
            icon={<FileText size={15} />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="Identitas Pelanggan">
                <p className="break-words text-sm font-semibold text-white">
                  {record.Customer_Name || '-'}
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  CUST_ACCT: {record.CUST_ACCT || '-'}
                </p>
              </InfoCard>

              <InfoCard label="Teknisi Pelaksana">
                <div className="flex items-center gap-2">
                  <UserRound size={15} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-white">
                    {record.installer || 'Belum ditentukan'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {record.Branch || 'Branch tidak tersedia'}
                </p>
              </InfoCard>

              <InfoCard label="Jenis Pekerjaan">
                <p className="break-words text-sm font-semibold text-cyan-300">
                  {record.jobTask || '-'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Job Type: {record.jobType || '-'}
                </p>
                {record.Routing && (
                  <p className="mt-1 text-xs text-slate-400">
                    Routing: {record.Routing}
                  </p>
                )}
              </InfoCard>

              <InfoCard label="Jadwal Penugasan">
                <p className="text-sm font-semibold text-white">
                  {record.schDate || '-'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Slot: {record.schTime || 'Anytime'}
                </p>
                {record.Stat_GD && (
                  <p className="mt-1 text-xs text-slate-400">
                    Stat GD: {record.Stat_GD}
                  </p>
                )}
              </InfoCard>
            </div>
          </Section>

          {/* Time and Result */}
          <Section
            title="Waktu dan Hasil Pekerjaan"
            icon={<Clock3 size={15} />}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="Waktu Mulai dan Selesai">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
                  <Clock3 size={15} className="text-cyan-400" />
                  {record.start || '-'} – {record.finish || '-'}
                </div>

                <p className={`mt-3 text-xs font-medium ${
                  isZeroDuration ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  Durasi pencatatan:{' '}
                  {record.recordingWindowMinutes !== null &&
                  record.recordingWindowMinutes !== undefined
                    ? `${record.recordingWindowMinutes} menit`
                    : 'Tidak tersedia'}
                </p>

                {isZeroDuration && (
                  <p className="mt-1 text-[10px] text-amber-400">
                    Durasi nol perlu diperiksa berdasarkan konteks pekerjaan.
                  </p>
                )}
              </InfoCard>

              <InfoCard label="Hasil Pekerjaan">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${getResultClass(record.resultChoice)}`}>
                    {record.resultChoice || 'BELUM ADA STATUS'}
                  </span>
                </div>

                {record.Confirmation_Status && (
                  <p className="mt-3 text-xs text-slate-400">
                    Konfirmasi: {record.Confirmation_Status}
                  </p>
                )}
              </InfoCard>
            </div>
          </Section>

          {/* Address */}
          <Section
            title="Lokasi Pelanggan"
            icon={<MapPin size={15} />}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs leading-relaxed text-slate-300">
                {record.Address || 'Alamat tidak tersedia pada data WO.'}
              </p>
            </div>
          </Section>

          {/* Technician Remark */}
          <Section
            title="Catatan Pekerjaan"
            icon={<FileText size={15} />}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                Result Remark
              </p>

              <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-300">
                {record.resultRemark ||
                  'Tidak ada catatan tambahan dari teknisi.'}
              </pre>
            </div>

            {(record.wipComment || record.monitoring_Remark) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {record.wipComment && (
                  <InfoCard label="WIP Comment">
                    <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">
                      {record.wipComment}
                    </p>
                  </InfoCard>
                )}

                {record.monitoring_Remark && (
                  <InfoCard label="Monitoring Remark">
                    <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">
                      {record.monitoring_Remark}
                    </p>
                  </InfoCard>
                )}
              </div>
            )}
          </Section>

          {/* Rule Validation */}
          <Section
            title={`Hasil Validasi Aturan (${record.ruleViolations.length})`}
            icon={<ShieldCheck size={15} />}
          >
            {!hasViolations ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Tidak ada aturan yang terpicu
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Data tidak menunjukkan pelanggaran terhadap aturan yang
                    saat ini diaktifkan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {record.ruleViolations.map((violation, index) => (
                  <div
                    key={`${violation.ruleId}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-bold text-white">
                          {violation.ruleId}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">
                          {violation.ruleName}
                        </p>
                      </div>

                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">
                        {violation.severity}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                      {violation.description}
                    </p>

                    <div className="mt-3 flex items-start gap-2 border-t border-slate-800 pt-3">
                      <ChevronRight
                        size={14}
                        className="mt-0.5 shrink-0 text-cyan-400"
                      />
                      <p className="text-xs leading-relaxed text-cyan-300">
                        {violation.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Supervisor Review */}
          <Section
            title="Verifikasi Supervisor"
            icon={<ClipboardCheck size={15} />}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Status pemeriksaan
                  </p>
                  <span className={`mt-2 inline-block rounded-md border px-2.5 py-1 text-[10px] font-bold ${verification.className}`}>
                    {verification.label}
                  </span>
                </div>

                {onOpenSupervisorReview && (
                  <button
                    type="button"
                    onClick={() => onOpenSupervisorReview(record)}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Buka Pemeriksaan
                  </button>
                )}
              </div>

              {record.supervisorVerification?.notes && (
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Catatan Supervisor
                  </p>
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-300">
                    {record.supervisorVerification.notes}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Data Source */}
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity size={14} />
              <span className="text-[11px]">Referensi data sumber</span>
            </div>

            <span className="font-mono text-xs text-slate-300">
              Baris #{record.originalRowIndex + 1}
            </span>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-800 bg-[#0e1729] px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={14} />
            Audit Work Order
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Tutup Detail
          </button>
        </footer>
      </aside>
    </div>
  );
};
