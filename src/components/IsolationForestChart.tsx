
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ISOLATION FOREST CHART
 * FTTH & HFC Work Order Anomaly Detection
 */

import React, { useMemo } from 'react';
import {
  AlertCircle,
  Cpu,
  CheckCircle2,
  Info,
} from 'lucide-react';

import {
  IsolationForestStats,
  PreprocessedWorkOrder,
} from '../types/telco';

import { IsolationForestDecisionSpace } from './IsolationForestDecisionSpace';

interface IsolationForestChartProps {
  stats: IsolationForestStats;
  records: PreprocessedWorkOrder[];
  onSelectRecord?: (record: PreprocessedWorkOrder) => void;
}

type ModelRecord = PreprocessedWorkOrder & {
  prediction?: number;
  isMlAnomaly?: boolean;
  is_ml_anomaly?: boolean;
  anomalyLevel?: string;
  anomaly_level?: string;
  anomaly_score?: number;
  anomalyScore?: number;
};

type DistributionBucket = {
  label: string;
  count: number;
  color: string;
  description: string;
};

// ============================================================
// 1. MODEL HELPERS
// ============================================================

const getModelRecord = (
  record: PreprocessedWorkOrder
): ModelRecord => {
  return record as ModelRecord;
};

/**
 * Menggunakan label asli dari hasil prediksi Python.
 * Tidak menentukan anomali berdasarkan ambang mlScore.
 */
const getAnomalyStatus = (
  record: PreprocessedWorkOrder
): boolean | null => {
  const item = getModelRecord(record);

  if (typeof item.isMlAnomaly === 'boolean') {
    return item.isMlAnomaly;
  }

  if (typeof item.is_ml_anomaly === 'boolean') {
    return item.is_ml_anomaly;
  }

  if (typeof item.prediction === 'number') {
    return item.prediction === -1;
  }

  return null;
};

const getAnomalyLevel = (
  record: PreprocessedWorkOrder
): 'NORMAL' | 'MODERATE' | 'EXTREME' => {
  const isAnomaly = getAnomalyStatus(record);

  if (isAnomaly === null || !isAnomaly) {
    return 'NORMAL';
  }

  const item = getModelRecord(record);

  const level = String(
    item.anomalyLevel ?? item.anomaly_level ?? ''
  ).toUpperCase();

  if (level === 'EXTREME') {
    return 'EXTREME';
  }

  return 'MODERATE';
};

const getAnomalyScore = (
  record: PreprocessedWorkOrder
): number | null => {
  const item = getModelRecord(record);

  const rawScore =
    item.anomaly_score ??
    item.anomalyScore ??
    record.mlScore;

  if (rawScore === null || rawScore === undefined) {
    return null;
  }

  const score = Number(rawScore);

  return Number.isFinite(score) ? score : null;
};

// ============================================================
// 2. MAIN COMPONENT
// ============================================================

export const IsolationForestChart: React.FC<
  IsolationForestChartProps
> = ({
  stats,
  records,
  onSelectRecord,
}) => {

  // ==========================================================
  // A. CLASSIFICATION STATISTICS
  // ==========================================================

  const classification = useMemo(() => {
    const labeledRecords = records.filter(
      record => getAnomalyStatus(record) !== null
    );

    const normalRecords = labeledRecords.filter(
      record => getAnomalyStatus(record) === false
    );

    const anomalyRecords = labeledRecords.filter(
      record => getAnomalyStatus(record) === true
    );

    const moderateRecords = anomalyRecords.filter(
      record => getAnomalyLevel(record) === 'MODERATE'
    );

    const extremeRecords = anomalyRecords.filter(
      record => getAnomalyLevel(record) === 'EXTREME'
    );

    return {
      total: records.length,
      labeled: labeledRecords.length,
      unclassified: records.length - labeledRecords.length,
      normal: normalRecords.length,
      anomalies: anomalyRecords.length,
      moderate: moderateRecords.length,
      extreme: extremeRecords.length,
    };
  }, [records]);

  // ==========================================================
  // B. NETWORK BREAKDOWN
  // ==========================================================

  const networkBreakdown = useMemo(() => {
    const ftth = records.filter(
      record =>
        record.networkType === 'FTTH' &&
        getAnomalyStatus(record) === true
    ).length;

    const hfc = records.filter(
      record =>
        record.networkType === 'HFC' &&
        getAnomalyStatus(record) === true
    ).length;

    return { ftth, hfc };
  }, [records]);

  // ==========================================================
  // C. DISTRIBUTION
  // ==========================================================

  const buckets: DistributionBucket[] = [
    {
      label: 'Normal',
      count: classification.normal,
      color: 'bg-emerald-500',
      description: 'Prediction = 1',
    },
    {
      label: 'Anomali Moderat',
      count: classification.moderate,
      color: 'bg-amber-500',
      description: 'Kandidat anomali',
    },
    {
      label: 'Anomali Ekstrem',
      count: classification.extreme,
      color: 'bg-red-500',
      description: 'Prioritas verifikasi',
    },
  ];

  const maxBucketCount = Math.max(
    ...buckets.map(bucket => bucket.count),
    1
  );

  // ==========================================================
  // D. MODEL STATUS
  // ==========================================================

  const isDualModel =
    stats.modelType === 'SEPARATE_FTTH_HFC';

  const bothModelsTrained =
    stats.ftthModelTrained &&
    stats.hfcModelTrained;

  // ==========================================================
  // E. RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* MODEL STATUS */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <div className="flex items-start gap-3">

          <div className="rounded-lg bg-slate-100 p-2 text-slate-800">
            <Cpu className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-sm font-semibold text-slate-900">
                Status Pelatihan Model:{' '}
                {isDualModel
                  ? 'Dual-Model FTTH & HFC'
                  : 'Model Global Terpadu'}
              </h3>

              {bothModelsTrained ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Model Terpisah Aktif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Info className="h-3.5 w-3.5" />
                  Model Terpadu
                </span>
              )}

            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Isolation Forest mengidentifikasi pola Work
              Order yang berbeda dari karakteristik data
              operasional berdasarkan pemisahan observasi
              menggunakan pohon isolasi.
            </p>

          </div>
        </div>

        {/* WARNING */}
        {stats.warningMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">

            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <div>
              <span className="block font-semibold">
                Informasi Dataset
              </span>

              <span className="text-amber-800">
                {stats.warningMessage}
              </span>
            </div>

          </div>
        )}

        {/* MODEL SAMPLE DETAILS */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-4">

          <div>
            <span className="block text-[11px] text-slate-400">
              Sampel FTTH
            </span>

            <span className="font-mono font-bold tabular-nums text-slate-900">
              {stats.ftthSampleCount} WO
            </span>

            <span className="mt-0.5 block text-[10px] text-slate-500">
              {stats.ftthModelTrained
                ? 'Model Spesifik Aktif'
                : 'Model Bersama'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400">
              Sampel HFC
            </span>

            <span className="font-mono font-bold tabular-nums text-slate-900">
              {stats.hfcSampleCount} WO
            </span>

            <span className="mt-0.5 block text-[10px] text-slate-500">
              {stats.hfcModelTrained
                ? 'Model Spesifik Aktif'
                : 'Model Bersama'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400">
              Anomali Model
            </span>

            <span className="font-mono font-bold tabular-nums text-slate-900">
              {classification.anomalies} WO
            </span>

            <span className="mt-0.5 block text-[10px] text-slate-500">
              Berdasarkan label prediksi
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400">
              Jumlah Pohon
            </span>

            <span className="font-mono font-bold tabular-nums text-slate-900">
              100 iTrees
            </span>

            <span className="mt-0.5 block text-[10px] text-slate-500">
              Ensemble Isolation Forest
            </span>
          </div>

        </div>

        {/* CONTAMINATION */}
        <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          Kontaminasi konfigurasi:{' '}
          <strong className="font-mono text-slate-700">
            {stats.contaminationRate}%
          </strong>
          <span className="ml-1">
            (asumsi proporsi kandidat anomali)
          </span>
        </div>

        {/* NETWORK ANOMALY BREAKDOWN */}
        <div className="mt-3 grid grid-cols-2 gap-3">

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="text-[11px] text-slate-500">
              Kandidat Anomali FTTH
            </span>

            <p className="mt-1 font-mono text-lg font-bold text-slate-900">
              {networkBreakdown.ftth} WO
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="text-[11px] text-slate-500">
              Kandidat Anomali HFC
            </span>

            <p className="mt-1 font-mono text-lg font-bold text-slate-900">
              {networkBreakdown.hfc} WO
            </p>
          </div>

        </div>

      </div>

      {/* MODEL CLASSIFICATION DISTRIBUTION */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <h3 className="mb-1 text-xs font-bold tracking-tight text-slate-900">
          Distribusi Hasil Klasifikasi Isolation Forest
        </h3>

        <p className="mb-4 text-xs text-slate-500">
          Klasifikasi berdasarkan label prediksi model:
          normal (1) dan kandidat anomali (-1).
          Kategori moderat dan ekstrem merupakan pembagian
          prioritas pemeriksaan kandidat anomali.
        </p>

        <div className="space-y-4">

          {buckets.map((bucket, index) => {
            const percentage =
              classification.labeled > 0
                ? (bucket.count / classification.labeled) * 100
                : 0;

            const barWidth =
              classification.labeled > 0
                ? (bucket.count / maxBucketCount) * 100
                : 0;

            return (
              <div
                key={index}
                className="space-y-1"
              >

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">

                  <div>
                    <span className="font-medium text-slate-700">
                      {bucket.label}
                    </span>

                    <span className="ml-2 text-[10px] text-slate-400">
                      {bucket.description}
                    </span>
                  </div>

                  <span className="font-mono tabular-nums text-slate-600">
                    {bucket.count.toLocaleString('id-ID')} WO
                    {' '}
                    ({percentage.toFixed(1)}%)
                  </span>

                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">

                  <div
                    className={`h-full rounded-full ${bucket.color} transition-all duration-300`}
                    style={{
                      width: `${barWidth}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

        </div>

        {classification.unclassified > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              {classification.unclassified} WO belum memiliki
              label prediksi. Data tersebut tidak dimasukkan
              ke perhitungan distribusi.
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
          Total data berlabel: {classification.labeled} WO
          {' | '}
          Total data: {classification.total} WO
        </div>

      </div>

      {/* MODEL FEATURES */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">

        <h3 className="mb-1 text-xs font-bold tracking-tight text-slate-900">
          Fitur Operasional yang Digunakan Model
        </h3>

        <p className="mb-3 text-xs text-slate-500">
          Model Python menggunakan enam fitur numerik
          operasional. Identitas pribadi pelanggan tidak
          digunakan sebagai variabel pelatihan.
        </p>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">

          {[
            {
              title: 'Durasi Pencatatan',
              desc: 'Interval waktu antara START dan FINISH untuk mengamati pola durasi penyelesaian pekerjaan.',
            },
            {
              title: 'Jam Mulai Pelaksanaan',
              desc: 'Jam dimulainya pekerjaan teknisi berdasarkan pencatatan START.',
            },
            {
              title: 'Jam Selesai Pelaksanaan',
              desc: 'Jam berakhirnya pekerjaan teknisi berdasarkan pencatatan FINISH.',
            },
            {
              title: 'Jeda Jadwal ke Pelaksanaan',
              desc: 'Perbedaan waktu antara jadwal pekerjaan dan waktu pelaksanaan.',
            },
            {
              title: 'Volume Harian Teknisi',
              desc: 'Jumlah Work Order yang dikerjakan teknisi dalam satu hari.',
            },
            {
              title: 'Durasi Laporan ke Penutupan',
              desc: 'Interval waktu antara pelaporan hasil pekerjaan dan penutupan tiket.',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
            >

              <span className="block font-semibold text-slate-900">
                {feature.title}
              </span>

              <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                {feature.desc}
              </span>

            </div>
          ))}

        </div>

      </div>

      {/* DECISION SPACE */}
      {onSelectRecord && (
        <IsolationForestDecisionSpace
          records={records}
          onSelectRecord={onSelectRecord}
        />
      )}

      {/* FINAL NOTE */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">

        <div className="flex items-start gap-2">

          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

          <p className="text-xs leading-relaxed text-amber-900">
            Hasil Isolation Forest merupakan indikasi
            statistik berdasarkan pola data operasional.
            Kandidat anomali tidak otomatis menunjukkan
            pelanggaran SOP, kesalahan teknisi, atau
            kecurangan. Setiap hasil perlu diverifikasi
            melalui pemeriksaan supervisor.
          </p>

        </div>

      </div>

    </div>
  );
};
