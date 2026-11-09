
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FTTH & HFC SMART OPERATIONAL INTELLIGENCE SYSTEM
 * PT. ANUGERAH TERANG PERSADA
 *
 * Central type definitions.
 * Data operasional berasal dari file Work Order yang diimpor pengguna.
 */

// ============================================================
// 1. BASIC TYPES
// ============================================================

export type UserRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TECHNICIAN';

export type NetworkType =
  | 'FTTH'
  | 'HFC'
  | 'Unclassified';

export type AnomalySeverity =
  | 'NORMAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type CheckType =
  | 'RULE_BASED'
  | 'MACHINE_LEARNING'
  | 'HYBRID';

export type RuleResultStatus =
  | 'VALID'
  | 'WARNING'
  | 'INVALID'
  | 'NEEDS_REVIEW';

export type SupervisorVerificationStatus =
  | 'BELUM_DIREVIEW'
  | 'DALAM_PEMERIKSAAN'
  | 'VALID'
  | 'TERKONFIRMASI_TIDAK_SESUAI'
  | 'MEMBUTUHKAN_KLARIFIKASI'
  | 'UNREVIEWED'
  | 'CONFIRMED_DISCREPANCY'
  | 'NORMAL_VERIFIED'
  | 'INCONCLUSIVE';

// ============================================================
// 2. COLUMN MAPPING
// ============================================================

export interface ColumnMappingDefinition {
  canonicalKey: keyof CanonicalWorkOrder;
  label: string;

  category:
    | 'identity'
    | 'protected_customer'
    | 'timestamps'
    | 'operational'
    | 'network';

  description: string;
  isMandatory: boolean;

  /**
   * Data pelanggan yang dilindungi.
   * Tidak boleh digunakan sebagai fitur Machine Learning.
   */
  isProtectedCustomerData: boolean;

  aliases: string[];
}

// ============================================================
// 3. USER ACCOUNT
// ============================================================

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;

  phone?: string;
  branch: string;
  avatarUrl?: string;

  createdAt: string;
  lastLoginAt?: string;
}

// ============================================================
// 4. TECHNICIAN LOCATION
// ============================================================

export interface TechnicianLocation {
  technicianId: string;
  technicianName: string;

  latitude: number;
  longitude: number;

  accuracy: number;
  timestamp: string;

  batteryLevel?: number;
  speed?: number;

  isSharingActive: boolean;
  assignedBranch: string;

  currentWorkOrderId?: string;
  isStale: boolean;
}

export interface LocationSharingSession {
  sessionId: string;
  technicianId: string;

  startTime: string;
  endTime?: string;

  isActive: boolean;
  consentGranted: boolean;

  recordedPointsCount: number;
}

// ============================================================
// 5. CANONICAL WORK ORDER
// ============================================================

export interface CanonicalWorkOrder {
  // ----------------------------------------------------------
  // Identity
  // ----------------------------------------------------------

  OFFERNUM: string;
  WORDER: string;

  // ----------------------------------------------------------
  // Protected Customer Information
  // NEVER USE AS MACHINE LEARNING FEATURES
  // ----------------------------------------------------------

  CUST_ACCT: string;

  Customer_Name: string;
  Address: string;
  Phone_No?: string;

  // ----------------------------------------------------------
  // Network Information
  // ----------------------------------------------------------

  Jenis_Jaringan?: NetworkType;
  networkType: NetworkType;

  Branch?: string;

  SITE_ID: string;
  FIBERNODE: string;
  MKTTYPE: string;

  Routing?: string;

  // ----------------------------------------------------------
  // Job Information
  // ----------------------------------------------------------

  jobType: string;
  jobTask: string;

  Installer?: string;
  installer: string;

  Contractor?: string;
  contractor: string;

  // ----------------------------------------------------------
  // Operational Status
  // ----------------------------------------------------------

  Stat_GD?: string;
  STAT_GT?: string;
  Stat_GC?: string;

  Confirmation_Status?: string;
  monitoring_Remark?: string;

  Result_Choice?: string;
  resultChoice: string;

  Result_Remark?: string;
  resultRemark: string;

  Close_Status_WOM?: string;
  closeStatusWOM: string;

  WIP_Comment?: string;
  wipComment: string;

  // ----------------------------------------------------------
  // Schedule and Operational Timestamps
  // ----------------------------------------------------------

  SCH_Date?: string;
  schDate: string;

  SCH_Time?: string;
  schTime: string;

  START?: string;
  start: string;

  FINISH?: string;
  finish: string;

  Report_Date?: string;
  reportDate: string;

  Report_By?: string;
  reportBy: string;

  Update_Date?: string;
  updateDate: string;

  Update_By?: string;
  updateBy: string;

  CloseDate?: string;
  closeDate: string;

  // ----------------------------------------------------------
  // Geographic Coordinates
  // ----------------------------------------------------------

  latitude?: number;
  longitude?: number;

  hasValidGeoCoord: boolean;
  tikorRawString?: string;

  // ----------------------------------------------------------
  // Original Imported Data
  // ----------------------------------------------------------

  rawFields: Record<string, any>;
}

// ============================================================
// 6. PREPROCESSED WORK ORDER
// ============================================================

export interface PreprocessedWorkOrder
  extends CanonicalWorkOrder {

  // ----------------------------------------------------------
  // Record Identity
  // ----------------------------------------------------------

  id: string;
  originalRowIndex: number;

  // ----------------------------------------------------------
  // Parsed Date Objects
  // ----------------------------------------------------------

  schDateTime: Date | null;
  startDateTime: Date | null;
  finishDateTime: Date | null;

  reportDateTime: Date | null;
  updateDateTime: Date | null;
  closeDateTime: Date | null;

  // ----------------------------------------------------------
  // Computed Durations (Minutes / Hours / Days)
  // ----------------------------------------------------------

  recordingWindowMinutes: number | null;

  schToReportHours: number | null;

  reportToUpdateMinutes: number | null;
  reportToCloseMinutes: number | null;

  schToCloseDays: number | null;

  // ----------------------------------------------------------
  // Operational Pattern Features
  // ----------------------------------------------------------

  techDailyJobCount: number;
  techDailySequence: number;

  reportHour: number | null;

  batchReportWindowCount: number;

  // ----------------------------------------------------------
  // Geographic Analysis
  // ----------------------------------------------------------

  distanceToTechMeters?: number;

  isGeographicAnomaly?: boolean;
  geographicAnomalyDetail?: string;

  // ----------------------------------------------------------
  // Rule-Based Analysis
  // ----------------------------------------------------------

  ruleViolations: RuleViolation[];

  // ----------------------------------------------------------
  // Machine Learning Results
  // ----------------------------------------------------------

  /**
   * Isolation Forest anomaly score.
   * Bukan probabilitas kesalahan.
   */
  mlScore: number;

  isMlAnomaly: boolean;

  mlTreePathLength: number;

  // ----------------------------------------------------------
  // Combined Analysis
  // ----------------------------------------------------------

  compositeSeverity: AnomalySeverity;

  checkType: CheckType;

  deviatingFeatures: DeviatingFeature[];

  verificationRecommendations: string[];

  neutralIndicationReason: string;

  // ----------------------------------------------------------
  // Supervisor Verification
  // ----------------------------------------------------------

  supervisorVerification: {
    status: SupervisorVerificationStatus;
    notes: string;

    verifiedBy?: string;
    verifiedAt?: string;
  };

  // ----------------------------------------------------------
  // Data Quality
  // ----------------------------------------------------------

  missingMandatoryFields: string[];

  hasInvalidTimestamps: boolean;

  isDuplicateId: boolean;
}

// ============================================================
// 7. RULE VIOLATION
// ============================================================

export interface RuleViolation {
  ruleId: string;
  ruleCode: string;
  ruleName: string;

  severity: AnomalySeverity;

  statusCategory?: RuleResultStatus;

  evidence?: string;

  description: string;
  recommendation: string;

  fieldsInvolved: string[];
}

// ============================================================
// 8. DEVIATING FEATURES
// ============================================================

export interface DeviatingFeature {
  featureName: string;
  featureLabel: string;

  observedValue: string | number;

  benchmarkMedian: string | number;

  benchmarkRange: string;

  deviationRatio: string;

  interpretation: string;
}

// ============================================================
// 9. ISOLATION FOREST STATISTICS
// ============================================================

export interface IsolationForestStats {
  modelType:
    | 'SEPARATE_FTTH_HFC'
    | 'UNIFIED_GLOBAL';

  ftthModelTrained: boolean;
  ftthSampleCount: number;

  hfcModelTrained: boolean;
  hfcSampleCount: number;

  warningMessage?: string;

  featureNames: string[];

  totalEvaluated: number;

  anomaliesDetected: number;

  /**
   * Persentase record yang terdeteksi sebagai anomali
   * dari keseluruhan record yang dievaluasi.
   *
   * Bukan nilai contamination konfigurasi.
   */
  contaminationRate: number;

  /**
   * Nilai contamination yang digunakan saat training.
   */
  configuredContaminationRate?: number;
}

// ============================================================
// 10. ISOLATION FOREST MODEL CONFIGURATION
// ============================================================

export interface IsolationForestModelConfig {
  /**
   * Jumlah pohon dalam Isolation Forest.
   */
  n_estimators: number;

  /**
   * Asumsi proporsi kandidat anomali.
   * Rentang konfigurasi: 0.01 - 0.20.
   */
  contamination: number;

  /**
   * Jumlah sampel maksimum untuk setiap pohon.
   */
  max_samples: number | 'auto';

  /**
   * Jumlah fitur yang digunakan pada setiap pohon.
   */
  max_features: number;

  /**
   * Random seed agar hasil dapat direproduksi.
   */
  random_state: number;

  /**
   * Minimum jumlah record untuk model terpisah.
   */
  minSampleSizeForSeparateModels: number;

  /**
   * Pengaturan model berdasarkan jenis jaringan.
   */
  isFtthSeparate: boolean;
  isHfcSeparate: boolean;
}

// ============================================================
// 11. MODEL EXPERIMENT HISTORY
// ============================================================

export interface ModelMetadata {
  modelVersion: string;

  trainedAt: string;

  datasetVersion: string;

  totalRecordsEvaluated: number;

  ftthRecordsCount: number;
  hfcRecordsCount: number;

  anomaliesDetectedCount: number;

  /**
   * Persentase contamination konfigurasi
   * dalam satuan persen.
   */
  contaminationRate: number;

  parameters: IsolationForestModelConfig;

  featuresUsed: string[];

  warningMessage?: string;
}

// ============================================================
// 12. SOP CONFIGURATION
// ============================================================

export interface SOPRuleConfig {
  minDurationMinutes: number;

  maxDurationMinutes: number;

  overlapToleranceMinutes: number;

  allowUpdateBeforeReportWithGraceMinutes: number;

  minTechDailyVolumeThreshold: number;

  maxDistanceTechToWOMeters: number;

  minSampleSizeForSeparateModels: number;

  contradictoryNegativeKeywords: string[];

  doneStatusKeywords: string[];

  cancelledStatusKeywords: string[];
}

// ============================================================
// 13. NETWORK MAPPING RULE
// ============================================================

export interface NetworkMappingRule {
  id: string;

  field:
    | 'FIBERNODE'
    | 'MKTTYPE'
    | 'SITE_ID'
    | 'Job Task'
    | 'Branch';

  pattern: string;

  targetNetwork: NetworkType;

  isRegex: boolean;
}

// ============================================================
// 14. PREPROCESSING STATISTICS
// ============================================================

export interface PreprocessingStats {
  totalRows: number;

  validRows: number;

  duplicateKeysCount: number;
  duplicateRowsCount: number;

  cleanedWhitespaceCount: number;

  normalizedStatusCount: number;

  invalidTimestampsCount: number;

  missingMandatoryCount: number;

  ftthCount: number;
  hfcCount: number;
  unclassifiedCount: number;

  columnCount: number;

  geocodedCount: number;
}

// ============================================================
// 15. AUDIT LOG
// ============================================================

export interface AuditLogEntry {
  id: string;

  timestamp: string;

  performedBy: string;

  userRole: UserRole;

  action: string;

  targetOfferNum: string;

  previousStatus?: string;
  newStatus?: string;

  notes?: string;
}

// ============================================================
// 16. BRANCH INFORMATION
// ============================================================

export interface BranchInfo {
  id: string;

  code: string;
  name: string;

  region: string;
  coverageArea: string;

  activeTechniciansCount: number;

  totalWorkOrdersCount: number;

  slaRate: number;
}

// ============================================================
// 17. SITE INFORMATION
// ============================================================

export interface SiteInfo {
  id: string;

  siteId: string;
  fibernode: string;

  networkType: NetworkType;

  branch: string;
  address: string;

  latitude?: number;
  longitude?: number;

  status:
    | 'ACTIVE'
    | 'MAINTENANCE'
    | 'PLANNED';
}

// ============================================================
// 18. JOB TYPE INFORMATION
// ============================================================

export interface JobTypeInfo {
  id: string;

  jobType: string;
  jobTask: string;

  standardDurationMinutes: number;

  defaultNetwork: NetworkType;

  slaHours: number;

  description: string;
}

// ============================================================
// 19. BACKEND STATUS
// ============================================================

export interface BackendStatus {
  isConnected: boolean;

  isChecking: boolean;

  endpointUrl: string;

  lastChecked: string | null;

  serverEngine:
    | 'FASTAPI_SCIKIT_LEARN'
    | 'CLIENT_SIDE_SIMULATION';

  latencyMs?: number;

  errorMessage?: string;
}
