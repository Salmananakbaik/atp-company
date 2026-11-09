
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ISOLATION FOREST - MULTIVARIATE DECISION SPACE
 * Work Order FTTH & HFC Anomaly Detection
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  GitBranch,
  Activity,
  Info,
  Layers,
  Target,
} from 'lucide-react';

import { PreprocessedWorkOrder } from '../types/telco';

// ============================================================
// 1. TYPES
// ============================================================

interface IsolationForestDecisionSpaceProps {
  records: PreprocessedWorkOrder[];
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
}

type FeatureKey =
  | 'duration'
  | 'batch'
  | 'volume'
  | 'schToReport';

type FeatureOption = {
  key: FeatureKey;
  label: string;
  unit: string;
};

type AnomalyCategory = 'NORMAL' | 'MODERATE' | 'EXTREME';

type PointData = {
  record: PreprocessedWorkOrder;
  x: number;
  y: number;
  score: number | null;
  category: AnomalyCategory;
};

type ModelRecord = PreprocessedWorkOrder & {
  prediction?: number;
  isMlAnomaly?: boolean;
  is_ml_anomaly?: boolean;
  anomaly_score?: number;
  anomalyScore?: number;
  anomaly_level?: string;
  anomalyLevel?: string;
  decision_score?: number;
  decisionScore?: number;
};

// ============================================================
// 2. CONFIGURATION
// ============================================================

const MAX_DISPLAY_POINTS = 600;

const FEATURES: FeatureOption[] = [
  {
    key: 'duration',
    label: 'Durasi Pencatatan',
    unit: 'menit',
  },
  {
    key: 'batch',
    label: 'Kerapatan Pelaporan Batch',
    unit: 'WO',
  },
  {
    key: 'volume',
    label: 'Volume Harian Teknisi',
    unit: 'WO/hari',
  },
  {
    key: 'schToReport',
    label: 'Jeda Jadwal ke Laporan',
    unit: 'jam',
  },
];

// ============================================================
// 3. DATA HELPERS
// ============================================================

const getModelRecord = (
  record: PreprocessedWorkOrder
): ModelRecord => {
  return record as ModelRecord;
};

/**
 * Mengambil status anomali dari hasil prediksi model.
 *
 * Prioritas:
 * 1. isMlAnomaly
 * 2. is_ml_anomaly
 * 3. prediction === -1
 *
 * Tidak menggunakan ambang mlScore untuk menentukan label.
 */
const getModelAnomalyStatus = (
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

/**
 * Skor hanya digunakan untuk menampilkan tingkat
 * penyimpangan, bukan menentukan label anomali.
 */
const getScore = (
  record: PreprocessedWorkOrder
): number | null => {
  const item = getModelRecord(record);

  const rawScore =
    item.anomaly_score ??
    item.anomalyScore ??
    record.mlScore;

  const score = Number(rawScore);

  if (!Number.isFinite(score)) {
    return null;
  }

  return score;
};

const getAnomalyLevel = (
  record: PreprocessedWorkOrder
): AnomalyCategory => {
  const isAnomaly = getModelAnomalyStatus(record);

  if (isAnomaly === null || !isAnomaly) {
    return 'NORMAL';
  }

  const item = getModelRecord(record);

  const rawLevel = String(
    item.anomaly_level ?? item.anomalyLevel ?? ''
  ).toUpperCase();

  if (rawLevel === 'EXTREME') {
    return 'EXTREME';
  }

  if (rawLevel === 'MODERATE') {
    return 'MODERATE';
  }

  // Jika backend belum mengirim anomaly_level,
  // seluruh kandidat anomali tetap masuk kategori moderat.
  return 'MODERATE';
};

const getCategoryColor = (
  category: AnomalyCategory
): string => {
  switch (category) {
    case 'EXTREME':
      return '#DC2626';

    case 'MODERATE':
      return '#F59E0B';

    default:
      return '#64748B';
  }
};

const getFeatureValue = (
  record: PreprocessedWorkOrder,
  feature: FeatureKey
): number | null => {
  let rawValue: unknown;

  switch (feature) {
    case 'duration':
      rawValue = record.recordingWindowMinutes;
      break;

    case 'batch':
      rawValue = record.batchReportWindowCount;
      break;

    case 'volume':
      rawValue = record.techDailyJobCount;
      break;

    case 'schToReport':
      rawValue = record.schToReportHours;
      break;
  }

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ''
  ) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : null;
};

const formatNumber = (
  value: number,
  decimals = 2
): string => {
  return value.toLocaleString('id-ID', {
    maximumFractionDigits: decimals,
  });
};

const getFeatureLabel = (key: FeatureKey): string => {
  return FEATURES.find(item => item.key === key)?.label ?? key;
};

// ============================================================
// 4. ISOLATION TREE DIAGRAM
// ============================================================

const IsolationTreeDiagram: React.FC = () => {
  const nodes = [
    { x: 80, y: 115, label: 'Split Fitur A' },
    { x: 390, y: 115, label: 'Split Fitur B' },
    { x: 10, y: 225, label: 'Kelompok 1' },
    { x: 165, y: 225, label: 'Kelompok 2' },
    { x: 320, y: 225, label: 'Kelompok 3' },
    { x: 475, y: 225, label: 'Kelompok 4' },
  ];

  const leaves = [
    { x: 15, label: 'Normal', color: '#10B981' },
    { x: 95, label: 'Normal', color: '#10B981' },
    { x: 175, label: 'Anomali', color: '#F59E0B' },
    { x: 255, label: 'Isolasi', color: '#DC2626' },
    { x: 335, label: 'Normal', color: '#10B981' },
    { x: 415, label: 'Anomali', color: '#F59E0B' },
    { x: 495, label: 'Normal', color: '#10B981' },
    { x: 575, label: 'Isolasi', color: '#DC2626' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">
          Ilustrasi Pohon Isolasi
        </h3>
      </div>

      <p className="text-xs text-slate-500">
        Proses pemisahan data Work Order melalui pembagian
        fitur dan nilai ambang secara acak.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        <svg
          viewBox="0 0 660 370"
          className="mx-auto h-auto w-full min-w-[520px]"
          role="img"
          aria-label="Ilustrasi pohon keputusan Isolation Forest"
        >
          {/* ROOT */}
          <rect
            x="235"
            y="15"
            width="190"
            height="55"
            rx="9"
            fill="#0F172A"
          />

          <text
            x="330"
            y="38"
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontWeight="bold"
          >
            Dataset Work Order
          </text>

          <text
            x="330"
            y="55"
            textAnchor="middle"
            fill="#CBD5E1"
            fontSize="10"
          >
            Observasi FTTH dan HFC
          </text>

          {/* CONNECTIONS */}
          <g
            stroke="#94A3B8"
            strokeWidth="2"
            fill="none"
          >
            <path d="M330 70 L160 115" />
            <path d="M330 70 L470 115" />

            <path d="M160 160 L75 225" />
            <path d="M160 160 L230 225" />

            <path d="M470 160 L385 225" />
            <path d="M470 160 L540 225" />

            <path d="M75 270 L40 315" />
            <path d="M75 270 L120 315" />

            <path d="M230 270 L200 315" />
            <path d="M230 270 L280 315" />

            <path d="M385 270 L360 315" />
            <path d="M385 270 L440 315" />

            <path d="M540 270 L520 315" />
            <path d="M540 270 L600 315" />
          </g>

          {/* SPLIT NODES */}
          {nodes.map((node, index) => {
            const isSplit = index < 2;

            return (
              <g key={node.label}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={isSplit ? 160 : 130}
                  height="45"
                  rx="8"
                  fill={isSplit ? '#DBEAFE' : '#E2E8F0'}
                  stroke={isSplit ? '#3B82F6' : '#94A3B8'}
                  strokeWidth="1.4"
                />

                <text
                  x={node.x + (isSplit ? 80 : 65)}
                  y={node.y + 27}
                  textAnchor="middle"
                  fill="#1E3A8A"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* LEAF NODES */}
          {leaves.map((leaf, index) => (
            <g key={`${leaf.label}-${index}`}>
              <rect
                x={leaf.x}
                y="315"
                width="65"
                height="32"
                rx="6"
                fill={leaf.color}
              />

              <text
                x={leaf.x + 32.5}
                y="335"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
              >
                {leaf.label}
              </text>
            </g>
          ))}

          <g
            fill="#64748B"
            fontSize="9"
            textAnchor="middle"
          >
            <text x="245" y="95">Ya</text>
            <text x="415" y="95">Tidak</text>
          </g>
        </svg>

        <div className="mt-3 flex flex-wrap justify-center gap-4 border-t border-slate-200 pt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-blue-500" />
            Node pemisahan
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
            Normal
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-amber-500" />
            Anomali
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-600" />
            Isolasi lebih cepat
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

          <p className="text-xs leading-relaxed text-amber-900">
            Diagram ini merupakan ilustrasi konseptual.
            Pohon Isolation Forest yang sebenarnya dibentuk
            melalui pemilihan fitur dan nilai pemisah secara
            acak. Data yang lebih cepat terisolasi cenderung
            memiliki skor anomali lebih tinggi.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 5. MAIN COMPONENT
// ============================================================

export const IsolationForestDecisionSpace:
  React.FC<IsolationForestDecisionSpaceProps> = ({
    records,
    onSelectRecord,
  }) => {
    const [xAxis, setXAxis] =
      useState<FeatureKey>('duration');

    const [yAxis, setYAxis] =
      useState<FeatureKey>('batch');

    const [hoveredRecord, setHoveredRecord] =
      useState<PreprocessedWorkOrder | null>(null);

    const [selectedRecord, setSelectedRecord] =
      useState<PreprocessedWorkOrder | null>(null);

    // ========================================================
    // A. DATA CLASSIFICATION
    // ========================================================

    const classifiedRecords = useMemo(() => {
      return records
        .map(record => ({
          record,
          isAnomaly: getModelAnomalyStatus(record),
          category: getAnomalyLevel(record),
          score: getScore(record),
        }))
        .filter(item => item.isAnomaly !== null);
    }, [records]);

    // ========================================================
    // B. STATISTICS
    // ========================================================

    const statistics = useMemo(() => {
      const normal = classifiedRecords.filter(
        item => !item.isAnomaly
      );

      const anomalies = classifiedRecords.filter(
        item => item.isAnomaly
      );

      const moderate = anomalies.filter(
        item => item.category === 'MODERATE'
      );

      const extreme = anomalies.filter(
        item => item.category === 'EXTREME'
      );

      return {
        total: records.length,
        classified: classifiedRecords.length,
        unclassified: records.length - classifiedRecords.length,
        normal: normal.length,
        moderate: moderate.length,
        extreme: extreme.length,
        anomalies: anomalies.length,
      };
    }, [records, classifiedRecords]);

    // ========================================================
    // C. DISPLAY SAMPLING
    // ========================================================

    const displayRecords = useMemo(() => {
      if (classifiedRecords.length <= MAX_DISPLAY_POINTS) {
        return classifiedRecords;
      }

      const anomalies = classifiedRecords.filter(
        item => item.isAnomaly
      );

      const normals = classifiedRecords.filter(
        item => !item.isAnomaly
      );

      const normalSlots = Math.max(
        0,
        MAX_DISPLAY_POINTS - anomalies.length
      );

      return [
        ...anomalies,
        ...normals.slice(0, normalSlots),
      ];
    }, [classifiedRecords]);

    // ========================================================
    // D. SCATTER PLOT DATA
    // ========================================================

    const chartData = useMemo<PointData[]>(() => {
      return displayRecords
        .map(item => {
          const x = getFeatureValue(item.record, xAxis);
          const y = getFeatureValue(item.record, yAxis);

          if (x === null || y === null) {
            return null;
          }

          return {
            record: item.record,
            x,
            y,
            score: item.score,
            category: item.category,
          };
        })
        .filter(
          (item): item is PointData => item !== null
        );
    }, [displayRecords, xAxis, yAxis]);

    // ========================================================
    // E. CHART SCALE
    // ========================================================

    const xMax = useMemo(() => {
      const values = chartData.map(item => item.x);

      return Math.max(1, ...values) * 1.1;
    }, [chartData]);

    const yMax = useMemo(() => {
      const values = chartData.map(item => item.y);

      return Math.max(1, ...values) * 1.1;
    }, [chartData]);

    const svgWidth = 760;
    const svgHeight = 370;

    const paddingLeft = 65;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 55;

    const plotWidth =
      svgWidth - paddingLeft - paddingRight;

    const plotHeight =
      svgHeight - paddingTop - paddingBottom;

    const getPointPosition = (
      x: number,
      y: number
    ) => ({
      cx: paddingLeft + (x / xMax) * plotWidth,
      cy:
        paddingTop +
        plotHeight -
        (y / yMax) * plotHeight,
    });

    // ========================================================
    // F. FEATURE OPTIONS
    // ========================================================

    const availableYAxis = FEATURES.filter(
      feature => feature.key !== xAxis
    );

    const selectedXFeature = FEATURES.find(
      feature => feature.key === xAxis
    )!;

    const selectedYFeature = FEATURES.find(
      feature => feature.key === yAxis
    )!;

    // ========================================================
    // G. RENDER
    // ========================================================

    return (
      <div className="space-y-5">

        {/* HEADER */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />

                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Unsupervised Machine Learning
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Isolation Forest Anomaly Detection
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                Analisis pola operasional Work Order FTTH
                dan HFC berdasarkan kombinasi fitur
                operasional dan interval waktu.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Layers className="h-4 w-4 text-blue-600" />

              <div>
                <p className="text-[10px] text-slate-500">
                  Total WO
                </p>

                <p className="font-mono text-sm font-bold text-slate-900">
                  {statistics.total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">

            <div>
              <p className="text-[11px] text-slate-500">
                Data Normal
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-slate-700">
                {statistics.normal}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">
                Deviasi Moderat
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-amber-600">
                {statistics.moderate}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">
                Deviasi Ekstrem
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-red-600">
                {statistics.extreme}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">
                Kandidat Anomali
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-blue-700">
                {statistics.anomalies}
              </p>
            </div>
          </div>

          {statistics.unclassified > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                {statistics.unclassified} WO belum memiliki
                label prediksi model. Pastikan backend
                mengirimkan `prediction` atau `is_ml_anomaly`.
              </p>
            </div>
          )}

          <div className="text-[10px] text-slate-400">
            {statistics.classified} dari {statistics.total} WO
            memiliki label prediksi model.
          </div>
        </div>

        {/* SCATTER PLOT */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />

                <h3 className="text-sm font-bold text-slate-900">
                  Ruang Keputusan Multivariat
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Sebaran hubungan dua fitur operasional
                berdasarkan hasil prediksi Isolation Forest.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                Sumbu X

                <select
                  value={xAxis}
                  onChange={event => {
                    const next = event.target.value as FeatureKey;

                    setXAxis(next);

                    if (next === yAxis) {
                      setYAxis(
                        FEATURES.find(
                          item => item.key !== next
                        )!.key
                      );
                    }
                  }}
                  className="max-w-[175px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  {FEATURES.map(feature => (
                    <option
                      key={feature.key}
                      value={feature.key}
                    >
                      {feature.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                Sumbu Y

                <select
                  value={yAxis}
                  onChange={event =>
                    setYAxis(event.target.value as FeatureKey)
                  }
                  className="max-w-[175px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  {availableYAxis.map(feature => (
                    <option
                      key={feature.key}
                      value={feature.key}
                    >
                      {feature.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* CHART */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            {chartData.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-auto w-full min-w-[520px] select-none"
                role="img"
                aria-label="Scatter plot Isolation Forest"
              >

                {/* GRID */}
                {[0, 1, 2, 3, 4].map(index => {
                  const y =
                    paddingTop + (plotHeight / 4) * index;

                  const x =
                    paddingLeft + (plotWidth / 4) * index;

                  return (
                    <g key={`grid-${index}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />

                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + plotHeight}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />

                      <text
                        x={paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#64748B"
                        fontSize="10"
                      >
                        {formatNumber(
                          yMax * (1 - index / 4)
                        )}
                      </text>

                      <text
                        x={x}
                        y={svgHeight - paddingBottom + 18}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="10"
                      >
                        {formatNumber(xMax * index / 4)}
                      </text>
                    </g>
                  );
                })}

                {/* AXES */}
                <line
                  x1={paddingLeft}
                  y1={paddingTop + plotHeight}
                  x2={svgWidth - paddingRight}
                  y2={paddingTop + plotHeight}
                  stroke="#64748B"
                  strokeWidth="1.5"
                />

                <line
                  x1={paddingLeft}
                  y1={paddingTop}
                  x2={paddingLeft}
                  y2={paddingTop + plotHeight}
                  stroke="#64748B"
                  strokeWidth="1.5"
                />

                {/* X LABEL */}
                <text
                  x={paddingLeft + plotWidth / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {selectedXFeature.label} ({selectedXFeature.unit})
                </text>

                {/* Y LABEL */}
                <text
                  x="14"
                  y={paddingTop + plotHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 14 ${paddingTop + plotHeight / 2})`}
                  fill="#334155"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {selectedYFeature.label} ({selectedYFeature.unit})
                </text>

                {/* DATA POINTS */}
                {chartData.map((point, index) => {
                  const position = getPointPosition(
                    point.x,
                    point.y
                  );

                  const isSelected =
                    selectedRecord?.id === point.record.id;

                  return (
                    <circle
                      key={`${point.record.id}-${index}`}
                      cx={position.cx}
                      cy={position.cy}
                      r={
                        point.category === 'EXTREME'
                          ? 5
                          : point.category === 'MODERATE'
                            ? 3.8
                            : 2.8
                      }
                      fill={getCategoryColor(point.category)}
                      stroke={
                        isSelected ? '#0F172A' : '#FFFFFF'
                      }
                      strokeWidth={isSelected ? 2 : 0.5}
                      opacity={
                        point.category === 'NORMAL'
                          ? 0.45
                          : 0.9
                      }
                      className="cursor-pointer transition-opacity hover:opacity-100"
                      onMouseEnter={() =>
                        setHoveredRecord(point.record)
                      }
                      onMouseLeave={() =>
                        setHoveredRecord(null)
                      }
                      onClick={() => {
                        setSelectedRecord(point.record);
                        onSelectRecord(point.record);
                      }}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Belum ada data dengan label prediksi model
                dan fitur yang cukup untuk ditampilkan.
              </div>
            )}
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                Normal
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Anomali moderat
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                Anomali ekstrem
              </span>
            </div>

            <span className="text-[10px] text-slate-400">
              {chartData.length} titik ditampilkan
              dari {statistics.classified} WO berlabel
            </span>
          </div>

          {/* HOVER DETAIL */}
          {hoveredRecord && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">
                  WO #{hoveredRecord.OFFERNUM}
                </span>

                <span className="text-[10px] font-semibold text-blue-700">
                  {hoveredRecord.networkType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 md:grid-cols-4">
                <div>
                  <p className="text-slate-400">Durasi</p>
                  <strong>
                    {formatNumber(
                      Number(hoveredRecord.recordingWindowMinutes),
                      2
                    )} menit
                  </strong>
                </div>

                <div>
                  <p className="text-slate-400">Batch</p>
                  <strong>
                    {hoveredRecord.batchReportWindowCount} WO
                  </strong>
                </div>

                <div>
                  <p className="text-slate-400">Volume teknisi</p>
                  <strong>
                    {hoveredRecord.techDailyJobCount} WO
                  </strong>
                </div>

                <div>
                  <p className="text-slate-400">Skor AI</p>
                  <strong>
                    {getScore(hoveredRecord) === null
                      ? '-'
                      : formatNumber(
                          getScore(hoveredRecord)!,
                          4
                        )}
                  </strong>
                </div>
              </div>

              <div className="mt-2 border-t border-blue-200 pt-2 text-[11px]">
                <strong>Status model: </strong>
                {getModelAnomalyStatus(hoveredRecord)
                  ? 'Kandidat anomali'
                  : 'Normal'}
              </div>
            </div>
          )}
        </div>

        {/* TREE DIAGRAM */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <IsolationTreeDiagram />
        </div>

        {/* METHODOLOGY */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-600" />

            <h3 className="text-sm font-bold text-slate-900">
              Mekanisme Identifikasi Anomali
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                01
              </span>

              <h4 className="text-xs font-bold text-slate-800">
                Pemilihan Fitur
              </h4>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Model menggunakan metrik operasional dan
                interval waktu untuk merepresentasikan
                karakteristik Work Order.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                02
              </span>

              <h4 className="text-xs font-bold text-slate-800">
                Pembentukan Isolation Trees
              </h4>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Sejumlah pohon membagi observasi berdasarkan
                pemilihan fitur dan nilai pemisah secara acak
                hingga data terisolasi atau batas kedalaman
                tercapai.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                03
              </span>

              <h4 className="text-xs font-bold text-slate-800">
                Penentuan Indikasi
              </h4>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Kedalaman lintasan isolasi digunakan untuk
                menghasilkan skor. Prediksi model menentukan
                apakah observasi menjadi kandidat anomali.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

              <p className="text-xs leading-relaxed text-amber-900">
                Hasil Isolation Forest merupakan indikasi
                statistik berdasarkan pola data. Anomali
                tidak otomatis menunjukkan pelanggaran SOP,
                kesalahan teknisi, atau tindakan kecurangan.
                Setiap hasil perlu diverifikasi melalui
                pemeriksaan operasional.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default IsolationForestDecisionSpace;
