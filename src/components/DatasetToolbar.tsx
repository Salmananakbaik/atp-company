
import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Network,
  Download,
  CheckCircle2,
  FileText,
  X,
  Database,
  AlertTriangle,
  Layers3,
  Settings2,
  ChevronDown,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';

import {
  PreprocessingStats,
  IsolationForestStats,
} from '../types/telco';

import { parseUploadedFile } from '../utils/excelExporter';

interface DatasetToolbarProps {
  currentDatasetName: string;
  onClearDataset: () => void;
  
  onSelectActual8?: () => void;
  onSelectSample50: () => void;
  onSelectHistorical1250: () => void;
  onOpenMappingModal: () => void;
  onOpenNetworkModal: () => void;
  onExportExcel?: () => void;
  onFileUpload: (
    headers: string[],
    rows: Record<string, any>[],
    filename: string
  ) => void;
  preprocStats: PreprocessingStats;
  mlStats: IsolationForestStats;
}

export const DatasetToolbar: React.FC<DatasetToolbarProps> = ({
  currentDatasetName,
  onClearDataset,
  onSelectActual8,
  onSelectSample50,
  onSelectHistorical1250,
  onOpenMappingModal,
  onOpenNetworkModal,
  onExportExcel,
  onFileUpload,
  preprocStats,
  mlStats,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const formatNumber = (value: number | undefined) => {
    return (value ?? 0).toLocaleString('id-ID');
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert('Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.');
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);

      const { headers, rows } = await parseUploadedFile(file);

      if (!headers.length || !rows.length) {
        throw new Error('File tidak memiliki data yang dapat dibaca.');
      }

      onFileUpload(headers, rows, file.name);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membaca file.';

      alert(`Gagal membaca file: ${message}`);
    } finally {
      setIsImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const ftthPercentage =
    preprocStats.validRows > 0
      ? Math.round(
          (preprocStats.ftthCount / preprocStats.validRows) * 100
        )
      : 0;

  const hfcPercentage =
    preprocStats.validRows > 0
      ? Math.round(
          (preprocStats.hfcCount / preprocStats.validRows) * 100
        )
      : 0;

  return (
    <div className="space-y-5 text-slate-100">

      {/* HEADER WORK ORDER */}
      <section className="rounded-2xl border border-slate-800 bg-[#0b1220] p-5 shadow-lg shadow-black/10">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* Informasi dataset */}
          <div className="min-w-0">

            <div className="mb-2 flex flex-wrap items-center gap-2">

              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Dataset Operasional
              </span>

              <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[10px] font-medium text-slate-400">
                {formatNumber(preprocStats.columnCount)} kolom
              </span>

            </div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
              </div>

              <div className="min-w-0">

                <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                  Work Order
                </h1>

                <div className="mt-1 flex items-center gap-2">
                  <p
                    className="max-w-[420px] truncate text-xs text-slate-400"
                    title={currentDatasetName}
                  >
                    {currentDatasetName || 'Belum ada dataset dipilih'}
                  </p>

                  {currentDatasetName &&
                    currentDatasetName !== 'Belum ada dataset diimpor' && (
                      <button
                        type="button"
                        onClick={onClearDataset}
                        title="Hapus dataset aktif"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-800 bg-red-950/50 px-2 py-1 text-xs text-red-400 transition hover:bg-red-900 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    )}
                </div>

              </div>

            </div>

          </div>

          {/* Tombol utama */}
          <div className="flex flex-wrap items-center gap-2">

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-cyan-500/10 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {isImporting ? 'Memproses...' : 'Impor Dataset'}
            </button>

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                Ekspor
              </button>
            )}

          </div>

        </div>

        {/* Informasi jumlah data */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-3">

          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-cyan-400" />

            <span className="text-slate-400">
              Total baris
            </span>

            <span className="ml-auto font-semibold tabular-nums text-white">
              {formatNumber(preprocStats.totalRows)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />

            <span className="text-slate-400">
              Baris valid
            </span>

            <span className="ml-auto font-semibold tabular-nums text-emerald-400">
              {formatNumber(preprocStats.validRows)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-400" />

            <span className="text-slate-400">
              Duplikasi key
            </span>

            <span className="ml-auto font-semibold tabular-nums text-amber-400">
              {formatNumber(preprocStats.duplicateKeysCount)}
            </span>
          </div>

        </div>

      </section>

      {/* RINGKASAN KPI */}
      <section>

        <div className="mb-3 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Ringkasan Dataset
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Statistik data Work Order yang sedang aktif
            </p>
          </div>

          <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-400">
            DATASET AKTIF
          </span>

        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          {/* Total WO */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-4 transition hover:border-slate-700">

            <div className="flex items-center justify-between">

              <span className="text-xs font-medium text-slate-400">
                Total WO Valid
              </span>

              <div className="rounded-lg bg-cyan-500/10 p-2">
                <Database className="h-4 w-4 text-cyan-400" />
              </div>

            </div>

            <div className="mt-3 text-2xl font-bold tabular-nums text-white">
              {formatNumber(preprocStats.validRows)}
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              {formatNumber(preprocStats.columnCount)} atribut operasional
            </p>

          </div>

          {/* Anomali */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-4 transition hover:border-slate-700">

            <div className="flex items-center justify-between">

              <span className="text-xs font-medium text-slate-400">
                Anomali Terdeteksi
              </span>

              <div className="rounded-lg bg-amber-500/10 p-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>

            </div>

            <div className="mt-3 text-2xl font-bold tabular-nums text-amber-400">
              {formatNumber(mlStats.anomaliesDetected)}
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              Kontaminasi model {mlStats.contaminationRate}%
            </p>

          </div>

          {/* FTTH */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-4 transition hover:border-slate-700">

            <div className="flex items-center justify-between">

              <span className="text-xs font-medium text-slate-400">
                Jaringan FTTH
              </span>

              <div className="rounded-lg bg-blue-500/10 p-2">
                <Network className="h-4 w-4 text-blue-400" />
              </div>

            </div>

            <div className="mt-3 text-2xl font-bold tabular-nums text-white">
              {formatNumber(preprocStats.ftthCount)}
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              {ftthPercentage}% dari total WO valid
            </p>

          </div>

          {/* HFC */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-4 transition hover:border-slate-700">

            <div className="flex items-center justify-between">

              <span className="text-xs font-medium text-slate-400">
                Jaringan HFC
              </span>

              <div className="rounded-lg bg-violet-500/10 p-2">
                <Layers3 className="h-4 w-4 text-violet-400" />
              </div>

            </div>

            <div className="mt-3 text-2xl font-bold tabular-nums text-white">
              {formatNumber(preprocStats.hfcCount)}
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              {hfcPercentage}% dari total WO valid
            </p>

          </div>

        </div>

      </section>

      {/* PRIVASI DAN PENGATURAN */}
      <section className="rounded-xl border border-slate-800 bg-[#0b1220] p-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                Perlindungan Data
              </p>

              <p className="text-xs text-slate-500">
                Pastikan data pribadi pelanggan tidak digunakan sebagai fitur ML.
              </p>
            </div>

          </div>

          <details className="group relative">

            <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700">

              <Settings2 className="h-4 w-4 text-cyan-400" />

              Pengaturan Dataset

              <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />

            </summary>

            <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-700 bg-[#111c30] p-2 shadow-2xl">

              <button
                type="button"
                onClick={onOpenMappingModal}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />

                <span>
                  <span className="block font-medium">
                    Pemetaan Kolom
                  </span>

                  <span className="text-xs text-slate-500">
                    {preprocStats.columnCount} kolom terdeteksi
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenNetworkModal}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Network className="h-4 w-4 text-violet-400" />

                <span>
                  <span className="block font-medium">
                    Klasifikasi Jaringan
                  </span>

                  <span className="text-xs text-slate-500">
                    Pengaturan FTTH dan HFC
                  </span>
                </span>
              </button>

              <div className="my-1 border-t border-slate-700" />

              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Pilihan Dataset
              </div>

              {onSelectActual8 && (
                <button
                  type="button"
                  onClick={onSelectActual8}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  8 WO Aktual Excel
                </button>
              )}

              <button
                type="button"
                onClick={onSelectSample50}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Sampel 50 WO
              </button>

              <button
                type="button"
                onClick={onSelectHistorical1250}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Database className="h-4 w-4 text-slate-400" />
                Historis 1.250 WO
              </button>

            </div>

          </details>

        </div>

      </section>

    </div>
  );
};
