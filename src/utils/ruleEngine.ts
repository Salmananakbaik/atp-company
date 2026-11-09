
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 10 DETERMINISTIC OPERATIONAL RULES ENGINE
 * PT. ANUGERAH TERANG PERSADA
 *
 * Rule Engine:
 * R1  - Nomor WO kosong atau duplikat
 * R2  - START kosong
 * R3  - FINISH kosong
 * R4  - FINISH lebih awal daripada START
 * R5  - Durasi pekerjaan tidak wajar
 * R6  - Penyimpangan jadwal WO
 * R7  - Format tanggal dan waktu tidak valid
 * R8  - Ketidaksesuaian status dan remark
 * R9  - Koordinat geografis tidak valid
 * R10 - Konflik jadwal teknisi
 *
 * Catatan:
 * Hasil pemeriksaan merupakan indikasi awal untuk verifikasi.
 * Hasil rule engine bukan bukti pelanggaran atau kecurangan.
 */

import {
  PreprocessedWorkOrder,
  RuleViolation,
  SOPRuleConfig,
  AnomalySeverity,
  RuleResultStatus,
} from '../types/telco';

// ============================================================
// 1. DEFAULT SOP CONFIGURATION
// ============================================================

export const DEFAULT_SOP_CONFIG: SOPRuleConfig = {
  minDurationMinutes: 1,
  maxDurationMinutes: 360,

  overlapToleranceMinutes: 5,

  allowUpdateBeforeReportWithGraceMinutes: 2,

  minTechDailyVolumeThreshold: 8,

  minSampleSizeForSeparateModels: 30,

  contradictoryNegativeKeywords: [
    'gagal',
    'batal',
    'kendala',
    'reschedule',
    'tidak ada orang',
    'rumah kosong',
    'reject',
    'pelanggan menolak',
    'fat penuh',
    'kabel putus',
    'los',
    'tidak bisa ditarik',
    'batal pasang',
    'cancel',
    'redaman tinggi',
  ],

  doneStatusKeywords: [
    'DONE',
    'SUCCESS',
    'SELESAI',
    'SUKSES',
    'OK',
    'COMPLETED',
    'COMPLETE',
    'CLOSE',
    'CLOSED',
  ],

  cancelledStatusKeywords: [
    'CANCEL',
    'CANCELLED',
    'CANCELED',
    'BATAL',
    'REJECT',
    'REJECTED',
    'DITOLAK',
  ],

  maxDistanceTechToWOMeters: 1000,
};

// Toleransi keterlambatan jadwal dalam menit.
// Nilai ini mengikuti parameter SOP pada katalog aturan.
const SCHEDULE_TOLERANCE_MINUTES = 120;

// ============================================================
// 2. RULE CATALOG
// ============================================================

export interface OperationalRuleCatalogItem {
  id: string;
  code: string;
  name: string;
  desc: string;
  severity: AnomalySeverity;
  defaultStatus: RuleResultStatus;
  sopParam: string;
}

export const OPERATIONAL_RULES_CATALOG: OperationalRuleCatalogItem[] = [
  {
    id: 'R1',
    code: 'RULE_WO_EMPTY_OR_DUPLICATE',
    name: '1. Nomor WO Kosong atau Duplikat',
    desc: 'Nomor identitas WO tidak terisi atau terdaftar lebih dari satu kali.',
    severity: 'HIGH',
    defaultStatus: 'INVALID',
    sopParam: 'OFFERNUM atau WORDER harus tersedia dan unik.',
  },
  {
    id: 'R2',
    code: 'RULE_START_EMPTY',
    name: '2. START Kosong',
    desc: 'Jam mulai pengerjaan teknisi tidak dicatat.',
    severity: 'MEDIUM',
    defaultStatus: 'NEEDS_REVIEW',
    sopParam: 'START wajib dicatat untuk pekerjaan yang telah selesai.',
  },
  {
    id: 'R3',
    code: 'RULE_FINISH_EMPTY',
    name: '3. FINISH Kosong',
    desc: 'Jam selesai pengerjaan teknisi tidak dicatat.',
    severity: 'MEDIUM',
    defaultStatus: 'NEEDS_REVIEW',
    sopParam: 'FINISH wajib dicatat untuk pekerjaan yang telah selesai.',
  },
  {
    id: 'R4',
    code: 'RULE_FINISH_BEFORE_START',
    name: '4. FINISH Lebih Awal daripada START',
    desc: 'Waktu selesai mendahului waktu mulai tanpa indikasi lintas tengah malam.',
    severity: 'HIGH',
    defaultStatus: 'INVALID',
    sopParam: 'FINISH harus berada setelah START.',
  },
  {
    id: 'R5',
    code: 'RULE_UNUSUAL_DURATION',
    name: '5. Durasi Pekerjaan Tidak Wajar',
    desc: 'Durasi pekerjaan terlalu singkat atau terlalu lama.',
    severity: 'MEDIUM',
    defaultStatus: 'NEEDS_REVIEW',
    sopParam: 'Durasi mengikuti konfigurasi SOP.',
  },
  {
    id: 'R6',
    code: 'RULE_SCHEDULE_DEVIATION',
    name: '6. Penyimpangan Jadwal WO',
    desc: 'Pelaksanaan menyimpang dari jadwal tetap. Jadwal Anytime dikecualikan.',
    severity: 'LOW',
    defaultStatus: 'WARNING',
    sopParam: 'Toleransi keterlambatan 120 menit.',
  },
  {
    id: 'R7',
    code: 'RULE_INVALID_DATE_TIME_FORMAT',
    name: '7. Format Tanggal dan Waktu Tidak Valid',
    desc: 'Tanggal atau waktu tidak valid atau memiliki urutan kronologis tidak konsisten.',
    severity: 'MEDIUM',
    defaultStatus: 'WARNING',
    sopParam: 'Urutan tanggal harus konsisten.',
  },
  {
    id: 'R8',
    code: 'RULE_STATUS_REMARK_DISCREPANCY',
    name: '8. Ketidaksesuaian Status dengan Catatan',
    desc: 'Status selesai bertentangan dengan status penutupan atau catatan kendala.',
    severity: 'HIGH',
    defaultStatus: 'INVALID',
    sopParam: 'Status dan catatan pekerjaan harus konsisten.',
  },
  {
    id: 'R9',
    code: 'RULE_INVALID_GEOGRAPHIC_COORDINATES',
    name: '9. Koordinat Tidak Valid',
    desc: 'Koordinat geografis tidak valid atau berada di luar cakupan Indonesia.',
    severity: 'MEDIUM',
    defaultStatus: 'WARNING',
    sopParam: 'Latitude -11.5 sampai 6.5; Longitude 94.5 sampai 141.5.',
  },
  {
    id: 'R10',
    code: 'RULE_TECH_SCHEDULE_COLLISION',
    name: '10. Kemungkinan Konflik Jadwal Teknisi',
    desc: 'Teknisi tercatat mengerjakan lebih dari satu WO dalam interval yang bertumpang tindih.',
    severity: 'HIGH',
    defaultStatus: 'NEEDS_REVIEW',
    sopParam: 'Hanya diperiksa jika interval pekerjaan tersedia.',
  },
];

// ============================================================
// 3. GENERAL HELPER FUNCTIONS
// ============================================================

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function isEmpty(value: unknown): boolean {
  const text = normalize(value);

  return (
    text === '' ||
    text === '-' ||
    text === 'NULL' ||
    text === 'UNDEFINED' ||
    text === 'N/A' ||
    text === 'NA'
  );
}

function isValidDate(
  value: Date | null | undefined
): value is Date {
  return (
    value instanceof Date &&
    Number.isFinite(value.getTime())
  );
}

function isValidInterval(
  start: Date | null | undefined,
  finish: Date | null | undefined
): boolean {
  return (
    isValidDate(start) &&
    isValidDate(finish) &&
    finish.getTime() > start.getTime()
  );
}

function isZeroTime(value: unknown): boolean {
  const text = normalize(value);

  return (
    text === '00:00' ||
    text === '00:00:00'
  );
}

function matchesConfiguredStatus(
  value: unknown,
  keywords: string[]
): boolean {
  const status = normalize(value);

  if (!status) {
    return false;
  }

  return keywords.some(
    keyword => normalize(keyword) === status
  );
}

function containsNegativeKeyword(
  text: string,
  keyword: string
): boolean {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);

  if (!normalizedText || !normalizedKeyword) {
    return false;
  }

  // Frasa seperti "TIDAK ADA ORANG".
  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword);
  }

  // Kata tunggal menggunakan batas kata.
  const escaped = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const regex = new RegExp(
    `(^|\\s)${escaped}(?=\\s|$|[.,;:!?])`,
    'i'
  );

  return regex.test(normalizedText);
}

function createViolation(
  values: {
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    severity: AnomalySeverity;
    statusCategory: RuleResultStatus;
    evidence: string;
    description: string;
    recommendation: string;
    fieldsInvolved: string[];
  }
): RuleViolation {
  return values;
}

function formatMinutes(value: number): string {
  return `${value} menit`;
}

/**
 * Identitas WO:
 * Prioritaskan OFFERNUM.
 * Jika OFFERNUM kosong, gunakan WORDER.
 *
 * CUST_ACCT tidak digunakan sebagai identitas WO.
 */
function getWorkOrderIdentity(
  record: PreprocessedWorkOrder
): string {
  const offerNum = String(record.OFFERNUM ?? '').trim();

  if (offerNum) {
    return `OFFERNUM:${normalize(offerNum)}`;
  }

  const worder = String(record.WORDER ?? '').trim();

  if (worder) {
    return `WORDER:${normalize(worder)}`;
  }

  return '';
}

function hasValidGeoCoordinates(
  record: PreprocessedWorkOrder
): boolean {
  if (record.hasValidGeoCoord === true) {
    return true;
  }

  const latitude = record.latitude;
  const longitude = record.longitude;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return false;
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }

  return (
    latitude >= -11.5 &&
    latitude <= 6.5 &&
    longitude >= 94.5 &&
    longitude <= 141.5
  );
}

function hasCoordinateData(
  record: PreprocessedWorkOrder
): boolean {
  return (
    !isEmpty(record.tikorRawString) ||
    record.latitude !== undefined ||
    record.longitude !== undefined
  );
}

// ============================================================
// 4. BUILD WO ID INDEX
// ============================================================

function buildDuplicateIdentitySet(
  records: PreprocessedWorkOrder[]
): Set<string> {
  const counts = new Map<string, number>();

  for (const record of records) {
    const identity = getWorkOrderIdentity(record);

    if (!identity) {
      continue;
    }

    counts.set(
      identity,
      (counts.get(identity) || 0) + 1
    );
  }

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([identity]) => identity)
  );
}

// ============================================================
// 5. BUILD TECHNICIAN INTERVAL INDEX
// ============================================================

interface TechnicianCollision {
  otherId: string;
  overlapMinutes: number;
}

function getDisplayWoId(
  record: PreprocessedWorkOrder
): string {
  const offerNum = String(record.OFFERNUM ?? '').trim();

  if (offerNum) {
    return offerNum;
  }

  const worder = String(record.WORDER ?? '').trim();

  if (worder) {
    return worder;
  }

  return String(record.id);
}

function buildTechnicianCollisionIndex(
  records: PreprocessedWorkOrder[],
  toleranceMinutes: number
): Map<string, TechnicianCollision[]> {
  const technicianMap = new Map<
    string,
    PreprocessedWorkOrder[]
  >();

  // Kelompokkan berdasarkan identitas teknisi.
  for (const record of records) {
    if (isEmpty(record.installer)) {
      continue;
    }

    if (
      !isValidInterval(
        record.startDateTime,
        record.finishDateTime
      )
    ) {
      continue;
    }

    const technician = normalize(record.installer);

    if (!technicianMap.has(technician)) {
      technicianMap.set(technician, []);
    }

    technicianMap.get(technician)!.push(record);
  }

  const result = new Map<
    string,
    TechnicianCollision[]
  >();

  // Bandingkan interval aktual seluruh WO teknisi.
  for (const group of technicianMap.values()) {
    if (group.length < 2) {
      continue;
    }

    const sortedGroup = [...group].sort(
      (a, b) =>
        a.startDateTime!.getTime() -
        b.startDateTime!.getTime()
    );

    for (let i = 0; i < sortedGroup.length; i++) {
      const a = sortedGroup[i];

      const aStart = a.startDateTime!.getTime();
      const aEnd = a.finishDateTime!.getTime();

      for (let j = i + 1; j < sortedGroup.length; j++) {
        const b = sortedGroup[j];

        // Satu record tidak dibandingkan dengan dirinya sendiri.
        if (a.id === b.id) {
          continue;
        }

        // Jika pekerjaan berikutnya dimulai setelah pekerjaan
        // sebelumnya selesai, tidak mungkin ada overlap.
        const bStart = b.startDateTime!.getTime();

        if (bStart >= aEnd) {
          break;
        }

        const bEnd = b.finishDateTime!.getTime();

        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);

        const overlapMs = overlapEnd - overlapStart;

        const overlapMinutes = Math.floor(
          overlapMs / 60000
        );

        if (overlapMinutes <= toleranceMinutes) {
          continue;
        }

        if (!result.has(a.id)) {
          result.set(a.id, []);
        }

        if (!result.has(b.id)) {
          result.set(b.id, []);
        }

        result.get(a.id)!.push({
          otherId: getDisplayWoId(b),
          overlapMinutes,
        });

        result.get(b.id)!.push({
          otherId: getDisplayWoId(a),
          overlapMinutes,
        });
      }
    }
  }

  return result;
}

// ============================================================
// 6. MAIN RULE ENGINE
// ============================================================

export function evaluateRuleBasedValidation(
  records: PreprocessedWorkOrder[],
  config: SOPRuleConfig = DEFAULT_SOP_CONFIG
): PreprocessedWorkOrder[] {
  // ----------------------------------------------------------
  // GLOBAL INDEX
  // ----------------------------------------------------------

  const duplicateIdentities =
    buildDuplicateIdentitySet(records);

  const collisionsByRecordId =
    buildTechnicianCollisionIndex(
      records,
      config.overlapToleranceMinutes
    );

  // ----------------------------------------------------------
  // EVALUATE EACH WORK ORDER
  // ----------------------------------------------------------

  return records.map(item => {
    const violations: RuleViolation[] = [];

    const deviatingFeatures = [
      ...(item.deviatingFeatures || []),
    ];

    const recommendations: string[] = [];

    // ========================================================
    // STATUS CONTEXT
    // ========================================================

    const resultStatus = normalize(item.resultChoice);
    const womStatus = normalize(item.closeStatusWOM);

    const isResultDone = matchesConfiguredStatus(
      item.resultChoice,
      config.doneStatusKeywords
    );

    const isWomDone = matchesConfiguredStatus(
      item.closeStatusWOM,
      config.doneStatusKeywords
    );

    const isResultCancelled = matchesConfiguredStatus(
      item.resultChoice,
      config.cancelledStatusKeywords
    );

    const isWomCancelled = matchesConfiguredStatus(
      item.closeStatusWOM,
      config.cancelledStatusKeywords
    );

    const isPending =
      resultStatus === 'PENDING' ||
      resultStatus === 'IN PROGRESS' ||
      resultStatus === 'WIP';

    const isCancelled =
      isResultCancelled || isWomCancelled;

    const requiresExecutionTime =
      isResultDone || isWomDone;

    // ========================================================
    // R1: EMPTY OR DUPLICATE WO NUMBER
    // ========================================================

    const woIdentity = getWorkOrderIdentity(item);

    const isDuplicate =
      Boolean(woIdentity) &&
      duplicateIdentities.has(woIdentity);

    const isMissingIdentity = !woIdentity;

    if (isMissingIdentity) {
      violations.push(
        createViolation({
          ruleId: 'R1',
          ruleCode: 'RULE_WO_EMPTY_OR_DUPLICATE',
          ruleName: 'Nomor Identitas WO Kosong',
          severity: 'HIGH',
          statusCategory: 'INVALID',
          evidence:
            'OFFERNUM dan WORDER tidak tersedia.',
          description:
            'Nomor identitas Work Order tidak ditemukan pada data.',
          recommendation:
            'Periksa kembali nomor WO pada file sumber WOM.',
          fieldsInvolved: ['OFFERNUM', 'WORDER'],
        })
      );

      recommendations.push(
        'Lengkapi identitas Work Order dari sumber resmi.'
      );
    } else if (isDuplicate || item.isDuplicateId) {
      violations.push(
        createViolation({
          ruleId: 'R1',
          ruleCode: 'RULE_WO_EMPTY_OR_DUPLICATE',
          ruleName: 'Duplikasi Nomor Identitas WO',
          severity: 'HIGH',
          statusCategory: 'INVALID',
          evidence:
            `Identitas WO ${getDisplayWoId(item)} ditemukan lebih dari satu kali.`,
          description:
            'Nomor identitas Work Order tidak unik dalam dataset.',
          recommendation:
            'Periksa kemungkinan duplikasi atau split order pada sistem sumber.',
          fieldsInvolved: ['OFFERNUM', 'WORDER'],
        })
      );

      recommendations.push(
        'Verifikasi nomor WO duplikat sebelum konsolidasi data.'
      );
    }

    // ========================================================
    // R2: START EMPTY
    // ========================================================

    const startMissing =
      isEmpty(item.start) ||
      isZeroTime(item.start);

    if (
      startMissing &&
      requiresExecutionTime &&
      !isCancelled
    ) {
      violations.push(
        createViolation({
          ruleId: 'R2',
          ruleCode: 'RULE_START_EMPTY',
          ruleName: 'Waktu Mulai (START) Kosong',
          severity: 'MEDIUM',
          statusCategory: 'NEEDS_REVIEW',
          evidence:
            `Status pekerjaan selesai, tetapi START bernilai ${item.start || 'KOSONG'}.`,
          description:
            'Pekerjaan dilaporkan selesai tetapi waktu mulai tidak tersedia.',
          recommendation:
            'Periksa log aktivitas teknisi dan riwayat input waktu.',
          fieldsInvolved: ['START', 'start'],
        })
      );

      recommendations.push(
        'Verifikasi waktu mulai pekerjaan dengan teknisi.'
      );
    }

    // ========================================================
    // R3: FINISH EMPTY
    // ========================================================

    const finishMissing =
      isEmpty(item.finish) ||
      isZeroTime(item.finish);

    if (
      finishMissing &&
      requiresExecutionTime &&
      !isCancelled
    ) {
      violations.push(
        createViolation({
          ruleId: 'R3',
          ruleCode: 'RULE_FINISH_EMPTY',
          ruleName: 'Waktu Selesai (FINISH) Kosong',
          severity: 'MEDIUM',
          statusCategory: 'NEEDS_REVIEW',
          evidence:
            `Status pekerjaan selesai, tetapi FINISH bernilai ${item.finish || 'KOSONG'}.`,
          description:
            'Pekerjaan dilaporkan selesai tetapi waktu selesai tidak tersedia.',
          recommendation:
            'Periksa log penutupan tiket dan konfirmasi teknisi.',
          fieldsInvolved: ['FINISH', 'finish'],
        })
      );

      recommendations.push(
        'Verifikasi waktu penyelesaian pekerjaan.'
      );
    }

    // ========================================================
    // R4: FINISH BEFORE START
    // ========================================================

    const recordingWindow = item.recordingWindowMinutes;

    if (
      typeof recordingWindow === 'number' &&
      Number.isFinite(recordingWindow) &&
      recordingWindow < 0
    ) {
      violations.push(
        createViolation({
          ruleId: 'R4',
          ruleCode: 'RULE_FINISH_BEFORE_START',
          ruleName: 'Waktu Selesai Mendahului Waktu Mulai',
          severity: 'HIGH',
          statusCategory: 'INVALID',
          evidence:
            `START ${item.start}, FINISH ${item.finish}, selisih ${recordingWindow} menit.`,
          description:
            'Urutan pencatatan waktu mulai dan selesai tidak konsisten.',
          recommendation:
            'Periksa timestamp asli dan kemungkinan pekerjaan lintas tengah malam.',
          fieldsInvolved: ['START', 'FINISH'],
        })
      );

      deviatingFeatures.push({
        featureName: 'recordingWindowMinutes',
        featureLabel: 'Jendela Waktu FINISH - START',
        observedValue: formatMinutes(recordingWindow),
        benchmarkMedian: '45 - 60 menit',
        benchmarkRange: 'Tidak negatif',
        deviationRatio: 'Inversi Kronologis',
        interpretation:
          'FINISH tercatat lebih awal daripada START.',
      });

      recommendations.push(
        'Verifikasi timestamp asli sebelum menyimpulkan adanya kesalahan pencatatan.'
      );
    }

    // ========================================================
    // R5: UNUSUAL DURATION
    // ========================================================

    const duration = recordingWindow;

    if (
      typeof duration === 'number' &&
      Number.isFinite(duration) &&
      duration >= 0
    ) {
      if (duration === 0) {
        violations.push(
          createViolation({
            ruleId: 'R5',
            ruleCode: 'RULE_UNUSUAL_DURATION',
            ruleName: 'Durasi Pencatatan Nol Menit',
            severity: 'MEDIUM',
            statusCategory: 'NEEDS_REVIEW',
            evidence:
              `START dan FINISH sama: ${item.start}.`,
            description:
              'Durasi tercatat nol menit dan perlu diperiksa.',
            recommendation:
              'Periksa apakah pekerjaan selesai secara administratif atau terdapat kesalahan pencatatan.',
            fieldsInvolved: ['START', 'FINISH'],
          })
        );

        deviatingFeatures.push({
          featureName: 'durationZero',
          featureLabel: 'Durasi Pekerjaan',
          observedValue: '0 menit',
          benchmarkMedian: '45 menit',
          benchmarkRange:
            `${config.minDurationMinutes} - ${config.maxDurationMinutes} menit`,
          deviationRatio: 'Durasi Nol',
          interpretation:
            'Waktu mulai dan selesai identik.',
        });

        recommendations.push(
          'Verifikasi pencatatan waktu pekerjaan berdurasi nol.'
        );
      } else if (
        duration < config.minDurationMinutes
      ) {
        violations.push(
          createViolation({
            ruleId: 'R5',
            ruleCode: 'RULE_UNUSUAL_DURATION',
            ruleName: 'Durasi Pekerjaan Terlalu Singkat',
            severity: 'MEDIUM',
            statusCategory: 'WARNING',
            evidence:
              `Durasi ${duration} menit, batas minimum ${config.minDurationMinutes} menit.`,
            description:
              'Durasi berada di bawah rentang operasional yang dikonfigurasi.',
            recommendation:
              'Verifikasi jenis pekerjaan dan aktivitas teknisi.',
            fieldsInvolved: ['START', 'FINISH'],
          })
        );

        recommendations.push(
          'Periksa kesesuaian durasi dengan jenis pekerjaan.'
        );
      } else if (
        duration > config.maxDurationMinutes
      ) {
        violations.push(
          createViolation({
            ruleId: 'R5',
            ruleCode: 'RULE_UNUSUAL_DURATION',
            ruleName: 'Durasi Pekerjaan Terlalu Lama',
            severity: 'LOW',
            statusCategory: 'WARNING',
            evidence:
              `Durasi ${duration} menit atau ${(duration / 60).toFixed(1)} jam.`,
            description:
              'Durasi melebihi batas maksimum yang dikonfigurasi.',
            recommendation:
              'Periksa kemungkinan pekerjaan tertunda atau tiket terlambat ditutup.',
            fieldsInvolved: ['START', 'FINISH'],
          })
        );

        recommendations.push(
          'Periksa penyebab durasi pekerjaan melebihi batas SOP.'
        );
      }
    }

    // ========================================================
    // R6: SCHEDULE DEVIATION
    // ========================================================

    const scheduleText = normalize(item.schTime);

    const isAnytimeSchedule =
      scheduleText.includes('ANYTIME') ||
      scheduleText.includes('ANY TIME') ||
      scheduleText.includes('BEBAS') ||
      scheduleText.includes('FLEKSIBEL');

    if (
      !isAnytimeSchedule &&
      isValidDate(item.startDateTime) &&
      isValidDate(item.schDateTime) &&
      !isCancelled
    ) {
      const differenceMinutes = Math.round(
        (
          item.startDateTime.getTime() -
          item.schDateTime.getTime()
        ) / 60000
      );

      // Hanya keterlambatan yang diperiksa.
      // Mulai lebih awal tidak dianggap pelanggaran aturan ini.
      if (
        differenceMinutes >
        SCHEDULE_TOLERANCE_MINUTES
      ) {
        violations.push(
          createViolation({
            ruleId: 'R6',
            ruleCode: 'RULE_SCHEDULE_DEVIATION',
            ruleName: 'Penyimpangan Jadwal Pekerjaan',
            severity: 'LOW',
            statusCategory: 'WARNING',
            evidence:
              `Pekerjaan dimulai ${differenceMinutes} menit setelah jadwal.`,
            description:
              'Waktu mulai pekerjaan melewati toleransi jadwal tetap.',
            recommendation:
              'Periksa perubahan jadwal atau kendala operasional.',
            fieldsInvolved: [
              'SCH Date',
              'SCH Time',
              'START',
            ],
          })
        );

        recommendations.push(
          'Konfirmasi keterlambatan dengan catatan dispatch atau supervisor.'
        );
      }
    }

    // ========================================================
    // R7: INVALID DATE AND TIME
    // ========================================================

    if (item.hasInvalidTimestamps) {
      violations.push(
        createViolation({
          ruleId: 'R7',
          ruleCode: 'RULE_INVALID_DATE_TIME_FORMAT',
          ruleName: 'Format Tanggal atau Waktu Tidak Valid',
          severity: 'MEDIUM',
          statusCategory: 'WARNING',
          evidence:
            'Terdapat timestamp yang gagal diparsing.',
          description:
            'Satu atau lebih nilai tanggal atau waktu tidak dapat dibaca dengan format yang valid.',
          recommendation:
            'Periksa format tanggal dan waktu pada file sumber.',
          fieldsInvolved: [
            'SCH Date',
            'SCH Time',
            'START',
            'FINISH',
            'Report Date',
            'Update Date',
            'CloseDate',
          ],
        })
      );

      recommendations.push(
        'Periksa kembali format tanggal dan waktu pada data sumber.'
      );
    }

    // Periksa urutan waktu CloseDate dan Report Date
    // hanya ketika kedua timestamp tersedia dan valid.
    if (
      !item.hasInvalidTimestamps &&
      isValidDate(item.closeDateTime) &&
      isValidDate(item.reportDateTime) &&
      item.closeDateTime.getTime() <
        item.reportDateTime.getTime()
    ) {
      const differenceMinutes = Math.round(
        (
          item.reportDateTime.getTime() -
          item.closeDateTime.getTime()
        ) / 60000
      );

      violations.push(
        createViolation({
          ruleId: 'R7',
          ruleCode: 'RULE_INVALID_DATE_TIME_FORMAT',
          ruleName:
            'Ketidaksinkronan Waktu Penutupan dan Laporan',
          severity: 'MEDIUM',
          statusCategory: 'WARNING',
          evidence:
            `CloseDate lebih awal ${differenceMinutes} menit dari Report Date.`,
          description:
            'Tanggal penutupan tiket tercatat sebelum tanggal pelaporan.',
          recommendation:
            'Periksa alur sinkronisasi data pada sistem WOM.',
          fieldsInvolved: [
            'CloseDate',
            'Report Date',
          ],
        })
      );
    }

    // ========================================================
    // R8: STATUS AND REMARK DISCREPANCY
    // ========================================================

    const hasBothStatuses =
      !isEmpty(item.resultChoice) &&
      !isEmpty(item.closeStatusWOM);

    if (hasBothStatuses) {
      const contradictorySuccessCancel =
        (isResultDone && isWomCancelled) ||
        (isResultCancelled && isWomDone);

      if (contradictorySuccessCancel) {
        violations.push(
          createViolation({
            ruleId: 'R8',
            ruleCode: 'RULE_STATUS_REMARK_DISCREPANCY',
            ruleName:
              'Diskrepansi Status Hasil Lapangan dan WOM',
            severity: 'HIGH',
            statusCategory: 'INVALID',
            evidence:
              `Result Choice: ${item.resultChoice}; Close Status WOM: ${item.closeStatusWOM}.`,
            description:
              'Status hasil lapangan bertentangan dengan status penutupan sistem.',
            recommendation:
              'Verifikasi hasil pekerjaan dan sinkronisasi status pada sistem.',
            fieldsInvolved: [
              'Result Choice',
              'Close Status WOM',
            ],
          })
        );

        deviatingFeatures.push({
          featureName: 'statusDiscrepancy',
          featureLabel: 'Kesesuaian Status',
          observedValue:
            `${item.resultChoice} / ${item.closeStatusWOM}`,
          benchmarkMedian: 'Status konsisten',
          benchmarkRange: 'Tidak bertentangan',
          deviationRatio: 'Status Bertentangan',
          interpretation:
            'Status lapangan dan status WOM berbeda secara substantif.',
        });

        recommendations.push(
          'Verifikasi kesesuaian status pekerjaan pada sistem sumber.'
        );
      }
    }

    // Periksa remark ketika hasil pekerjaan tercatat selesai.
    const remarkText = [
      item.resultRemark,
      item.wipComment,
    ]
      .filter(value => !isEmpty(value))
      .join(' ');

    const matchedKeywords =
      config.contradictoryNegativeKeywords.filter(
        keyword =>
          containsNegativeKeyword(
            remarkText,
            keyword
          )
      );

    if (
      isResultDone &&
      matchedKeywords.length > 0
    ) {
      violations.push(
        createViolation({
          ruleId: 'R8',
          ruleCode: 'RULE_STATUS_REMARK_DISCREPANCY',
          ruleName:
            'Pertentangan Catatan Lapangan dan Status Selesai',
          severity: 'HIGH',
          statusCategory: 'NEEDS_REVIEW',
          evidence:
            `Status ${item.resultChoice}, catatan mengandung kata: ${matchedKeywords.join(', ')}.`,
          description:
            'Catatan pekerjaan mengandung indikasi kendala meskipun status tercatat selesai.',
          recommendation:
            'Periksa konteks catatan dan konfirmasi hasil pekerjaan kepada teknisi atau supervisor.',
          fieldsInvolved: [
            'Result Choice',
            'Result Remark',
            'WIP Comment',
          ],
        })
      );

      recommendations.push(
        'Verifikasi isi remark sebelum menyimpulkan ketidaksesuaian status.'
      );
    }

    // ========================================================
    // R9: INVALID GEOGRAPHIC COORDINATES
    // ========================================================

    const hasCoordinates = hasCoordinateData(item);
    const validCoordinates = hasValidGeoCoordinates(item);

    // Koordinat kosong tidak dianggap invalid.
    if (
      hasCoordinates &&
      !validCoordinates
    ) {
      violations.push(
        createViolation({
          ruleId: 'R9',
          ruleCode: 'RULE_INVALID_GEOGRAPHIC_COORDINATES',
          ruleName: 'Koordinat Geografis Tidak Valid',
          severity: 'MEDIUM',
          statusCategory: 'WARNING',
          evidence:
            `Koordinat tidak valid: ${item.tikorRawString || `${item.latitude ?? '-'}, ${item.longitude ?? '-'}`}.`,
          description:
            'Koordinat yang dicatat tidak dapat digunakan atau berada di luar batas wilayah Indonesia.',
          recommendation:
            'Periksa format, urutan latitude-longitude, dan sumber koordinat Tikor.',
          fieldsInvolved: [
            'Result Remark',
            'LATITUDE',
            'LONGITUDE',
          ],
        })
      );

      recommendations.push(
        'Verifikasi koordinat dari sumber data asli.'
      );
    }

    // ========================================================
    // R10: TECHNICIAN SCHEDULE COLLISION
    // ========================================================

    const collisions =
      collisionsByRecordId.get(item.id);

    if (collisions && collisions.length > 0) {
      const collisionDescription = collisions
        .map(
          collision =>
            `${collision.otherId} (${collision.overlapMinutes} menit)`
        )
        .join(', ');

      const maxOverlap = Math.max(
        ...collisions.map(
          collision => collision.overlapMinutes
        )
      );

      violations.push(
        createViolation({
          ruleId: 'R10',
          ruleCode: 'RULE_TECH_SCHEDULE_COLLISION',
          ruleName: 'Konflik Jadwal Teknisi',
          severity: 'HIGH',
          statusCategory: 'NEEDS_REVIEW',
          evidence:
            `Teknisi ${item.installer} memiliki interval bertumpang tindih dengan WO: ${collisionDescription}.`,
          description:
            'Terdapat indikasi pekerjaan bersamaan pada teknisi yang sama.',
          recommendation:
            'Periksa kemungkinan pekerjaan tandem, penugasan bersama, atau kesalahan pencatatan waktu.',
          fieldsInvolved: [
            'Installer',
            'START',
            'FINISH',
            'SCH Date',
          ],
        })
      );

      deviatingFeatures.push({
        featureName: 'technicianCollision',
        featureLabel: 'Tumpang Tindih Waktu Pengerjaan',
        observedValue: `${maxOverlap} menit`,
        benchmarkMedian: '0 menit',
        benchmarkRange:
          `<= ${config.overlapToleranceMinutes} menit`,
        deviationRatio:
          `${collisions.length} WO bertumpang tindih`,
        interpretation:
          'Terdapat indikasi konflik jadwal teknisi.',
      });

      recommendations.push(
        'Konfirmasi kemungkinan penugasan bersama atau pekerjaan tandem kepada supervisor.'
      );
    }

    // ========================================================
    // COMPOSITE SEVERITY
    // ========================================================

    let compositeSeverity: AnomalySeverity = 'NORMAL';

    const hasHighRule = violations.some(
      violation => violation.severity === 'HIGH'
    );

    const hasMediumRule = violations.some(
      violation => violation.severity === 'MEDIUM'
    );

    const hasLowRule = violations.some(
      violation => violation.severity === 'LOW'
    );

    if (hasHighRule) {
      compositeSeverity = 'HIGH';
    } else if (hasMediumRule) {
      compositeSeverity = 'MEDIUM';
    } else if (hasLowRule) {
      compositeSeverity = 'LOW';
    }

    // ========================================================
    // NEUTRAL INDICATION REASON
    // ========================================================

    let neutralIndicationReason =
      'Tidak ditemukan indikasi pelanggaran aturan operasional berdasarkan data yang tersedia.';

    if (violations.length > 0) {
      neutralIndicationReason =
        `Ditemukan ${violations.length} indikasi yang memerlukan pemeriksaan: ` +
        violations
          .map(violation => violation.ruleName)
          .join('; ') +
        '. Hasil ini merupakan indikasi awal dan bukan bukti pelanggaran.';
    }

    // ========================================================
    // RETURN RECORD
    // ========================================================

    return {
      ...item,

      ruleViolations: violations,

      compositeSeverity,

      deviatingFeatures,

      verificationRecommendations: Array.from(
        new Set(recommendations)
      ),

      neutralIndicationReason,
    };
  });
}
