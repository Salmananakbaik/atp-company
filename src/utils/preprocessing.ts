
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Work Order preprocessing
 * PT. ANUGERAH TERANG PERSADA
 *
 * Sumber data: Excel/CSV yang diimpor pengguna.
 * Tidak membuat nilai operasional atau koordinat palsu.
 */

import {
  CanonicalWorkOrder,
  PreprocessedWorkOrder,
  PreprocessingStats,
  NetworkType,
  NetworkMappingRule,
} from '../types/telco';

import { extractCoordinates } from './geoUtils';

// ============================================================
// 1. TEXT CLEANING
// ============================================================

export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeader(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  const text = cleanText(value).toLowerCase();

  return [
    '',
    'null',
    'undefined',
    'n/a',
    'na',
    '-',
  ].includes(text);
}

function getFirstValue(
  row: Record<string, any>,
  names: string[]
): unknown {
  const headers = Object.keys(row);

  for (const name of names) {
    if (
      Object.prototype.hasOwnProperty.call(row, name) &&
      !isEmpty(row[name])
    ) {
      return row[name];
    }

    const normalizedName = normalizeHeader(name);

    const actualHeader = headers.find(
      header => normalizeHeader(header) === normalizedName
    );

    if (
      actualHeader !== undefined &&
      !isEmpty(row[actualHeader])
    ) {
      return row[actualHeader];
    }
  }

  return undefined;
}

// ============================================================
// 2. NUMBER AND COORDINATE PARSING
// ============================================================

/**
 * Membaca angka dengan format:
 * -6.227841
 * -6,227841
 * 106.563219
 * 106,563219
 *
 * Catatan:
 * Pemisah desimal koma diubah menjadi titik.
 */

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (isEmpty(value)) return null;

  let text = cleanText(value);

  // Hapus spasi di dalam angka.
  text = text.replace(/\s/g, '');

  // Format koordinat tidak boleh memiliki pemisah ribuan.
  // Koma dianggap sebagai pemisah desimal.
  if (text.includes(',') && !text.includes('.')) {
    text = text.replace(',', '.');
  }

  // Jika titik dan koma muncul bersamaan, jangan menebak.
  if (text.includes(',') && text.includes('.')) {
    return null;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseLatitude(value: unknown): number | undefined {
  const number = parseNumericValue(value);

  if (
    number === null ||
    number < -90 ||
    number > 90
  ) {
    return undefined;
  }

  return number;
}

function parseLongitude(value: unknown): number | undefined {
  const number = parseNumericValue(value);

  if (
    number === null ||
    number < -180 ||
    number > 180
  ) {
    return undefined;
  }

  return number;
}

interface ParsedCoordinates {
  latitude?: number;
  longitude?: number;
  isValid: boolean;
  rawTikor?: string;
}

function readCoordinates(
  row: Record<string, any>,
  getRaw: (
    row: Record<string, any>,
    key: keyof CanonicalWorkOrder,
    aliases?: string[]
  ) => any
): ParsedCoordinates {

  // ----------------------------------------------------------
  // A. Baca kolom koordinat langsung
  // ----------------------------------------------------------

  const rawLatitude = getFirstValue(row, [
    'LATITUDE',
    'LAT',
    'Latitude',
    'latitude',
    'GPS Latitude',
    'GPS_LATITUDE',
  ]) ?? getRaw(row, 'latitude' as keyof CanonicalWorkOrder, [
    'LATITUDE',
    'LAT',
    'Latitude',
  ]);

  const rawLongitude = getFirstValue(row, [
    'LONGITUDE',
    'LONG',
    'Longitude',
    'longitude',
    'LON',
    'GPS Longitude',
    'GPS_LONGITUDE',
  ]) ?? getRaw(row, 'longitude' as keyof CanonicalWorkOrder, [
    'LONGITUDE',
    'LONG',
    'Longitude',
  ]);

  const latitude = parseLatitude(rawLatitude);
  const longitude = parseLongitude(rawLongitude);

  if (
    latitude !== undefined &&
    longitude !== undefined &&
    !(latitude === 0 && longitude === 0)
  ) {
    return {
      latitude,
      longitude,
      isValid: true,
      rawTikor: `${rawLatitude}, ${rawLongitude}`,
    };
  }

  // ----------------------------------------------------------
  // B. Jika kolom koordinat tidak tersedia,
  // coba baca koordinat dari sumber teks yang sudah ada.
  // ----------------------------------------------------------

  try {
    const extracted = extractCoordinates(row);

    if (
      extracted?.isValid &&
      typeof extracted.latitude === 'number' &&
      typeof extracted.longitude === 'number' &&
      Number.isFinite(extracted.latitude) &&
      Number.isFinite(extracted.longitude) &&
      extracted.latitude >= -90 &&
      extracted.latitude <= 90 &&
      extracted.longitude >= -180 &&
      extracted.longitude <= 180 &&
      !(extracted.latitude === 0 && extracted.longitude === 0)
    ) {
      return {
        latitude: extracted.latitude,
        longitude: extracted.longitude,
        isValid: true,
        rawTikor: extracted.rawTikor,
      };
    }

    return {
      isValid: false,
      rawTikor: extracted?.rawTikor,
    };

  } catch (error) {
    console.warn(
      'Gagal membaca koordinat Work Order:',
      error
    );

    return {
      isValid: false,
      rawTikor: undefined,
    };
  }
}

// ============================================================
// 3. STATUS NORMALIZATION
// ============================================================

export function standardizeStatus(value: unknown): string {
  const status = cleanText(value)
    .toUpperCase()
    .replace(/[_-]+/g, ' ');

  if (!status) return '';

  const doneStatuses = [
    'DONE',
    'SUCCESS',
    'SELESAI',
    'SUKSES',
    'OK',
    'COMPLETED',
    'COMPLETE',
    'CLOSE',
    'CLOSED',
  ];

  const cancelledStatuses = [
    'CANCEL',
    'CANCELLED',
    'CANCELED',
    'BATAL',
    'REJECT',
    'REJECTED',
    'DITOLAK',
  ];

  const pendingStatuses = [
    'PENDING',
    'PEND',
    'TERTUNDA',
    'HOLD',
    'DELAY',
    'RESCHEDULE',
  ];

  const failedStatuses = [
    'FAILED',
    'FAIL',
    'GAGAL',
    'ERROR',
    'NOT DONE',
  ];

  const progressStatuses = [
    'IN PROGRESS',
    'WIP',
    'PROGRESS',
    'SEDANG BERJALAN',
    'PROSES',
  ];

  if (doneStatuses.includes(status)) return 'DONE';

  if (cancelledStatuses.includes(status)) return 'CANCELLED';

  if (pendingStatuses.includes(status)) return 'PENDING';

  if (failedStatuses.includes(status)) return 'FAILED';

  if (progressStatuses.includes(status)) return 'IN_PROGRESS';

  return status;
}

// ============================================================
// 4. DATE PARSING
// ============================================================

function validDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): Date | null {

  if (
    year < 1990 ||
    year > 2040 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseDate(raw: unknown): Date | null {
  if (isEmpty(raw)) return null;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  // Excel serial date.
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw < 1 || raw > 100000) return null;

    const milliseconds = Math.round(
      (raw - 25569) * 86400000
    );

    const date = new Date(milliseconds);

    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() < 1990 ||
      date.getUTCFullYear() > 2040
    ) {
      return null;
    }

    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }

  const text = cleanText(raw);

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmy = text.match(
    /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (dmy) {
    return validDate(
      Number(dmy[3]),
      Number(dmy[2]),
      Number(dmy[1]),
      Number(dmy[4] ?? 0),
      Number(dmy[5] ?? 0),
      Number(dmy[6] ?? 0)
    );
  }

  // YYYY-MM-DD, YYYY/MM/DD
  const ymd = text.match(
    /^(\d{4})[/. -](\d{1,2})[/. -](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (ymd) {
    return validDate(
      Number(ymd[1]),
      Number(ymd[2]),
      Number(ymd[3]),
      Number(ymd[4] ?? 0),
      Number(ymd[5] ?? 0),
      Number(ymd[6] ?? 0)
    );
  }

  const timestamp = Date.parse(text);

  if (Number.isNaN(timestamp)) return null;

  const date = new Date(timestamp);

  if (
    date.getFullYear() < 1990 ||
    date.getFullYear() > 2040
  ) {
    return null;
  }

  return date;
}

// ============================================================
// 5. TIME PARSING
// ============================================================

export function parseTime(
  raw: unknown
): { hours: number; minutes: number } | null {

  if (isEmpty(raw)) return null;

  // Excel time fraction.
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw < 0 || raw >= 1) return null;

    const totalMinutes = Math.round(raw * 1440) % 1440;

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  }

  const text = cleanText(raw);

  // Jadwal seperti 09:00-12:00 atau Anytime bukan jam mulai.
  if (/anytime/i.test(text)) return null;

  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (match) {
    let hours = Number(match[1]);

    const minutes = Number(match[2]);

    const ampm = match[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;

    if (ampm === 'AM' && hours === 12) hours = 0;

    if (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      return { hours, minutes };
    }

    return null;
  }

  // Format 0930 atau 1430.
  if (/^\d{4}$/.test(text)) {
    const hours = Number(text.slice(0, 2));

    const minutes = Number(text.slice(2, 4));

    if (hours <= 23 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  return null;
}

// ============================================================
// 6. DATE AND TIME COMBINATION
// ============================================================

export function combineDateAndTime(
  baseDate: Date | null,
  time: { hours: number; minutes: number } | null
): Date | null {

  if (!baseDate || !time) return null;

  const result = new Date(baseDate);

  result.setHours(
    time.hours,
    time.minutes,
    0,
    0
  );

  return result;
}

// ============================================================
// 7. NETWORK CLASSIFICATION
// ============================================================

export function inferNetworkType(
  wo: Partial<CanonicalWorkOrder>,
  adminRules: NetworkMappingRule[] = []
): {
  networkType: NetworkType;
  isConfirmed: boolean;
} {

  for (const rule of adminRules) {
    const value = cleanText(
      wo[rule.field as keyof CanonicalWorkOrder]
    ).toUpperCase();

    if (!value || !rule.pattern) continue;

    if (rule.isRegex) {
      try {
        const regex = new RegExp(rule.pattern, 'i');

        if (regex.test(value)) {
          return {
            networkType: rule.targetNetwork,
            isConfirmed: true,
          };
        }
      } catch {
        continue;
      }
    } else if (
      value.includes(rule.pattern.toUpperCase())
    ) {
      return {
        networkType: rule.targetNetwork,
        isConfirmed: true,
      };
    }
  }

  const market = cleanText(wo.MKTTYPE).toUpperCase();

  const node = cleanText(wo.FIBERNODE).toUpperCase();

  const task = cleanText(wo.jobTask).toUpperCase();

  const ftthIndicators = [
    'FTTH',
    'FIBER',
    'GPON',
  ];

  const hfcIndicators = [
    'HFC',
    'COAX',
    'DOCSIS',
    'CABLE',
  ];

  if (
    ftthIndicators.some(item => market.includes(item)) ||
    node.includes('FTTH') ||
    node.includes('FAT') ||
    node.startsWith('FN-') ||
    task.includes('FTTH') ||
    task.includes('SPLITTER')
  ) {
    return {
      networkType: 'FTTH',
      isConfirmed: false,
    };
  }

  if (
    hfcIndicators.some(item => market.includes(item)) ||
    node.startsWith('HN-') ||
    node.startsWith('HFC-') ||
    node.includes('TAP') ||
    task.includes('AMPLIFIER') ||
    task.includes('HFC')
  ) {
    return {
      networkType: 'HFC',
      isConfirmed: false,
    };
  }

  return {
    networkType: 'Unclassified',
    isConfirmed: false,
  };
}

// ============================================================
// 8. MAIN PREPROCESSING PIPELINE
// ============================================================

export function preprocessWorkOrders(
  rawRecords: Record<string, any>[],
  columnMapping: Record<
    string,
    keyof CanonicalWorkOrder | null
  >,
  adminRules: NetworkMappingRule[] = []
): {
  data: PreprocessedWorkOrder[];
  stats: PreprocessingStats;
} {

  const stats: PreprocessingStats = {
    totalRows: rawRecords.length,
    validRows: 0,
    duplicateKeysCount: 0,
    duplicateRowsCount: 0,
    cleanedWhitespaceCount: 0,
    normalizedStatusCount: 0,
    invalidTimestampsCount: 0,
    missingMandatoryCount: 0,
    ftthCount: 0,
    hfcCount: 0,
    unclassifiedCount: 0,
    columnCount:
      rawRecords.length > 0
        ? Object.keys(rawRecords[0]).length
        : 0,
    geocodedCount: 0,
  };

  // ----------------------------------------------------------
  // Reverse mapping
  // ----------------------------------------------------------

  const invertedMapping: Record<string, string> = {};

  Object.entries(columnMapping).forEach(
    ([rawHeader, canonicalKey]) => {
      if (canonicalKey) {
        invertedMapping[String(canonicalKey)] = rawHeader;
      }
    }
  );

  const offerFrequency: Record<string, number> = {};

  const data: PreprocessedWorkOrder[] = [];

  const getRaw = (
    row: Record<string, any>,
    key: keyof CanonicalWorkOrder,
    aliases: string[] = []
  ): any => {

    const mappedHeader = invertedMapping[String(key)];

    const names = [
      ...(mappedHeader ? [mappedHeader] : []),
      String(key),
      ...aliases,
    ];

    return getFirstValue(row, names);
  };

  // ----------------------------------------------------------
  // Process every source row.
  // Baris identik tidak dihapus otomatis.
  // ----------------------------------------------------------

  rawRecords.forEach((row, index) => {

    try {

      if (!row || typeof row !== 'object') {
        stats.missingMandatoryCount++;
        return;
      }

      const beforeClean = Object.values(row);

      // ------------------------------------------------------
      // Work Order identity
      // ------------------------------------------------------

      const rawOffer = getRaw(row, 'OFFERNUM', [
        'OFFERNUM',
        'Offer Num',
        'Offer Number',
        'Offer Number ID',
      ]);

      const rawWorder = getRaw(row, 'WORDER', [
        'WORDER',
        'Work Order',
        'Work Order Number',
        'WO Number',
        'WO',
      ]);

      const rawCustAcct = getRaw(row, 'CUST_ACCT', [
        'CUST_ACCT',
        'Customer Account',
        'Account Number',
      ]);

      /*
       * Prioritas identitas:
       * 1. OFFERNUM
       * 2. WORDER
       * 3. CUST_ACCT sebagai identitas cadangan
       *
       * CUST_ACCT tidak digunakan sebagai fitur ML.
       */

      const offerNum =
        cleanText(rawOffer) ||
        cleanText(rawWorder) ||
        cleanText(rawCustAcct);

      // Baris tanpa identitas sumber tidak diproses.
      if (!offerNum) {
        stats.missingMandatoryCount++;
        return;
      }

      offerFrequency[offerNum] =
        (offerFrequency[offerNum] || 0) + 1;

      // ------------------------------------------------------
      // Customer data
      // ------------------------------------------------------

      const rawCustName = cleanText(
        getRaw(row, 'Customer_Name', [
          'Customer Name',
          'Customer_Name',
        ])
      );

      const rawAddress = cleanText(
        getRaw(row, 'Address', [
          'Address',
          'Alamat',
        ])
      );

      const rawPhone = cleanText(
        getRaw(row, 'Phone_No', [
          'Phone No',
          'Phone_No',
          'Phone Number',
        ])
      );

      // ------------------------------------------------------
      // Operational fields
      // ------------------------------------------------------

      const siteId = cleanText(
        getRaw(row, 'SITE_ID', ['SITE_ID'])
      );

      const fibernode = cleanText(
        getRaw(row, 'FIBERNODE', ['FIBERNODE'])
      );

      const mktType = cleanText(
        getRaw(row, 'MKTTYPE', ['MKTTYPE'])
      );

      const jobType = cleanText(
        getRaw(row, 'jobType', [
          'Job Type',
          'job_type',
        ])
      );

      const jobTask = cleanText(
        getRaw(row, 'jobTask', [
          'Job Task',
          'job_task',
        ])
      );

      const installer = cleanText(
        getRaw(row, 'installer', ['Installer'])
      );

      const contractor = cleanText(
        getRaw(row, 'contractor', ['Contractor'])
      );

      // ------------------------------------------------------
      // Status
      // ------------------------------------------------------

      const rawCloseStatus = getRaw(
        row,
        'closeStatusWOM',
        [
          'Close Status WOM',
          'Close_Status_WOM',
        ]
      );

      const rawResultChoice = getRaw(
        row,
        'resultChoice',
        [
          'Result Choice',
          'Result_Choice',
        ]
      );

      const closeStatusWOM =
        standardizeStatus(rawCloseStatus);

      const resultChoice =
        standardizeStatus(rawResultChoice);

      if (
        cleanText(rawCloseStatus) !== closeStatusWOM ||
        cleanText(rawResultChoice) !== resultChoice
      ) {
        stats.normalizedStatusCount++;
      }

      const resultRemark = cleanText(
        getRaw(row, 'resultRemark', [
          'Result Remark',
        ])
      );

      const wipComment = cleanText(
        getRaw(row, 'wipComment', [
          'WIP Comment',
        ])
      );

      const reportBy = cleanText(
        getRaw(row, 'reportBy', [
          'Report By',
        ])
      );

      const updateBy = cleanText(
        getRaw(row, 'updateBy', [
          'Update By',
        ])
      );

      // ------------------------------------------------------
      // Dates and times
      // ------------------------------------------------------

      const schDateRaw = getRaw(
        row,
        'schDate',
        ['SCH Date']
      );

      const schTimeRaw = getRaw(
        row,
        'schTime',
        ['SCH Time']
      );

      const startRaw = getRaw(
        row,
        'start',
        ['START']
      );

      const finishRaw = getRaw(
        row,
        'finish',
        ['FINISH']
      );

      const reportDateRaw = getRaw(
        row,
        'reportDate',
        ['Report Date']
      );

      const updateDateRaw = getRaw(
        row,
        'updateDate',
        ['Update Date']
      );

      const closeDateRaw = getRaw(
        row,
        'closeDate',
        ['CloseDate', 'Close Date']
      );

      const schDateParsed = parseDate(schDateRaw);

      const schTimeParsed = parseTime(schTimeRaw);

      const startTimeParsed = parseTime(startRaw);

      const finishTimeParsed = parseTime(finishRaw);

      const reportDateParsed = parseDate(reportDateRaw);

      const updateDateParsed = parseDate(updateDateRaw);

      const closeDateParsed = parseDate(closeDateRaw);

      // ------------------------------------------------------
      // Timestamp validation
      // ------------------------------------------------------

      const dateFields = [
        [schDateRaw, schDateParsed],
        [reportDateRaw, reportDateParsed],
        [updateDateRaw, updateDateParsed],
        [closeDateRaw, closeDateParsed],
      ];

      const hasInvalidTimestamps = dateFields.some(
        ([raw, parsed]) =>
          !isEmpty(raw) && parsed === null
      );

      if (hasInvalidTimestamps) {
        stats.invalidTimestampsCount++;
      }

      const missingMandatory: string[] = [];

      if (!schDateParsed && !isEmpty(schDateRaw)) {
        missingMandatory.push('SCH Date tidak valid');
      }

      if (!isEmpty(startRaw) && !startTimeParsed) {
        missingMandatory.push('START tidak valid');
      }

      if (!isEmpty(finishRaw) && !finishTimeParsed) {
        missingMandatory.push('FINISH tidak valid');
      }

      if (missingMandatory.length > 0) {
        stats.missingMandatoryCount++;
      }

      // ------------------------------------------------------
      // Date-time combination
      // ------------------------------------------------------

      const schDateTime = combineDateAndTime(
        schDateParsed,
        schTimeParsed
      );

      const startDateTime = combineDateAndTime(
        schDateParsed,
        startTimeParsed
      );

      let finishDateTime = combineDateAndTime(
        schDateParsed,
        finishTimeParsed
      );

      // Possible midnight rollover.
      if (
        startDateTime &&
        finishDateTime &&
        finishDateTime.getTime() < startDateTime.getTime()
      ) {
        finishDateTime = new Date(
          finishDateTime.getTime() + 86400000
        );
      }

      let recordingWindowMinutes: number | null = null;

      if (startDateTime && finishDateTime) {
        recordingWindowMinutes = Math.round(
          (
            finishDateTime.getTime() -
            startDateTime.getTime()
          ) / 60000
        );
      }

      let schToReportHours: number | null = null;

      if (schDateTime && reportDateParsed) {
        schToReportHours =
          Math.round(
            (
              reportDateParsed.getTime() -
              schDateTime.getTime()
            ) / 360000
          ) / 10;
      }

      let reportToUpdateMinutes: number | null = null;

      if (reportDateParsed && updateDateParsed) {
        reportToUpdateMinutes = Math.round(
          (
            updateDateParsed.getTime() -
            reportDateParsed.getTime()
          ) / 60000
        );
      }

      let reportToCloseMinutes: number | null = null;

      if (reportDateParsed && closeDateParsed) {
        reportToCloseMinutes = Math.round(
          (
            closeDateParsed.getTime() -
            reportDateParsed.getTime()
          ) / 60000
        );
      }

      let schToCloseDays: number | null = null;

      if (schDateTime && closeDateParsed) {
        schToCloseDays =
          Math.round(
            (
              closeDateParsed.getTime() -
              schDateTime.getTime()
            ) / 86400000 * 10
          ) / 10;
      }

      // ------------------------------------------------------
      // Network classification
      // ------------------------------------------------------

      const explicitNetwork = cleanText(
        getRaw(row, 'Jenis_Jaringan', [
          'Jenis Jaringan',
          'JENIS JARINGAN',
          'Jenis_Jaringan',
          'Network Type',
        ])
      ).toUpperCase();

      let networkType: NetworkType;

      if (explicitNetwork === 'FTTH') {
        networkType = 'FTTH';
      } else if (explicitNetwork === 'HFC') {
        networkType = 'HFC';
      } else {
        const inferred = inferNetworkType(
          {
            MKTTYPE: mktType,
            FIBERNODE: fibernode,
            SITE_ID: siteId,
            jobTask,
          },
          adminRules
        );

        networkType = inferred.networkType;
      }

      if (networkType === 'FTTH') {
        stats.ftthCount++;
      } else if (networkType === 'HFC') {
        stats.hfcCount++;
      } else {
        stats.unclassifiedCount++;
      }

      // ------------------------------------------------------
      // Coordinates
      // ------------------------------------------------------

      const geo = readCoordinates(row, getRaw);

      if (geo.isValid) {
        stats.geocodedCount++;
      }

      // ------------------------------------------------------
      // Additional operational fields
      // ------------------------------------------------------

      const branch = cleanText(
        getRaw(row, 'Branch', [
          'Branch',
          'BRANCH',
          'Cabang',
        ])
      );

      const routing = cleanText(
        getRaw(row, 'Routing', ['Routing'])
      );

      const statGd = cleanText(
        getRaw(row, 'Stat_GD', [
          'Stat GD',
          'Stat_GD',
        ])
      );

      const statGt = cleanText(
        getRaw(row, 'STAT_GT', [
          'STAT_GT',
          'Stat GT',
          'Stat_GT',
        ])
      );

      const statGc = cleanText(
        getRaw(row, 'Stat_GC', [
          'Stat GC',
          'Stat_GC',
        ])
      );

      const confirmationStatus = cleanText(
        getRaw(row, 'Confirmation_Status', [
          'Confirmation Status',
          'Confirmation_Status',
        ])
      );

      const monitoringRemark = cleanText(
        getRaw(row, 'monitoring_Remark', [
          'monitoring Remark',
          'monitoring_Remark',
        ])
      );

      // ------------------------------------------------------
      // Whitespace statistics
      // ------------------------------------------------------

      if (
        beforeClean.some(value =>
          typeof value === 'string' &&
          value !== value.trim()
        )
      ) {
        stats.cleanedWhitespaceCount++;
      }

      // ------------------------------------------------------
      // Create canonical Work Order
      // ------------------------------------------------------

      const item: PreprocessedWorkOrder = {

        id: `row-${index}-${offerNum}`,

        originalRowIndex: index,

        OFFERNUM: offerNum,

        WORDER: cleanText(rawWorder),

        CUST_ACCT: cleanText(rawCustAcct),

        Customer_Name: rawCustName,

        Address: rawAddress,

        Phone_No: rawPhone,

        SITE_ID: siteId,

        FIBERNODE: fibernode,

        MKTTYPE: mktType,

        Jenis_Jaringan: networkType,

        Branch: branch,

        Routing: routing,

        Stat_GD: statGd,

        STAT_GT: statGt,

        Stat_GC: statGc,

        Confirmation_Status: confirmationStatus,

        monitoring_Remark: monitoringRemark,

        networkType,

        jobType,

        jobTask,

        installer,

        Installer: installer,

        contractor,

        Contractor: contractor,

        SCH_Date: schDateParsed
          ? schDateParsed.toISOString().slice(0, 10)
          : cleanText(schDateRaw),

        SCH_Time: cleanText(schTimeRaw),

        START: cleanText(startRaw),

        FINISH: cleanText(finishRaw),

        Report_Date: cleanText(reportDateRaw),

        Report_By: reportBy,

        Update_Date: cleanText(updateDateRaw),

        Update_By: updateBy,

        CloseDate: cleanText(closeDateRaw),

        Close_Status_WOM: closeStatusWOM,

        Result_Choice: resultChoice,

        Result_Remark: resultRemark,

        WIP_Comment: wipComment,

        schDate: schDateParsed
          ? schDateParsed.toISOString().slice(0, 10)
          : cleanText(schDateRaw),

        schTime: schTimeParsed
          ? `${String(schTimeParsed.hours).padStart(2, '0')}:${String(schTimeParsed.minutes).padStart(2, '0')}`
          : cleanText(schTimeRaw),

        start: startTimeParsed
          ? `${String(startTimeParsed.hours).padStart(2, '0')}:${String(startTimeParsed.minutes).padStart(2, '0')}`
          : cleanText(startRaw),

        finish: finishTimeParsed
          ? `${String(finishTimeParsed.hours).padStart(2, '0')}:${String(finishTimeParsed.minutes).padStart(2, '0')}`
          : cleanText(finishRaw),

        reportDate: reportDateParsed
          ? reportDateParsed.toISOString()
          : cleanText(reportDateRaw),

        reportBy,

        updateDate: updateDateParsed
          ? updateDateParsed.toISOString()
          : cleanText(updateDateRaw),

        updateBy,

        closeDate: closeDateParsed
          ? closeDateParsed.toISOString()
          : cleanText(closeDateRaw),

        closeStatusWOM,

        resultChoice,

        resultRemark,

        wipComment,

        rawFields: row,

        schDateTime,

        startDateTime,

        finishDateTime,

        reportDateTime: reportDateParsed,

        updateDateTime: updateDateParsed,

        closeDateTime: closeDateParsed,

        recordingWindowMinutes,

        schToReportHours,

        reportToUpdateMinutes,

        reportToCloseMinutes,

        schToCloseDays,

        techDailyJobCount: 1,

        techDailySequence: 1,

        reportHour: reportDateParsed
          ? reportDateParsed.getHours()
          : null,

        batchReportWindowCount: 1,

        latitude: geo.latitude,

        longitude: geo.longitude,

        hasValidGeoCoord: geo.isValid,

        tikorRawString: geo.rawTikor,

        ruleViolations: [],

        mlScore: 0,

        isMlAnomaly: false,

        mlTreePathLength: 0,

        compositeSeverity: 'NORMAL',

        checkType: 'RULE_BASED',

        deviatingFeatures: [],

        verificationRecommendations: [],

        neutralIndicationReason: '',

        supervisorVerification: {
          status: 'UNREVIEWED',
          notes: '',
        },

        missingMandatoryFields: missingMandatory,

        hasInvalidTimestamps,

        isDuplicateId: false,
      };

      data.push(item);

    } catch (error) {

      // Kesalahan satu baris tidak menghentikan seluruh import.
      console.error(
        `Gagal memproses baris Excel nomor ${index + 1}:`,
        error,
        row
      );

      stats.missingMandatoryCount++;
    }
  });

  // ==========================================================
  // 9. DUPLICATE WORK ORDER ID
  // ==========================================================

  for (const item of data) {

    if (offerFrequency[item.OFFERNUM] > 1) {
      item.isDuplicateId = true;
      stats.duplicateKeysCount++;
    }
  }

  // ==========================================================
  // 10. TECHNICIAN DAILY VOLUME AND SEQUENCE
  // ==========================================================

  const techGroups = new Map<
    string,
    PreprocessedWorkOrder[]
  >();

  const reporterGroups = new Map<
    string,
    PreprocessedWorkOrder[]
  >();

  for (const item of data) {

    if (item.installer && item.schDate) {

      const key = `${item.installer}_${item.schDate}`;

      if (!techGroups.has(key)) {
        techGroups.set(key, []);
      }

      techGroups.get(key)!.push(item);
    }

    if (item.reportDateTime && item.reportBy) {

      const bucket = Math.floor(
        item.reportDateTime.getTime() / 180000
      );

      const key = `${item.reportBy}_${bucket}`;

      if (!reporterGroups.has(key)) {
        reporterGroups.set(key, []);
      }

      reporterGroups.get(key)!.push(item);
    }
  }

  for (const group of techGroups.values()) {

    group.sort((a, b) => {
      const aTime = a.startDateTime?.getTime() ?? 0;
      const bTime = b.startDateTime?.getTime() ?? 0;

      return aTime - bTime;
    });

    group.forEach((item, index) => {
      item.techDailyJobCount = group.length;
      item.techDailySequence = index + 1;
    });
  }

  for (const group of reporterGroups.values()) {

    group.forEach(item => {
      item.batchReportWindowCount = group.length;
    });
  }

  // ==========================================================
  // 11. FINAL STATISTICS
  // ==========================================================

  stats.validRows = data.length;

  return {
    data,
    stats,
  };
}
