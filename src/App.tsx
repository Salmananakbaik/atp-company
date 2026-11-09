
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FTTH & HFC SMART OPERATIONAL INTELLIGENCE SYSTEM
 * PT. ANUGERAH TERANG PERSADA
 *
 * Main application controller.
 * Data operasional bersumber dari dataset yang diimpor pengguna.
 */
import {
  getSignedInAtpUser,
  signOutAtpUser,
} from './services/authService';
import React, { useEffect, useMemo, useState } from 'react';

// ============================================================
// 1. LAYOUT
// ============================================================

import { NocSidebar } from './components/NocSidebar';
import { NocTopbar } from './components/NocTopbar';

// ============================================================
// 2. DASHBOARD AND WORK ORDER
// ============================================================

import { NocDashboard } from './components/NocDashboard';
import { DatasetToolbar } from './components/DatasetToolbar';
import { AnomalyTable } from './components/AnomalyTable';
import { AnomalyDrawer } from './components/AnomalyDrawer';

// ============================================================
// 3. OPERATIONAL MODULES
// ============================================================

import { GisDashboard } from './components/GisDashboard';
import { TechnicianPortal } from './components/TechnicianPortal';
import { TechnicianMonitoringView } from './components/TechnicianMonitoringView';
import { TechCollisionGantt } from './components/TechCollisionGantt';

// ============================================================
// 4. ANALYSIS AND REPORTING
// ============================================================

import { ReportingView } from './components/ReportingView';
import { IsolationForestChart } from './components/IsolationForestChart';
import { RulesSummaryView } from './components/RulesSummaryView';
import { SupervisorReviewView } from './components/SupervisorReviewView';

// ============================================================
// 5. MASTER DATA AND SETTINGS
// ============================================================

import { MasterDataView } from './components/MasterDataView';
import { UserManagementView } from './components/UserManagementView';
import { SettingsView } from './components/SettingsView';

// ============================================================
// 6. AUTHENTICATION AND MODALS
// ============================================================

import { AuthModal } from './components/AuthModal';
import Home from './pages/Home';
import { SupervisorReviewModal } from './components/SupervisorReviewModal';
import { ModelExperimentModal } from './components/ModelExperimentModal';
import { ColumnMappingModal } from './components/ColumnMappingModal';
import { NetworkClassificationModal } from './components/NetworkClassificationModal';
import { RuleConfigModal } from './components/RuleConfigModal';

// ============================================================
// 7. UTILITIES
// ============================================================

import {
  autoMapColumns,
  validateOfferNumUniqueness,
} from './utils/columnMapper';

import { preprocessWorkOrders } from './utils/preprocessing';

import {
  evaluateRuleBasedValidation,
  DEFAULT_SOP_CONFIG,
} from './utils/ruleEngine';

import {
  runIsolationForestAnomalyDetection,
} from './utils/isolationForest';

import { exportAuditReportToExcel } from './utils/excelExporter';

// ============================================================
// 8. BACKEND
// ============================================================

import { apiService } from './services/apiService';
import { supabase } from './lib/supabase';

// ============================================================
// 9. TYPES
// ============================================================

import {
  CanonicalWorkOrder,
  PreprocessedWorkOrder,
  NetworkMappingRule,
  SOPRuleConfig,
  UserAccount,
  TechnicianLocation,
  SupervisorVerificationStatus,
  IsolationForestModelConfig,
  ModelMetadata,
  AuditLogEntry,
  BackendStatus,
  PreprocessingStats,
  IsolationForestStats,
} from './types/telco';

// ============================================================
// 10. MODEL CONFIGURATION
// ============================================================

const INITIAL_MODEL_CONFIG: IsolationForestModelConfig = {
  n_estimators: 200,

  // Asumsi proporsi kandidat anomali: 5%.
  contamination: 0.05,

  max_samples: 256,
  max_features: 6,

  // Seed untuk hasil yang dapat direproduksi.
  random_state: 42,

  minSampleSizeForSeparateModels: 30,

  isFtthSeparate: true,
  isHfcSeparate: true,
};
const DATASET_STORAGE_KEY = 'atp_operational_dataset_v1';

interface SavedDataset {
  datasetName: string;
  rawRecords: Record<string, any>[];
  columnMapping: Record<string, keyof CanonicalWorkOrder | null>;
}

function loadSavedDataset(): SavedDataset | null {
  try {
    const saved = localStorage.getItem(DATASET_STORAGE_KEY);

    if (!saved) return null;

    return JSON.parse(saved) as SavedDataset;
  } catch (error) {
    console.error('Gagal memuat dataset:', error);
    return null;
  }
}

// ============================================================
// 11. PIPELINE RESULT TYPE
// ============================================================

interface PipelineResult {
  records: PreprocessedWorkOrder[];
  preprocStats: PreprocessingStats;
  mlStats: IsolationForestStats;
}

// ============================================================
// 12. PIPELINE PROCESSOR
// ============================================================

/**
 * Menjalankan proses:
 *
 * Raw Dataset
 *     |
 * Preprocessing
 *     |
 * Rule-Based Validation
 *     |
 * Isolation Forest
 *     |
 * Evaluated Work Orders
 *
 * Catatan:
 * Fungsi Isolation Forest saat ini menerima tiga parameter:
 * data, minimum sample size, dan contamination rate.
 *
 * Parameter n_estimators, max_samples, max_features,
 * random_state, dan pengaturan model terpisah belum
 * diteruskan oleh fungsi tersebut.
 */

function buildPipeline(
  rawRecords: Record<string, any>[],
  columnMapping: Record<string, keyof CanonicalWorkOrder | null>,
  adminNetworkRules: NetworkMappingRule[],
  sopConfig: SOPRuleConfig,
  modelConfig: IsolationForestModelConfig
): PipelineResult {

  // ----------------------------------------------------------
  // A. PREPROCESSING
  // ----------------------------------------------------------

  const {
    data: preprocessed,
    stats: preprocStats,
  } = preprocessWorkOrders(
    rawRecords,
    columnMapping,
    adminNetworkRules
  );

  // Jika belum ada data, tetap jalankan pipeline dengan array kosong.
  if (preprocessed.length === 0) {
    const {
      data: evaluatedRecords,
      stats: mlStats,
    } = runIsolationForestAnomalyDetection(
      [],
      modelConfig.minSampleSizeForSeparateModels,
      modelConfig.contamination
    );

    return {
      records: evaluatedRecords,
      preprocStats,
      mlStats,
    };
  }

  // ----------------------------------------------------------
  // B. RULE-BASED VALIDATION
  // ----------------------------------------------------------

  const withRules = evaluateRuleBasedValidation(
    preprocessed,
    sopConfig
  );

  // ----------------------------------------------------------
  // C. ISOLATION FOREST
  // ----------------------------------------------------------

  const {
    data: evaluatedRecords,
    stats: mlStats,
  } = runIsolationForestAnomalyDetection(
    withRules,
    modelConfig.minSampleSizeForSeparateModels,
    modelConfig.contamination
  );

  return {
    records: evaluatedRecords,
    preprocStats,
    mlStats,
  };
}

// ============================================================
// 13. APPLICATION
// ============================================================

export default function App() {

 
  // ==========================================================
  // A. AUTHENTICATION
  // ==========================================================

  const [currentUser, setCurrentUser] =
    useState<UserAccount | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] =
    useState<boolean>(false);

  const [isAuthChecking, setIsAuthChecking] =
    useState<boolean>(true);

  // Memeriksa sesi Supabase saat aplikasi pertama dibuka.
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const user = await getSignedInAtpUser();

        if (!isMounted) return;

        setCurrentUser(user);

        if (user?.role === 'TECHNICIAN') {
          setActiveTab('technician_portal');
        } else if (user) {
          setActiveTab('dashboard');
        }
      } catch (error) {
        console.error('Gagal memeriksa sesi Supabase:', error);

        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);


  // ==========================================================
  // B. NAVIGATION
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState<string>('dashboard');

  const [selectedFilter, setSelectedFilter] =
    useState<string>('all');

  const [selectedRecord, setSelectedRecord] =
    useState<PreprocessedWorkOrder | null>(null);
    
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (user.role === 'TECHNICIAN') {
      setActiveTab('technician_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAtpUser();

      setCurrentUser(null);
      setActiveTab('dashboard');
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error('Gagal logout Supabase:', error);
    }
  };


  // ==========================================================
  // C. MODAL STATES
  // ==========================================================

  const [isSupervisorReviewOpen, setIsSupervisorReviewOpen] =
    useState<boolean>(false);

  const [isModelExperimentOpen, setIsModelExperimentOpen] =
    useState<boolean>(false);

  const [isMappingModalOpen, setIsMappingModalOpen] =
    useState<boolean>(false);

  const [isNetworkModalOpen, setIsNetworkModalOpen] =
    useState<boolean>(false);

  const [isRuleConfigModalOpen, setIsRuleConfigModalOpen] =
    useState<boolean>(false);

  // ==========================================================
  // D. DATASET
  // ==========================================================

  // Tidak ada data contoh yang dimuat otomatis.

 const [initialDataset] = useState<SavedDataset | null>(
  () => loadSavedDataset()
);

const [datasetName, setDatasetName] = useState<string>(
  initialDataset?.datasetName ?? 'Belum ada dataset diimpor'
);

const [rawRecords, setRawRecords] = useState<Record<string, any>[]>(
  initialDataset?.rawRecords ?? []
);

const [columnMapping, setColumnMapping] = useState<
  Record<string, keyof CanonicalWorkOrder | null>
>(
  initialDataset?.columnMapping ?? {}
);
useEffect(() => {
  if (rawRecords.length === 0) {
    localStorage.removeItem(DATASET_STORAGE_KEY);
    return;
  }

  try {
    const savedDataset: SavedDataset = {
      datasetName,
      rawRecords,
      columnMapping,
    };

    localStorage.setItem(
      DATASET_STORAGE_KEY,
      JSON.stringify(savedDataset)
    );
  } catch (error) {
    console.error('Gagal menyimpan dataset:', error);
  }
}, [datasetName, rawRecords, columnMapping]);

  // ==========================================================
  // E. NETWORK MAPPING
  // ==========================================================

  const [adminNetworkRules, setAdminNetworkRules] =
    useState<NetworkMappingRule[]>([]);

  // ==========================================================
  // F. TECHNICIAN LOCATION
  // ==========================================================

  // Lokasi teknisi tidak dibuat secara otomatis.

  const [technicians, setTechnicians] =
    useState<TechnicianLocation[]>([]);

  // Muat lokasi teknisi dari Supabase; polling menjaga peta admin tetap terbaru.
  useEffect(() => {
    if (!currentUser) {
      setTechnicians([]);
      return;
    }

    let isMounted = true;

    const loadTechnicianLocations = async () => {
      try {
        let locationQuery = supabase
          .from('technician_locations')
          .select('technician_id, latitude, longitude, accuracy, is_sharing_active, updated_at');

        if (currentUser.role === 'TECHNICIAN') {
          locationQuery = locationQuery.eq('technician_id', currentUser.id);
        }

        const { data: locationRows, error: locationError } = await locationQuery;
        if (locationError) throw locationError;
        if (!isMounted) return;

        const ids = (locationRows ?? []).map(row => row.technician_id);
        if (ids.length === 0) {
          setTechnicians([]);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, branch')
          .in('id', ids);

        if (profilesError) throw profilesError;
        if (!isMounted) return;

        const profileById = new Map(
          (profiles ?? []).map(profile => [profile.id, profile])
        );

        const mappedLocations: TechnicianLocation[] = (locationRows ?? [])
          .filter(row =>
            typeof row.latitude === 'number' &&
            typeof row.longitude === 'number'
          )
          .map(row => {
            const profile = profileById.get(row.technician_id);
            const timestamp = row.updated_at ?? new Date().toISOString();
            const ageMs = Date.now() - new Date(timestamp).getTime();

            return {
              technicianId: row.technician_id,
              technicianName: profile?.full_name ?? 'Teknisi',
              latitude: Number(row.latitude),
              longitude: Number(row.longitude),
              accuracy: Number(row.accuracy ?? 0),
              timestamp,
              isSharingActive: Boolean(row.is_sharing_active),
              assignedBranch: profile?.branch ?? '',
              isStale: !Number.isFinite(ageMs) || ageMs > 60000,
            };
          });

        setTechnicians(mappedLocations);
      } catch (error) {
        console.error('Gagal memuat lokasi teknisi dari Supabase:', error);
      }
    };

    void loadTechnicianLocations();
    const intervalId = window.setInterval(
      () => void loadTechnicianLocations(),
      5000
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [currentUser]);

  // ==========================================================
  // G. SUPERVISOR REVIEW
  // ==========================================================

  const [supervisorReviews, setSupervisorReviews] = useState<
    Record<
      string,
      {
        status: SupervisorVerificationStatus;
        notes: string;
        verifiedBy?: string;
        verifiedAt?: string;
      }
    >
  >({});

  // ==========================================================
  // H. AUDIT LOG
  // ==========================================================

  const [auditLogs, setAuditLogs] =
    useState<AuditLogEntry[]>([]);

  // ==========================================================
  // I. BACKEND STATUS
  // ==========================================================

  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>(() => apiService.getStatus());

  useEffect(() => {
    let isMounted = true;

    apiService.checkHealth()
      .then(status => {
        if (isMounted) {
          setBackendStatus(status);
        }
      })
      .catch(error => {
        console.error(
          'Backend health check failed:',
          error
        );

        if (isMounted) {
          setBackendStatus(apiService.getStatus());
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshBackendStatus = async () => {
    try {
      const status = await apiService.checkHealth();

      setBackendStatus(status);
    } catch (error) {
      console.error(
        'Failed to refresh backend status:',
        error
      );

      setBackendStatus(apiService.getStatus());
    }
  };

  // ==========================================================
  // J. MACHINE LEARNING CONFIGURATION
  // ==========================================================

  const [modelConfig, setModelConfig] =
    useState<IsolationForestModelConfig>(
      INITIAL_MODEL_CONFIG
    );

  const [modelHistory, setModelHistory] =
    useState<ModelMetadata[]>([]);

  // ==========================================================
  // K. SOP CONFIGURATION
  // ==========================================================

  const [sopConfig, setSopConfig] =
    useState<SOPRuleConfig>(DEFAULT_SOP_CONFIG);

  // ==========================================================
  // L. DATA PROCESSING PIPELINE
  // ==========================================================

  const pipelineResult = useMemo(() => {
    return buildPipeline(
      rawRecords,
      columnMapping,
      adminNetworkRules,
      sopConfig,
      modelConfig
    );
  }, [
    rawRecords,
    columnMapping,
    adminNetworkRules,
    sopConfig,
    modelConfig,
  ]);

  // ----------------------------------------------------------
  // Apply supervisor reviews without modifying ML results.
  // ----------------------------------------------------------

  const records = useMemo(() => {
    return pipelineResult.records.map(item => {
      const review = supervisorReviews[item.OFFERNUM];

      if (!review) {
        return item;
      }

      return {
        ...item,
        supervisorVerification: review,
      };
    });
  }, [
    pipelineResult.records,
    supervisorReviews,
  ]);

  const {
    preprocStats,
    mlStats,
  } = pipelineResult;

  // ==========================================================
  // M. REVIEW COUNTER
  // ==========================================================

  const unreviewedCount = useMemo(() => {
    return records.filter(record => {
      const status =
        record.supervisorVerification?.status;

      const isAnomaly =
        record.compositeSeverity !== 'NORMAL';

      const isUnreviewed =
        !status ||
        status === 'UNREVIEWED' ||
        status === 'BELUM_DIREVIEW';

      return isAnomaly && isUnreviewed;
    }).length;
  }, [records]);

  // ==========================================================
  // N. WORK ORDER PRIMARY KEY CHECK
  // ==========================================================

  const offerNumStats = useMemo(() => {
    const offerColumn = Object.entries(columnMapping).find(
      ([, canonical]) => canonical === 'OFFERNUM'
    )?.[0];

    if (!offerColumn || rawRecords.length === 0) {
      return validateOfferNumUniqueness(
        [],
        'OFFERNUM'
      );
    }

    return validateOfferNumUniqueness(
      rawRecords,
      offerColumn
    );
  }, [
    rawRecords,
    columnMapping,
  ]);

  // ==========================================================
  // O. RAW HEADERS
  // ==========================================================

  const rawHeaders = useMemo(() => {
    if (rawRecords.length === 0) {
      return [];
    }

    return Object.keys(rawRecords[0]);
  }, [rawRecords]);

  // ==========================================================
  // P. SELECTED RECORD SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    if (!selectedRecord) {
      return;
    }

    const updatedRecord = records.find(
      record => record.id === selectedRecord.id
    );

    if (updatedRecord) {
      setSelectedRecord(updatedRecord);
    } else {
      setSelectedRecord(null);
    }
  }, [
    records,
    selectedRecord?.id,
  ]);

  // ==========================================================
  // Q. IMPORT WORK ORDER DATA
  // ==========================================================

  const handleFileUpload = (
    headers: string[],
    rows: Record<string, any>[],
    filename: string
  ) => {

    if (!Array.isArray(headers) || headers.length === 0) {
      console.error(
        'Import gagal: header tidak ditemukan.'
      );
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      console.error(
        'Import gagal: tidak ada baris data.'
      );
      return;
    }

  // ==========================================================
  // CLEAR ACTIVE DATASET
  // ==========================================================
  // ==========================================================
  // CLEAR ACTIVE DATASET
  // ==========================================================


    // --------------------------------------------------------
    // Remove completely empty rows.
    // --------------------------------------------------------

    const cleanedRows = rows.filter(row =>
      Object.values(row).some(value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      )
    );

    if (cleanedRows.length === 0) {
      console.error(
        'Import gagal: seluruh baris data kosong.'
      );
      return;
    }

    // --------------------------------------------------------
    // Automatic column mapping.
    // --------------------------------------------------------

    const mapping = autoMapColumns(headers);

    // --------------------------------------------------------
    // Update dataset state.
    // --------------------------------------------------------

    setDatasetName(filename);

    setRawRecords(cleanedRows);

    setColumnMapping(mapping);

    // --------------------------------------------------------
    // Reset dataset-specific states.
    // --------------------------------------------------------

    setSelectedFilter('all');

    setSelectedRecord(null);

    setSupervisorReviews({});

    setAuditLogs([]);

    setModelHistory([]);

    setActiveTab('records');

    console.info('Dataset berhasil dimuat:', {
      filename,
      totalRows: cleanedRows.length,
      totalColumns: headers.length,
    });
  };

  // ==========================================================
  // CLEAR ACTIVE DATASET
  // ==========================================================

  const handleClearDataset = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus dataset aktif?'
    );

    if (!confirmed) return;

    setDatasetName('Belum ada dataset diimpor');
    setRawRecords([]);
    setColumnMapping({});

    setSelectedFilter('all');
    setSelectedRecord(null);
    setSupervisorReviews({});
    setAuditLogs([]);
    setModelHistory([]);

    localStorage.removeItem(DATASET_STORAGE_KEY);

    setActiveTab('records');

    console.info('Dataset berhasil dihapus.');
  };

  // ==========================================================
  // R. LEGACY SAMPLE DATA HANDLERS
  // ==========================================================

  // Handler dipertahankan untuk kompatibilitas props
  // DatasetToolbar dan SettingsView.
  // Tidak ada dataset simulasi yang dimuat.

  const handleSelectActual8 = () => {
    console.warn(
      'Dataset contoh dinonaktifkan. Silakan import file WO aktual.'
    );
  };

  const handleSelectSample50 = () => {
    console.warn(
      'Dataset 50 baris dinonaktifkan. Silakan import file WO aktual.'
    );
  };

  const handleSelectHistorical1250 = () => {
    console.warn(
      'Dataset historis simulasi dinonaktifkan. Silakan import file WO aktual.'
    );
  };

  // ==========================================================
  // S. EXPORT REPORT
  // ==========================================================

  const handleExportExcel = () => {
    if (records.length === 0) {
      console.warn(
        'Tidak ada data WO untuk diekspor.'
      );
      return;
    }

    exportAuditReportToExcel(
      records,
      preprocStats,
      mlStats
    );
  };

  // ==========================================================
  // T. RULE FILTER
  // ==========================================================

  const handleFilterByRule = (_ruleId: string) => {
    setSelectedFilter('rules');

    setActiveTab('records');
  };

  // ==========================================================
  // U. SAVE SUPERVISOR REVIEW
  // ==========================================================

  const handleSaveSupervisorReview = (
    woId: string,
    status: SupervisorVerificationStatus,
    notes: string
  ) => {

    if (!currentUser) {
      console.error(
        'Pemeriksaan tidak dapat disimpan: pengguna belum login.'
      );
      return;
    }

    const review = {
      status,
      notes,
      verifiedBy: currentUser.fullName,
      verifiedAt: new Date().toISOString(),
    };

    // --------------------------------------------------------
    // Save review state.
    // --------------------------------------------------------

    setSupervisorReviews(previous => ({
      ...previous,
      [woId]: review,
    }));

    // --------------------------------------------------------
    // Find original record.
    // --------------------------------------------------------

    const record = records.find(
      item =>
        String(item.OFFERNUM) === String(woId)
    );

    // --------------------------------------------------------
    // Create audit log.
    // --------------------------------------------------------

    const newLog: AuditLogEntry = {
      id: crypto.randomUUID(),

      timestamp: new Date().toISOString(),

      performedBy: currentUser.fullName,

      userRole: currentUser.role,

      action: 'Pemeriksaan Work Order',

      targetOfferNum: woId,

      previousStatus:
        record?.supervisorVerification?.status,

      newStatus: status,

      notes,
    };

    setAuditLogs(previous => [
      newLog,
      ...previous,
    ]);
  };

  // ==========================================================
  // V. MODEL RETRAINING
  // ==========================================================

  /**
   * Menjalankan analisis ulang menggunakan konfigurasi terbaru.
   *
   * Penting:
   * Analisis dihitung langsung dengan newConfig sebelum
   * metadata eksperimen disimpan.
   *
   * Dengan demikian, riwayat eksperimen tidak mengambil
   * hasil mlStats dari konfigurasi sebelumnya.
   */

  const handleRetrainModel = async (
  newConfig: IsolationForestModelConfig
) => {

    if (rawRecords.length === 0) {
      console.warn(
        'Model tidak dapat dijalankan karena dataset masih kosong.'
      );
      return;
    }

    // --------------------------------------------------------
    // Validate contamination.
    // --------------------------------------------------------

    if (
      !Number.isFinite(newConfig.contamination) ||
      newConfig.contamination < 0.01 ||
      newConfig.contamination > 0.20
    ) {
      console.error(
        'Contamination harus berada pada rentang 0.01 sampai 0.20.'
      );
      return;
    }

    // --------------------------------------------------------
    // Validate minimum sample size.
    // --------------------------------------------------------

    if (
      !Number.isInteger(
        newConfig.minSampleSizeForSeparateModels
      ) ||
      newConfig.minSampleSizeForSeparateModels < 2
    ) {
      console.error(
        'Minimum sample size harus berupa bilangan bulat minimal 2.'
      );
      return;
    }

    // --------------------------------------------------------
    // Calculate using the NEW configuration.
    // --------------------------------------------------------

    // --------------------------------------------------------
// Calculate using the NEW configuration.
// --------------------------------------------------------

const freshPipeline = buildPipeline(
  rawRecords,
  columnMapping,
  adminNetworkRules,
  sopConfig,
  newConfig
);

// --------------------------------------------------------
// Run Isolation Forest through FastAPI.
// --------------------------------------------------------

const backendResult = await apiService.predictIsolationForest(
  freshPipeline.records,
  newConfig
);

// --------------------------------------------------------
// Use backend result when available.
// Otherwise use local pipeline result.
// --------------------------------------------------------

const finalAnomaliesDetected =
  backendResult?.summary.anomaliesDetected ??
  freshPipeline.mlStats.anomaliesDetected;

const finalFeaturesUsed =
  backendResult?.summary.featuresUsed ??
  freshPipeline.mlStats.featureNames;

// Gunakan statistik backend jika berhasil.
// Jika gagal, pertahankan hasil pipeline lokal.

    // --------------------------------------------------------
    // Apply new model configuration.
    // --------------------------------------------------------

    setModelConfig({
      ...newConfig,
    });

    // --------------------------------------------------------
    // Save experiment metadata from fresh results.
    // --------------------------------------------------------

    const newVersion: ModelMetadata = {
  modelVersion: `EXP-${Date.now()}`,
  trainedAt: new Date().toISOString(),
  datasetVersion: datasetName,

  totalRecordsEvaluated:
    freshPipeline.records.length,

  ftthRecordsCount:
    freshPipeline.preprocStats.ftthCount,

  hfcRecordsCount:
    freshPipeline.preprocStats.hfcCount,

  anomaliesDetectedCount:
    finalAnomaliesDetected,

  contaminationRate:
    newConfig.contamination * 100,

  parameters: {
    ...newConfig,
  },

  featuresUsed: [
    ...finalFeaturesUsed,
  ],

  warningMessage:
    freshPipeline.mlStats.warningMessage,
};

    setModelHistory(previous => [
      newVersion,
      ...previous,
    ]);

    console.info('Model experiment berhasil dicatat:', {
      modelVersion: newVersion.modelVersion,
      totalRecords: newVersion.totalRecordsEvaluated,
      anomaliesDetected: newVersion.anomaliesDetectedCount,
      configuredContamination: newConfig.contamination,
    });
  };

  // ==========================================================
  // W. TECHNICIAN GPS
  // ==========================================================

  const handleToggleTechnicianSharing = (
    techId: string,
    active: boolean
  ) => {
    setTechnicians(previous =>
      previous.map(technician =>
        technician.technicianId === techId
          ? {
              ...technician,
              isSharingActive: active,
            }
          : technician
      )
    );
  };

  const handleUpdateTechnicianLocation = async (
    updates: Partial<TechnicianLocation>
  ) => {
    if (!currentUser || currentUser.role !== 'TECHNICIAN') return;

    const timestamp = updates.timestamp ?? new Date().toISOString();
    const latitude = updates.latitude ?? currentTechLocation?.latitude ?? null;
    const longitude = updates.longitude ?? currentTechLocation?.longitude ?? null;
    const accuracy = updates.accuracy ?? currentTechLocation?.accuracy ?? null;
    const isSharingActive =
      updates.isSharingActive ?? currentTechLocation?.isSharingActive ?? false;

    const { error } = await supabase
      .from('technician_locations')
      .upsert(
        {
          technician_id: currentUser.id,
          latitude,
          longitude,
          accuracy,
          is_sharing_active: isSharingActive,
          updated_at: timestamp,
        },
        { onConflict: 'technician_id' }
      );

    if (error) {
      console.error('Gagal menyimpan lokasi teknisi ke Supabase:', error);
      return;
    }

    // Tambahkan teknisi bila belum ada; jangan hanya map array kosong.
    const updatedLocation: TechnicianLocation = {
      technicianId: currentUser.id,
      technicianName: currentUser.fullName,
      latitude: Number(latitude ?? 0),
      longitude: Number(longitude ?? 0),
      accuracy: Number(accuracy ?? 0),
      timestamp,
      isSharingActive,
      assignedBranch: currentUser.branch ?? '',
      isStale: false,
      ...updates,
    };

    setTechnicians(previous => {
      const exists = previous.some(
        technician => technician.technicianId === currentUser.id
      );

      return exists
        ? previous.map(technician =>
            technician.technicianId === currentUser.id
              ? { ...technician, ...updatedLocation }
              : technician
          )
        : [...previous, updatedLocation];
    });
  };

  // ==========================================================
  // X. UPDATE WORK ORDER
  // ==========================================================

  const handleUpdateWoStatus = (
    woId: string,
    updates: Partial<PreprocessedWorkOrder>
  ) => {

    const rawColumnFor = (
      canonical: keyof CanonicalWorkOrder,
      fallback: string
    ) => {
      return Object.entries(columnMapping).find(
        ([, mappedField]) =>
          mappedField === canonical
      )?.[0] || fallback;
    };

    const offerColumn =
      rawColumnFor('OFFERNUM', 'OFFERNUM');

    const startColumn =
      rawColumnFor('START', 'START');

    const finishColumn =
      rawColumnFor('FINISH', 'FINISH');

    const closeColumn =
      rawColumnFor(
        'Close_Status_WOM',
        'Close Status WOM'
      );

    const resultColumn =
      rawColumnFor(
        'Result_Choice',
        'Result Choice'
      );

    setRawRecords(previous =>
      previous.map(row => {

        const currentOfferNum =
          String(row[offerColumn] ?? '').trim();

        if (currentOfferNum !== String(woId).trim()) {
          return row;
        }

        return {
          ...row,

          ...(updates.start !== undefined && {
            [startColumn]: updates.start,
          }),

          ...(updates.finish !== undefined && {
            [finishColumn]: updates.finish,
          }),

          ...(updates.closeStatusWOM !== undefined && {
            [closeColumn]: updates.closeStatusWOM,
          }),

          ...(updates.resultChoice !== undefined && {
            [resultColumn]: updates.resultChoice,
          }),
        };
      })
    );
  };

  // ==========================================================
  // Y. CURRENT TECHNICIAN LOCATION
  // ==========================================================

  const currentTechLocation = useMemo(() => {

    if (
      !currentUser ||
      currentUser.role !== 'TECHNICIAN'
    ) {
      return undefined;
    }

    return technicians.find(
      technician =>
        technician.technicianId === currentUser.id
    );

  }, [
    currentUser,
    technicians,
  ]);

  // ==========================================================
  // Z. RENDER APPLICATION
  // ==========================================================

  // Pengunjung yang belum login melihat company profile ATP.
  // Dashboard NOC hanya dirender setelah autentikasi berhasil.
  
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060B18] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-300">
            Memeriksa sesi autentikasi...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Home onLogin={() => setIsAuthModalOpen(true)} />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
         onLoginSuccess={handleLoginSuccess}
          currentUser={currentUser}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#060B18] font-sans text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <NocSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomalyCount={mlStats.anomaliesDetected}
        totalRecords={records.length}
        unreviewedCount={unreviewedCount}
      />

      {/* ================================================== */}
      {/* MAIN LAYOUT */}
      {/* ================================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">

        {/* TOPBAR */}

        <NocTopbar
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          backendStatus={backendStatus}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {/* MAIN CONTENT */}

        <main className="flex-1 space-y-6 p-5 md:p-6 lg:p-7">

          {/* ================================================= */}
          {/* DASHBOARD */}
          {/* ================================================= */}

          {activeTab === 'dashboard' && (
            <NocDashboard
              records={records}
              technicians={technicians}
              onSelectRecord={setSelectedRecord}
              onNavigateTab={setActiveTab}
              isDemoData={false}
            />
          )}

          {/* ================================================= */}
          {/* WORK ORDER */}
          {/* ================================================= */}

          {activeTab === 'records' && (
            <div className="space-y-5">

              <DatasetToolbar
                currentDatasetName={datasetName}
                onSelectActual8={handleSelectActual8}
                onSelectSample50={handleSelectSample50}
                onSelectHistorical1250={handleSelectHistorical1250}
                onOpenMappingModal={() => setIsMappingModalOpen(true)}
                onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
                onExportExcel={handleExportExcel}
                onFileUpload={handleFileUpload}
                preprocStats={preprocStats}
                mlStats={mlStats}
                onClearDataset={handleClearDataset}
              />

              <AnomalyTable
                records={records}
                onSelectRecord={setSelectedRecord}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
              />

            </div>
          )}

          {/* ================================================= */}
          {/* RULE VALIDATION */}
          {/* ================================================= */}

          {activeTab === 'rules' && (
            <RulesSummaryView
              records={records}
              config={sopConfig}
              onOpenConfig={() => setIsRuleConfigModalOpen(true)}
              onFilterByRule={handleFilterByRule}
            />
          )}

          {/* ================================================= */}
          {/* ISOLATION FOREST */}
          {/* ================================================= */}

          {activeTab === 'isolation_forest' && (
            <div className="space-y-6">

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#091124] p-4">

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Isolation Forest - Analisis Anomali
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Analisis berdasarkan dataset Work Order yang diimpor.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Contamination konfigurasi:{' '}
                    {(modelConfig.contamination * 100).toFixed(1)}%
                  </p>
                </div>

                <button
                  type="button"
                  disabled={records.length === 0}
                  onClick={() => setIsModelExperimentOpen(true)}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Konfigurasi Model
                </button>

              </div>

              <IsolationForestChart
                stats={mlStats}
                records={records}
                onSelectRecord={setSelectedRecord}
              />

            </div>
          )}

          {/* ================================================= */}
          {/* GIS */}
          {/* ================================================= */}

          {activeTab === 'gis' && (
            <GisDashboard
              records={records}
              technicians={technicians}
              onSelectRecord={setSelectedRecord}
            />
          )}

          {/* ================================================= */}
          {/* TECHNICIAN MONITORING */}
          {/* ================================================= */}

          {activeTab === 'monitoring_teknisi' && (
            <TechnicianMonitoringView
              technicians={technicians}
              currentUser={currentUser}
              onNavigateToMap={() => setActiveTab('gis')}
              onToggleSharing={handleToggleTechnicianSharing}
            />
          )}

          {/* ================================================= */}
          {/* SUPERVISOR REVIEW */}
          {/* ================================================= */}

          {activeTab === 'review_supervisor' && (
            <SupervisorReviewView
              records={records}
              currentUser={currentUser}
              onSelectRecord={setSelectedRecord}
              onOpenReviewModal={record => {
                setSelectedRecord(record);
                setIsSupervisorReviewOpen(true);
              }}
              auditLogs={auditLogs}
            />
          )}

          {/* ================================================= */}
          {/* REPORTS */}
          {/* ================================================= */}

          {activeTab === 'reports' && (
            <ReportingView
              records={records}
              preprocStats={preprocStats}
              mlStats={mlStats}
            />
          )}

          {/* ================================================= */}
          {/* MASTER DATA */}
          {/* ================================================= */}

          {activeTab === 'master_data' && (
            <MasterDataView />
          )}

          {/* ================================================= */}
          {/* USER MANAGEMENT */}
          {/* ================================================= */}

          {activeTab === 'user_management' && (
            <UserManagementView
              currentUser={currentUser}
              onSelectUser={user => {
                setCurrentUser(user);

                if (user.role === 'TECHNICIAN') {
                  setActiveTab('technician_portal');
                }
              }}
            />
          )}

          {/* ================================================= */}
          {/* SETTINGS */}
          {/* ================================================= */}

          {activeTab === 'settings' && (
            <SettingsView
              backendStatus={backendStatus}
              onRefreshBackendStatus={handleRefreshBackendStatus}
              onOpenRuleConfig={() => setIsRuleConfigModalOpen(true)}
              onOpenModelExperiment={() => setIsModelExperimentOpen(true)}
              onSelectSample50={handleSelectSample50}
              onSelectHistorical1250={handleSelectHistorical1250}
              modelConfig={modelConfig}
              sopConfig={sopConfig}
            />
          )}

          {/* ================================================= */}
          {/* TECHNICIAN PORTAL */}
          {/* ================================================= */}

          {activeTab === 'technician_portal' && currentUser && (
            <TechnicianPortal
              currentUser={currentUser}
              records={records}
              technicianLocation={currentTechLocation}
              onUpdateLocation={handleUpdateTechnicianLocation}
              onSelectRecord={setSelectedRecord}
              onUpdateWoStatus={handleUpdateWoStatus}
            />
          )}

          {/* ================================================= */}
          {/* TECHNICIAN GANTT */}
          {/* ================================================= */}

          {activeTab === 'gantt' && (
            <TechCollisionGantt
              records={records}
              onSelectRecord={setSelectedRecord}
            />
          )}

        </main>
      </div>

      {/* ================================================== */}
      {/* ANOMALY DETAIL */}
      {/* ================================================== */}

      <AnomalyDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenSupervisorReview={record => {
          setSelectedRecord(record);
          setIsSupervisorReviewOpen(true);
        }}
      />

      {/* ================================================== */}
      {/* AUTHENTICATION */}
      {/* ================================================== */}

      <AuthModal
  isOpen={isAuthModalOpen}
  onClose={() => setIsAuthModalOpen(false)}
  onLoginSuccess={handleLoginSuccess}
  currentUser={currentUser}
/>

      {/* ================================================== */}
      {/* SUPERVISOR REVIEW MODAL */}
      {/* ================================================== */}

      <SupervisorReviewModal
        isOpen={isSupervisorReviewOpen}
        onClose={() => setIsSupervisorReviewOpen(false)}
        record={selectedRecord}
        currentUser={currentUser}
        onSaveReview={handleSaveSupervisorReview}
      />

      {/* ================================================== */}
      {/* MODEL CONFIGURATION */}
      {/* ================================================== */}

      <ModelExperimentModal
        isOpen={isModelExperimentOpen}
        onClose={() => setIsModelExperimentOpen(false)}
        currentConfig={modelConfig}
        onRetrainModel={handleRetrainModel}
        modelHistory={modelHistory}
      />

      {/* ================================================== */}
      {/* COLUMN MAPPING */}
      {/* ================================================== */}

      <ColumnMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        rawHeaders={rawHeaders}
        mapping={columnMapping}
        onUpdateMapping={setColumnMapping}
        offerNumStats={offerNumStats}
      />

      {/* ================================================== */}
      {/* NETWORK CLASSIFICATION */}
      {/* ================================================== */}

      <NetworkClassificationModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        adminRules={adminNetworkRules}
        onSaveRules={setAdminNetworkRules}
        records={records}
      />

      {/* ================================================== */}
      {/* RULE CONFIGURATION */}
      {/* ================================================== */}

      <RuleConfigModal
        isOpen={isRuleConfigModalOpen}
        onClose={() => setIsRuleConfigModalOpen(false)}
        config={sopConfig}
        onSaveConfig={setSopConfig}
      />

    </div>
  );
}
