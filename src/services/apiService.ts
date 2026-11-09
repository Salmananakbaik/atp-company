/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Backend Python FastAPI Bridge & Diagnostic Service
 * PT. ANUGERAH TERANG PERSADA
 */

import {
  PreprocessedWorkOrder,
  IsolationForestModelConfig,
  BackendStatus,
} from '../types/telco';

const DEFAULT_API_BASE = 'http://localhost:8000';

export interface MLPredictionResult {
  engineUsed: 'FASTAPI_SCIKIT_LEARN' | 'CLIENT_SIDE_SIMULATION';
  isDemoSimulation: boolean;

  predictions: Record<string, {
    score: number;
    isAnomaly: boolean;

    // Backend belum menghasilkan treePathLength aktual.
    treePathLength?: number;

    decisionScore?: number;

    // Tingkat anomali dari backend.
    anomalyLevel?: 'NORMAL' | 'MODERATE' | 'EXTREME';

    deviatingFeatures?: Array<{
      featureName: string;
      featureLabel: string;
      observedValue: string | number;
      benchmarkMedian: string | number;
      benchmarkRange: string;
      deviationRatio: string;
      interpretation: string;
    }>;
  }>;

  summary: {
    totalEvaluated: number;
    anomaliesDetected: number;
    contaminationRate: number;
    modelVersion: string;
    trainedAt: string;
    executionTimeMs: number;

    // Informasi tambahan backend.
    ftthSampleCount?: number;
    hfcSampleCount?: number;
    normalCount?: number;
    modelStrategy?: string;
    featuresUsed?: string[];
    featuresExcluded?: string[];
    missingValuesImputed?: Record<string, number>;
    trainingMode?: string;
    evaluationNote?: string;
  };
}

class BackendApiService {
  private baseEndpoint: string = DEFAULT_API_BASE;
  private currentStatus: BackendStatus = {
    isConnected: false,
    isChecking: false,
    endpointUrl: DEFAULT_API_BASE,
    lastChecked: null,
    serverEngine: 'CLIENT_SIDE_SIMULATION',
    errorMessage: 'Backend FastAPI belum terhubung (Berjalan dalam Mode DEMO / Simulasi Klien)',
  };

  public getStatus(): BackendStatus {
    return { ...this.currentStatus };
  }

  public setEndpoint(url: string) {
    this.baseEndpoint = url.trim().replace(/\/$/, '');
    this.currentStatus.endpointUrl = this.baseEndpoint;
  }

  /**
   * Pings the Python FastAPI backend to verify connectivity
   */
  public async checkHealth(): Promise<BackendStatus> {
    this.currentStatus.isChecking = true;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const res = await fetch(`${this.baseEndpoint}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const latency = Date.now() - startTime;
        this.currentStatus = {
          isConnected: true,
          isChecking: false,
          endpointUrl: this.baseEndpoint,
          lastChecked: new Date().toLocaleTimeString('id-ID'),
          serverEngine: 'FASTAPI_SCIKIT_LEARN',
          latencyMs: latency,
          errorMessage: undefined,
        };
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      this.currentStatus = {
        isConnected: false,
        isChecking: false,
        endpointUrl: this.baseEndpoint,
        lastChecked: new Date().toLocaleTimeString('id-ID'),
        serverEngine: 'CLIENT_SIDE_SIMULATION',
        latencyMs: undefined,
        errorMessage: 'Backend FastAPI (Python) offline / belum dijalankan. Sistem menggunakan mode DEMO lokal.',
      };
    }

    return { ...this.currentStatus };
  }

  /**
   * Runs anomaly detection via Python FastAPI backend if available,
   * otherwise notifies that client simulation mode is active.
   */
  public async predictIsolationForest(
    records: PreprocessedWorkOrder[],
    config: IsolationForestModelConfig
  ): Promise<MLPredictionResult | null> {
    if (!this.currentStatus.isConnected) {
      // Return null so the caller uses local client simulation with DEMO label
      return null;
    }

    try {
      const payload = {
  records: records.map(r => ({
    OFFERNUM: r.OFFERNUM,
    networkType: r.networkType,
    start: r.start,
    finish: r.finish,
    recordingWindowMinutes: r.recordingWindowMinutes,
    schToStartHours: r.schToStartHours,
    techDailyJobCount: r.techDailyJobCount,
    reportToCloseMinutes: r.reportToCloseMinutes,
  })),
  config: {
    n_estimators: config.n_estimators,
    contamination: config.contamination,
    max_samples: config.max_samples,
    max_features: config.max_features,
    random_state: config.random_state,
    min_sample_size_for_cohort:
      config.minSampleSizeForSeparateModels,
  },
};

      const res = await fetch(`${this.baseEndpoint}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const json = await res.json();
      const predictionsMap: MLPredictionResult['predictions'] = {};

     for (const item of json.predictions) {
  predictionsMap[item.offernum] = {
    score: item.anomaly_score,
    isAnomaly: item.prediction === -1,
    decisionScore: item.decision_score,

    anomalyLevel: item.anomaly_level,

    deviatingFeatures: (item.deviating_features || []).map((df: any) => ({
      featureName: df.feature_name,
      featureLabel: df.feature_label,
      observedValue: df.observed_value,
      benchmarkMedian: df.benchmark_median,
      benchmarkRange: df.benchmark_range,
      deviationRatio: df.deviation_ratio,
      interpretation: df.interpretation,
    })),
  };
}

            return {
        engineUsed: 'FASTAPI_SCIKIT_LEARN',
        isDemoSimulation: false,
        predictions: predictionsMap,
        summary: {
          totalEvaluated: json.total_evaluated,
          anomaliesDetected: json.anomalies_detected,
          contaminationRate: json.summary.contamination_rate,
          modelVersion: json.summary.model_version,
          trainedAt: json.summary.trained_at,
          executionTimeMs: json.execution_time_ms,

          ftthSampleCount: json.summary.ftth_sample_count,
          hfcSampleCount: json.summary.hfc_sample_count,
          normalCount: json.summary.normal_count,
          modelStrategy: json.summary.model_strategy,
          featuresUsed: json.summary.features_used,
          featuresExcluded: json.summary.features_excluded,
          missingValuesImputed: json.summary.missing_values_imputed,
          trainingMode: json.summary.training_mode,
          evaluationNote: json.summary.evaluation_note,
        },
      };
    } catch (e) {
      console.warn('FastAPI call failed, reverting to client simulation:', e);
      return null;
    }
  }
}

export const apiService = new BackendApiService();
