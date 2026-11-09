
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ISOLATION FOREST - WORK ORDER ANOMALY DETECTION
 * PT. ANUGERAH TERANG PERSADA
 *
 * Reference:
 * Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008).
 * Isolation Forest. IEEE International Conference on Data Mining.
 */

import {
  PreprocessedWorkOrder,
  IsolationForestStats,
  DeviatingFeature,
  AnomalySeverity,
} from '../types/telco';

// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_NUM_TREES = 100;
const DEFAULT_SUBSAMPLE_SIZE = 256;
const MIN_CONTAMINATION = 0.01;
const MAX_CONTAMINATION = 0.25;
const RANDOM_SEED = 20261109;

// ============================================================
// FEATURE DEFINITIONS
// ============================================================

export const ML_FEATURE_NAMES = [
  'Durasi Pencatatan (START-FINISH)',
  'Jarak Jadwal ke Laporan (Jam)',
  'Jarak Laporan ke Tutup (Menit)',
  'Jarak Laporan ke Update (Menit)',
  'Volume Tiket Harian Teknisi',
  'Kerapatan Pelaporan Batch',
  'Jam Pelaporan (0-23)',
];

// ============================================================
// RANDOM GENERATOR
// ============================================================

function createRandomGenerator(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;

    let value = state;

    value = Math.imul(
      value ^ (value >>> 15),
      value | 1
    );

    value ^= value + Math.imul(
      value ^ (value >>> 7),
      value | 61
    );

    return (
      ((value ^ (value >>> 14)) >>> 0) /
      4294967296
    );
  };
}

// ============================================================
// STATISTICAL HELPERS
// ============================================================

function averagePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;

  const eulerMascheroni = 0.5772156649;

  return (
    2 * (Math.log(n - 1) + eulerMascheroni) -
    (2 * (n - 1)) / n
  );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[middle];
  }

  return (
    sorted[middle - 1] +
    sorted[middle]
  ) / 2;
}

function percentile(
  values: number[],
  percentage: number
): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);

  const position = Math.max(
    0,
    Math.min(
      sorted.length - 1,
      Math.ceil(percentage * sorted.length) - 1
    )
  );

  return sorted[position];
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(minimum, Math.min(maximum, value));
}

// ============================================================
// FEATURE EXTRACTION
// ============================================================

type FeatureValue = number | null;

type FeatureMatrix = FeatureValue[][];

function extractFeatureVector(
  record: PreprocessedWorkOrder
): FeatureValue[] {
  const duration = record.recordingWindowMinutes;
  const scheduleReport = record.schToReportHours;
  const reportClose = record.reportToCloseMinutes;
  const reportUpdate = record.reportToUpdateMinutes;

  const technicianVolume =
    record.installer?.trim()
      ? record.techDailyJobCount
      : null;

  const batchDensity =
    record.reportBy?.trim()
      ? record.batchReportWindowCount
      : null;

  const reportingHour = record.reportHour;

  return [
    duration !== null && Number.isFinite(duration)
      ? clamp(duration, 0, 720)
      : null,

    scheduleReport !== null && Number.isFinite(scheduleReport)
      ? clamp(scheduleReport, 0, 168)
      : null,

    reportClose !== null && Number.isFinite(reportClose)
      ? clamp(reportClose, 0, 10080)
      : null,

    reportUpdate !== null && Number.isFinite(reportUpdate)
      ? clamp(reportUpdate, 0, 10080)
      : null,

    technicianVolume !== null &&
    Number.isFinite(technicianVolume)
      ? clamp(technicianVolume, 1, 50)
      : null,

    batchDensity !== null &&
    Number.isFinite(batchDensity)
      ? clamp(batchDensity, 1, 50)
      : null,

    reportingHour !== null &&
    Number.isFinite(reportingHour)
      ? clamp(reportingHour, 0, 23)
      : null,
  ];
}

// ============================================================
// MISSING VALUE HANDLING
// ============================================================

function imputeMissingValues(
  matrix: FeatureMatrix
): {
  matrix: number[][];
  medians: number[];
} {
  const featureCount = ML_FEATURE_NAMES.length;
  const medians: number[] = [];

  for (let feature = 0; feature < featureCount; feature++) {
    const availableValues = matrix
      .map(row => row[feature])
      .filter(
        (value): value is number =>
          value !== null && Number.isFinite(value)
      );

    medians.push(median(availableValues));
  }

  const completedMatrix = matrix.map(row =>
    row.map((value, feature) => {
      if (
        value === null ||
        !Number.isFinite(value)
      ) {
        return medians[feature];
      }

      return value;
    })
  );

  return {
    matrix: completedMatrix,
    medians,
  };
}

// ============================================================
// ISOLATION TREE
// ============================================================

interface ITreeNode {
  isLeaf: boolean;
  size: number;
  splitFeature?: number;
  splitValue?: number;
  left?: ITreeNode;
  right?: ITreeNode;
}

class IsolationTree {
  root: ITreeNode;

  private random: () => number;

  constructor(
    data: number[][],
    maxHeight: number,
    random: () => number
  ) {
    this.random = random;
    this.root = this.buildTree(data, 0, maxHeight);
  }

  private buildTree(
    data: number[][],
    height: number,
    maxHeight: number
  ): ITreeNode {
    const size = data.length;

    if (size <= 1 || height >= maxHeight) {
      return {
        isLeaf: true,
        size,
      };
    }

    const featureCount = data[0]?.length ?? 0;

    if (featureCount === 0) {
      return {
        isLeaf: true,
        size,
      };
    }

    const availableFeatures: number[] = [];

    for (
      let feature = 0;
      feature < featureCount;
      feature++
    ) {
      const values = data.map(row => row[feature]);

      const minimum = Math.min(...values);
      const maximum = Math.max(...values);

      if (minimum < maximum) {
        availableFeatures.push(feature);
      }
    }

    if (availableFeatures.length === 0) {
      return {
        isLeaf: true,
        size,
      };
    }

    const selectedIndex = Math.floor(
      this.random() * availableFeatures.length
    );

    const featureIndex = availableFeatures[selectedIndex];

    const featureValues = data.map(
      row => row[featureIndex]
    );

    const minimum = Math.min(...featureValues);
    const maximum = Math.max(...featureValues);

    const splitValue =
      minimum + this.random() * (maximum - minimum);

    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (const row of data) {
      if (row[featureIndex] < splitValue) {
        leftData.push(row);
      } else {
        rightData.push(row);
      }
    }

    if (
      leftData.length === 0 ||
      rightData.length === 0
    ) {
      return {
        isLeaf: true,
        size,
      };
    }

    return {
      isLeaf: false,
      size,
      splitFeature: featureIndex,
      splitValue,

      left: this.buildTree(
        leftData,
        height + 1,
        maxHeight
      ),

      right: this.buildTree(
        rightData,
        height + 1,
        maxHeight
      ),
    };
  }

  pathLength(point: number[]): number {
    let current = this.root;
    let depth = 0;

    while (!current.isLeaf) {
      if (
        current.splitFeature === undefined ||
        current.splitValue === undefined
      ) {
        break;
      }

      depth++;

      if (point[current.splitFeature] < current.splitValue) {
        if (!current.left) break;
        current = current.left;
      } else {
        if (!current.right) break;
        current = current.right;
      }
    }

    return depth + averagePathLength(current.size);
  }
}

// ============================================================
// ISOLATION FOREST MODEL
// ============================================================

class IsolationForestModel {
  private trees: IsolationTree[] = [];
  private subsampleSize: number;
  private normalizationFactor: number;

  constructor(
    data: number[][],
    numTrees = DEFAULT_NUM_TREES,
    requestedSubsampleSize = DEFAULT_SUBSAMPLE_SIZE,
    seed = RANDOM_SEED
  ) {
    this.subsampleSize = Math.max(
      1,
      Math.min(requestedSubsampleSize, data.length)
    );

    this.normalizationFactor =
      averagePathLength(this.subsampleSize);

    const random = createRandomGenerator(seed);

    const maxHeight = Math.ceil(
      Math.log2(this.subsampleSize)
    );

    for (let index = 0; index < numTrees; index++) {
      const sample = this.getSubsample(
        data,
        this.subsampleSize,
        random
      );

      this.trees.push(
        new IsolationTree(
          sample,
          maxHeight,
          random
        )
      );
    }
  }

  private getSubsample(
    data: number[][],
    size: number,
    random: () => number
  ): number[][] {
    const indices = Array.from(
      { length: data.length },
      (_, index) => index
    );

    for (let index = 0; index < size; index++) {
      const randomIndex =
        index +
        Math.floor(
          random() * (indices.length - index)
        );

      [
        indices[index],
        indices[randomIndex],
      ] = [
        indices[randomIndex],
        indices[index],
      ];
    }

    return indices
      .slice(0, size)
      .map(index => data[index]);
  }

  predictScore(
    point: number[]
  ): {
    score: number;
    averagePath: number;
  } {
    if (
      this.trees.length === 0 ||
      this.normalizationFactor <= 0
    ) {
      return {
        score: 0.5,
        averagePath: 0,
      };
    }

    let totalPath = 0;

    for (const tree of this.trees) {
      totalPath += tree.pathLength(point);
    }

    const averagePath =
      totalPath / this.trees.length;

    const score = Math.pow(
      2,
      -averagePath / this.normalizationFactor
    );

    return {
      score: Number.isFinite(score) ? score : 0.5,
      averagePath,
    };
  }
}

// ============================================================
// FEATURE BENCHMARKS
// ============================================================

interface FeatureBenchmarks {
  medians: number[];
  q25s: number[];
  q75s: number[];
}

function computeFeatureBenchmarks(
  matrix: number[][]
): FeatureBenchmarks {
  const featureCount = matrix[0]?.length ?? 0;

  const medians: number[] = [];
  const q25s: number[] = [];
  const q75s: number[] = [];

  for (
    let feature = 0;
    feature < featureCount;
    feature++
  ) {
    const values = matrix.map(row => row[feature]);

    medians.push(median(values));
    q25s.push(percentile(values, 0.25));
    q75s.push(percentile(values, 0.75));
  }

  return {
    medians,
    q25s,
    q75s,
  };
}

// ============================================================
// DEVIATION ANALYSIS
// ============================================================

function createDeviation(
  featureName: string,
  featureLabel: string,
  observedValue: string,
  benchmarkMedian: string,
  benchmarkRange: string,
  deviationRatio: string,
  interpretation: string
): DeviatingFeature {
  return {
    featureName,
    featureLabel,
    observedValue,
    benchmarkMedian,
    benchmarkRange,
    deviationRatio,
    interpretation,
  };
}

function analyzeDeviatingFeatures(
  record: PreprocessedWorkOrder,
  benchmarks: FeatureBenchmarks
): {
  deviations: DeviatingFeature[];
  recommendations: string[];
} {
  const deviations: DeviatingFeature[] = [];
  const recommendations: string[] = [];

  const duration = record.recordingWindowMinutes;

  // Feature 1: Duration
  if (
    duration !== null &&
    duration >= 0
  ) {
    const q25 = benchmarks.q25s[0];
    const q75 = benchmarks.q75s[0];
    const med = benchmarks.medians[0];

    if (
      duration < q25 ||
      duration > q75
    ) {
      deviations.push(
        createDeviation(
          'recordingWindowMinutes',
          'Durasi Pencatatan',
          `${duration} menit`,
          `${Math.round(med)} menit`,
          `${Math.round(q25)} - ${Math.round(q75)} menit`,
          duration < med
            ? 'Di bawah median'
            : 'Di atas median',
          'Durasi berada di luar rentang kuartil dataset.'
        )
      );

      recommendations.push(
        'Periksa kesesuaian durasi dengan jenis pekerjaan dan bukti penyelesaian.'
      );
    }
  }

  // Feature 2: Schedule to report
  const scheduleReport = record.schToReportHours;

  if (
    scheduleReport !== null &&
    scheduleReport >= 0
  ) {
    const q25 = benchmarks.q25s[1];
    const q75 = benchmarks.q75s[1];

    if (
      scheduleReport < q25 ||
      scheduleReport > q75
    ) {
      deviations.push(
        createDeviation(
          'schToReportHours',
          'Jarak Jadwal ke Laporan',
          `${scheduleReport} jam`,
          `${benchmarks.medians[1].toFixed(1)} jam`,
          `${q25.toFixed(1)} - ${q75.toFixed(1)} jam`,
          'Di luar rentang kuartil',
          'Jarak jadwal dan pelaporan berbeda dari mayoritas dataset.'
        )
      );
    }
  }

  // Feature 3: Report to close
  const reportClose = record.reportToCloseMinutes;

  if (
    reportClose !== null &&
    reportClose >= 0
  ) {
    const q25 = benchmarks.q25s[2];
    const q75 = benchmarks.q75s[2];

    if (
      reportClose < q25 ||
      reportClose > q75
    ) {
      deviations.push(
        createDeviation(
          'reportToCloseMinutes',
          'Jarak Laporan ke Penutupan',
          `${reportClose} menit`,
          `${Math.round(benchmarks.medians[2])} menit`,
          `${Math.round(q25)} - ${Math.round(q75)} menit`,
          'Di luar rentang kuartil',
          'Jarak waktu pelaporan dan penutupan berbeda dari pola mayoritas.'
        )
      );
    }
  }

  // Feature 4: Report to update
  const reportUpdate = record.reportToUpdateMinutes;

  if (
    reportUpdate !== null &&
    reportUpdate >= 0
  ) {
    const q25 = benchmarks.q25s[3];
    const q75 = benchmarks.q75s[3];

    if (
      reportUpdate < q25 ||
      reportUpdate > q75
    ) {
      deviations.push(
        createDeviation(
          'reportToUpdateMinutes',
          'Jarak Laporan ke Update',
          `${reportUpdate} menit`,
          `${Math.round(benchmarks.medians[3])} menit`,
          `${Math.round(q25)} - ${Math.round(q75)} menit`,
          'Di luar rentang kuartil',
          'Interval pembaruan data berbeda dari pola mayoritas.'
        )
      );
    }
  }

  // Feature 5: Technician volume
  if (record.installer) {
    const volume = record.techDailyJobCount;
    const q25 = benchmarks.q25s[4];
    const q75 = benchmarks.q75s[4];

    if (
      volume < q25 ||
      volume > q75
    ) {
      deviations.push(
        createDeviation(
          'techDailyJobCount',
          'Volume Pekerjaan Harian Teknisi',
          `${volume} WO`,
          `${benchmarks.medians[4].toFixed(1)} WO`,
          `${q25} - ${q75} WO`,
          'Di luar rentang kuartil',
          'Volume pekerjaan teknisi berbeda dari pola mayoritas dataset.'
        )
      );

      recommendations.push(
        'Tinjau pembagian beban pekerjaan teknisi.'
      );
    }
  }

  // Feature 6: Batch reporting
  if (record.reportBy) {
    const batch = record.batchReportWindowCount;
    const q25 = benchmarks.q25s[5];
    const q75 = benchmarks.q75s[5];

    if (
      batch < q25 ||
      batch > q75
    ) {
      deviations.push(
        createDeviation(
          'batchReportWindowCount',
          'Kerapatan Pelaporan Batch',
          `${batch} WO`,
          `${benchmarks.medians[5].toFixed(1)} WO`,
          `${q25} - ${q75} WO`,
          'Di luar rentang kuartil',
          'Jumlah WO dalam jendela waktu berdekatan berbeda dari mayoritas.'
        )
      );

      recommendations.push(
        'Tinjau pola waktu pelaporan Work Order.'
      );
    }
  }

  // Feature 7: Reporting hour
  if (record.reportHour !== null) {
    const hour = record.reportHour;
    const q25 = benchmarks.q25s[6];
    const q75 = benchmarks.q75s[6];

    if (
      hour < q25 ||
      hour > q75
    ) {
      deviations.push(
        createDeviation(
          'reportHour',
          'Jam Pelaporan',
          `${String(hour).padStart(2, '0')}:00`,
          `${benchmarks.medians[6].toFixed(1)}`,
          `${q25.toFixed(1)} - ${q75.toFixed(1)}`,
          'Di luar rentang kuartil',
          'Jam pelaporan berbeda dari distribusi waktu pelaporan dataset.'
        )
      );
    }
  }

  return {
    deviations,
    recommendations,
  };
}

// ============================================================
// EMPTY STATISTICS
// ============================================================

function createEmptyStats(): IsolationForestStats {
  return {
    modelType: 'UNIFIED_GLOBAL',
    ftthModelTrained: false,
    ftthSampleCount: 0,
    hfcModelTrained: false,
    hfcSampleCount: 0,
    featureNames: ML_FEATURE_NAMES,
    totalEvaluated: 0,
    anomaliesDetected: 0,
    contaminationRate: 0,
  };
}

// ============================================================
// MAIN ISOLATION FOREST FUNCTION
// ============================================================

export function runIsolationForestAnomalyDetection(
  records: PreprocessedWorkOrder[],
  minSampleSizeForSeparate: number = 30,
  contaminationRate: number = 0.10
): {
  data: PreprocessedWorkOrder[];
  stats: IsolationForestStats;
} {
  if (records.length === 0) {
    return {
      data: [],
      stats: createEmptyStats(),
    };
  }

  // Validate contamination
  const safeContamination = clamp(
    contaminationRate,
    MIN_CONTAMINATION,
    MAX_CONTAMINATION
  );

  // Feature extraction
  const rawMatrix = records.map(extractFeatureVector);

  const {
    matrix: allMatrix,
  } = imputeMissingValues(rawMatrix);

  const globalBenchmarks =
    computeFeatureBenchmarks(allMatrix);

  // Network segmentation
  const ftthIndices: number[] = [];
  const hfcIndices: number[] = [];

  records.forEach((record, index) => {
    if (record.networkType === 'FTTH') {
      ftthIndices.push(index);
    } else if (record.networkType === 'HFC') {
      hfcIndices.push(index);
    }
  });

  const canTrainSeparate =
    ftthIndices.length >= minSampleSizeForSeparate &&
    hfcIndices.length >= minSampleSizeForSeparate;

  let warningMessage: string | undefined;

  if (records.length < 20) {
    warningMessage =
      `Jumlah sampel terbatas (n=${records.length}). ` +
      'Hasil model bersifat eksploratif dan perlu validasi tambahan.';
  } else if (!canTrainSeparate) {
    warningMessage =
      'Model FTTH dan HFC terpisah tidak digunakan karena jumlah sampel ' +
      'belum mencukupi. Sistem menggunakan model global.';
  }

  // Train global model
  const globalModel = new IsolationForestModel(
    allMatrix,
    DEFAULT_NUM_TREES,
    Math.min(DEFAULT_SUBSAMPLE_SIZE, allMatrix.length),
    RANDOM_SEED
  );

  let ftthModel: IsolationForestModel | null = null;
  let hfcModel: IsolationForestModel | null = null;

  let ftthBenchmarks = globalBenchmarks;
  let hfcBenchmarks = globalBenchmarks;

  if (canTrainSeparate) {
    const ftthMatrix = ftthIndices.map(
      index => allMatrix[index]
    );

    const hfcMatrix = hfcIndices.map(
      index => allMatrix[index]
    );

    ftthModel = new IsolationForestModel(
      ftthMatrix,
      DEFAULT_NUM_TREES,
      Math.min(DEFAULT_SUBSAMPLE_SIZE, ftthMatrix.length),
      RANDOM_SEED + 1
    );

    hfcModel = new IsolationForestModel(
      hfcMatrix,
      DEFAULT_NUM_TREES,
      Math.min(DEFAULT_SUBSAMPLE_SIZE, hfcMatrix.length),
      RANDOM_SEED + 2
    );

    ftthBenchmarks =
      computeFeatureBenchmarks(ftthMatrix);

    hfcBenchmarks =
      computeFeatureBenchmarks(hfcMatrix);
  }

  // Generate prediction scores
  const predictions = records.map((record, index) => {
    let model = globalModel;
    let benchmarks = globalBenchmarks;

    if (
      canTrainSeparate &&
      record.networkType === 'FTTH' &&
      ftthModel
    ) {
      model = ftthModel;
      benchmarks = ftthBenchmarks;
    } else if (
      canTrainSeparate &&
      record.networkType === 'HFC' &&
      hfcModel
    ) {
      model = hfcModel;
      benchmarks = hfcBenchmarks;
    }

    const prediction = model.predictScore(
      allMatrix[index]
    );

    return {
      record,
      score: prediction.score,
      averagePath: prediction.averagePath,
      benchmarks,
    };
  });

  // Calibrate threshold by cohort
  const scoreGroups = new Map<string, number[]>();

  predictions.forEach(prediction => {
    const cohort = canTrainSeparate
      ? prediction.record.networkType
      : 'GLOBAL';

    if (!scoreGroups.has(cohort)) {
      scoreGroups.set(cohort, []);
    }

    scoreGroups.get(cohort)!.push(prediction.score);
  });

  const thresholds = new Map<string, number>();

  scoreGroups.forEach((scores, cohort) => {
    thresholds.set(
      cohort,
      percentile(
        scores,
        1 - safeContamination
      )
    );
  });

  // Classify records
  let anomaliesDetectedCount = 0;

  const evaluatedRecords = predictions.map(prediction => {
    const record = prediction.record;

    const cohort = canTrainSeparate
      ? record.networkType
      : 'GLOBAL';

    const threshold = thresholds.get(cohort) ?? 1;

    const isMlAnomaly =
      prediction.score >= threshold;

    if (isMlAnomaly) {
      anomaliesDetectedCount++;
    }

    const roundedScore =
      Math.round(prediction.score * 1000) / 1000;

    const {
      deviations,
      recommendations,
    } = analyzeDeviatingFeatures(
      record,
      prediction.benchmarks
    );

    const hasRuleViolations =
      (record.ruleViolations?.length ?? 0) > 0;

    let checkType:
      | 'RULE_BASED'
      | 'MACHINE_LEARNING'
      | 'HYBRID' = 'RULE_BASED';

    if (hasRuleViolations && isMlAnomaly) {
      checkType = 'HYBRID';
    } else if (isMlAnomaly) {
      checkType = 'MACHINE_LEARNING';
    }

    // ML alone indicates statistical deviation.
    // It does not overwrite an existing HIGH rule severity.
    let compositeSeverity: AnomalySeverity =
      record.compositeSeverity;

    if (
      isMlAnomaly &&
      compositeSeverity === 'NORMAL'
    ) {
      compositeSeverity = 'MEDIUM';
    }

    let neutralReason =
      record.neutralIndicationReason || '';

    if (isMlAnomaly) {
      const featureNames = deviations
        .map(feature => feature.featureLabel)
        .join(', ');

      const detail = featureNames
        ? ` Fitur yang menyimpang: ${featureNames}.`
        : ' Kombinasi fitur menunjukkan pola berbeda dari kelompok data.';

      neutralReason =
        (neutralReason ? `${neutralReason} ` : '') +
        `Isolation Forest memberikan skor ${roundedScore} ` +
        `(ambang kelompok ${threshold.toFixed(3)}).` +
        detail +
        ' Hasil ini merupakan indikasi statistik dan memerlukan verifikasi.';
    }

    return {
      ...record,

      mlScore: roundedScore,

      isMlAnomaly,

      mlTreePathLength:
        Math.round(prediction.averagePath * 10) / 10,

      checkType,

      compositeSeverity,

      deviatingFeatures: [
        ...(record.deviatingFeatures || []),
        ...deviations,
      ],

      verificationRecommendations: Array.from(
        new Set([
          ...(record.verificationRecommendations || []),
          ...recommendations,
        ])
      ),

      neutralIndicationReason: neutralReason,
    };
  });

  // Statistics
  const actualAnomalyPercentage =
    evaluatedRecords.length > 0
      ? (
          anomaliesDetectedCount /
          evaluatedRecords.length
        ) * 100
      : 0;

  return {
    data: evaluatedRecords,

    stats: {
      modelType: canTrainSeparate
        ? 'SEPARATE_FTTH_HFC'
        : 'UNIFIED_GLOBAL',

      ftthModelTrained: canTrainSeparate,
      ftthSampleCount: ftthIndices.length,

      hfcModelTrained: canTrainSeparate,
      hfcSampleCount: hfcIndices.length,

      warningMessage,

      featureNames: ML_FEATURE_NAMES,

      totalEvaluated: records.length,

      anomaliesDetected: anomaliesDetectedCount,

      contaminationRate:
        Math.round(actualAnomalyPercentage * 10) / 10,
    },
  };
}
