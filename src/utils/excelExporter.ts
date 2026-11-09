
import * as XLSX from 'xlsx-js-style';
import {
  PreprocessedWorkOrder,
  PreprocessingStats,
  IsolationForestStats,
} from '../types/telco';

// ============================================================
// IMPORT EXCEL / CSV
// ============================================================

export async function parseUploadedFile(
  file: File
): Promise<{
  headers: string[];
  rows: Record<string, any>[];
}> {
  if (!file) {
    throw new Error('File tidak ditemukan.');
  }

  const extension = file.name
    .split('.')
    .pop()
    ?.toLowerCase();

  if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
    throw new Error('Format file harus XLSX, XLS, atau CSV.');
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('File tidak memiliki worksheet.');
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const matrix: any[][] = XLSX.utils.sheet_to_json(
    worksheet,
    {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    }
  );

  if (!matrix || matrix.length < 2) {
    throw new Error('File tidak memiliki data yang dapat dibaca.');
  }

  const rawHeaders = matrix[0].map((value: any) =>
    String(value ?? '').trim()
  );

  const headers: string[] = [];
  const usedHeaders = new Set<string>();

  rawHeaders.forEach((header, index) => {
    let name = header || `COLUMN_${index + 1}`;
    let uniqueName = name;
    let counter = 2;

    while (usedHeaders.has(uniqueName.toLowerCase())) {
      uniqueName = `${name}_${counter}`;
      counter++;
    }

    usedHeaders.add(uniqueName.toLowerCase());
    headers.push(uniqueName);
  });

  const rows: Record<string, any>[] = matrix
    .slice(1)
    .filter((row: any[]) =>
      row.some(value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      )
    )
    .map((row: any[]) => {
      const record: Record<string, any> = {};

      headers.forEach((header, index) => {
        record[header] = row[index] ?? '';
      });

      return record;
    });

  if (rows.length === 0) {
    throw new Error('Tidak ditemukan baris data pada file.');
  }

  return {
    headers,
    rows,
  };
}

// ============================================================
// HELPER EXPORT
// ============================================================

const safeText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const safeNumber = (value: unknown): number | string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : '-';
};

const formatDate = (value: unknown): string => {
  if (!value) return '-';

  const date = value instanceof Date
    ? value
    : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type ExportRecord = PreprocessedWorkOrder & {
  [key: string]: any;
};

const getAnomalyStatus = (record: ExportRecord): string => {
  if (typeof record.isMlAnomaly === 'boolean') {
    return record.isMlAnomaly
      ? 'KANDIDAT ANOMALI'
      : 'NORMAL';
  }

  if (typeof record.is_ml_anomaly === 'boolean') {
    return record.is_ml_anomaly
      ? 'KANDIDAT ANOMALI'
      : 'NORMAL';
  }

  if (typeof record.prediction === 'number') {
    return record.prediction === -1
      ? 'KANDIDAT ANOMALI'
      : 'NORMAL';
  }

  return 'BELUM DIKLASIFIKASIKAN';
};

const getScore = (record: ExportRecord): number | string => {
  return safeNumber(
    record.anomaly_score ??
    record.mlScore ??
    record.anomalyScore
  );
};

const getViolations = (record: ExportRecord): string => {
  const violations = record.ruleViolations ?? [];

  if (!Array.isArray(violations) || violations.length === 0) {
    return 'Tidak ada rule SOP yang terpicu';
  }

  return violations
    .map((item: any) =>
      [
        item.ruleId ?? item.id ?? '',
        item.ruleName ?? item.title ?? '',
        item.description ?? item.message ?? '',
      ]
        .filter(Boolean)
        .join(': ')
    )
    .join(' | ');
};

const getSupervisorStatus = (record: ExportRecord): string => {
  return safeText(
    record.supervisorVerification?.status
  );
};

const getSupervisorNotes = (record: ExportRecord): string => {
  return safeText(
    record.supervisorVerification?.notes
  );
};

// ============================================================
// EXPORT AUDIT REPORT
// ============================================================

export function exportAuditReportToExcel(
  records: PreprocessedWorkOrder[],
  preprocStats: PreprocessingStats,
  mlStats: IsolationForestStats
): void {
  if (!records || records.length === 0) {
    alert('Tidak ada data Work Order untuk diekspor.');
    return;
  }

  const now = new Date();

  const exportRecords = records as ExportRecord[];

  const anomalies = exportRecords.filter(record =>
    getAnomalyStatus(record) === 'KANDIDAT ANOMALI'
  );

  const normal = exportRecords.filter(record =>
    getAnomalyStatus(record) === 'NORMAL'
  );

  const classified = anomalies.length + normal.length;

  // ========================================================
  // DATA WORKSHEET
  // ========================================================

  const rows: any[][] = [
    ['LAPORAN OPERASIONAL WORK ORDER'],
    ['PT. ANUGERAH TERANG PERSADA'],
    [
      'Tanggal Ekspor',
      now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
      }),
    ],
    ['Total Work Order', records.length],
    ['Data Normal', normal.length],
    ['Kandidat Anomali Isolation Forest', anomalies.length],
    ['WO Terklasifikasi', classified],
    ['Kontaminasi Model (%)', mlStats.contaminationRate],
    ['Total Sampel FTTH', preprocStats.ftthCount],
    ['Total Sampel HFC', preprocStats.hfcCount],
    [],
    [
      'NO',
      'OFFERNUM',
      'WORDER',
      'JENIS JARINGAN',
      'CABANG',
      'TEKNISI',
      'TANGGAL JADWAL',
      'JAM JADWAL',
      'START',
      'FINISH',
      'DURASI PENCATATAN (MENIT)',
      'HASIL PEKERJAAN',
      'SKOR ISOLATION FOREST',
      'PREDIKSI MODEL',
      'TINGKAT ANOMALI',
      'SEVERITAS SOP',
      'JUMLAH RULE TERPICU',
      'DETAIL RULE SOP',
      'LATITUDE',
      'LONGITUDE',
      'STATUS VERIFIKASI SUPERVISOR',
      'CATATAN SUPERVISOR',
    ],
  ];

  // ========================================================
  // INSERT WORK ORDER
  // ========================================================

  exportRecords.forEach((record, index) => {
    const anomalyStatus = getAnomalyStatus(record);

    const anomalyLevel =
      record.anomaly_level ??
      (anomalyStatus === 'KANDIDAT ANOMALI'
        ? 'PERLU VERIFIKASI'
        : anomalyStatus === 'NORMAL'
          ? 'NORMAL'
          : 'BELUM DIKLASIFIKASIKAN');

    const violations = record.ruleViolations ?? [];

    rows.push([
      index + 1,
      safeText(record.OFFERNUM),
      safeText(record.WORDER),
      safeText(record.networkType),
      safeText(record.Branch),
      safeText(record.installer),
      formatDate(record.schDate),
      safeText(record.schTime),
      formatDate(record.startDateTime),
      formatDate(record.finishDateTime),
      safeNumber(record.recordingWindowMinutes),
      safeText(record.resultChoice),
      getScore(record),
      anomalyStatus,
      anomalyLevel,
      safeText(record.compositeSeverity),
      violations.length,
      getViolations(record),
      safeNumber(record.latitude),
      safeNumber(record.longitude),
      getSupervisorStatus(record),
      getSupervisorNotes(record),
    ]);
  });

  // ========================================================
  // CREATE WORKSHEET
  // ========================================================

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 7 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 15 },
    { wch: 21 },
    { wch: 21 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 23 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 55 },
    { wch: 15 },
    { wch: 15 },
    { wch: 28 },
    { wch: 45 },
  ];

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 21 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 21 },
    },
  ];

  // ========================================================
  // TITLE STYLE
  // ========================================================

  worksheet['A1'].s = {
    font: {
      bold: true,
      sz: 16,
      color: { rgb: 'FFFFFF' },
    },
    fill: {
      fgColor: { rgb: '172554' },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
  };

  worksheet['A2'].s = {
    font: {
      bold: true,
      sz: 11,
      color: { rgb: 'DBEAFE' },
    },
    fill: {
      fgColor: { rgb: '172554' },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
  };

  // ========================================================
  // SUMMARY STYLE
  // ========================================================

  for (let row = 2; row <= 9; row++) {
    const address = XLSX.utils.encode_cell({
      r: row,
      c: 0,
    });

    if (worksheet[address]) {
      worksheet[address].s = {
        font: {
          bold: true,
          color: { rgb: '334155' },
        },
        fill: {
          fgColor: { rgb: 'EFF6FF' },
        },
        alignment: {
          vertical: 'center',
        },
      };
    }
  }

  // ========================================================
  // TABLE HEADER STYLE
  // ========================================================

  const headerRow = 11;
  const columnCount = 22;

  for (let col = 0; col < columnCount; col++) {
    const address = XLSX.utils.encode_cell({
      r: headerRow,
      c: col,
    });

    if (worksheet[address]) {
      worksheet[address].s = {
        font: {
          bold: true,
          color: { rgb: 'FFFFFF' },
          sz: 10,
        },
        fill: {
          fgColor: { rgb: '1E3A8A' },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: {
            style: 'thin',
            color: { rgb: 'CBD5E1' },
          },
          bottom: {
            style: 'thin',
            color: { rgb: 'CBD5E1' },
          },
          left: {
            style: 'thin',
            color: { rgb: 'CBD5E1' },
          },
          right: {
            style: 'thin',
            color: { rgb: 'CBD5E1' },
          },
        },
      };
    }
  }

  // ========================================================
  // DATA STYLE
  // ========================================================

  const lastRow = rows.length - 1;

  for (let row = headerRow + 1; row <= lastRow; row++) {
    for (let col = 0; col < columnCount; col++) {
      const address = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = worksheet[address];

      if (!cell) continue;

      cell.s = {
        font: {
          color: { rgb: '334155' },
          sz: 10,
        },
        fill: {
          fgColor: {
            rgb: row % 2 === 0
              ? 'F8FAFC'
              : 'FFFFFF',
          },
        },
        alignment: {
          vertical: 'center',
          wrapText: col === 17 || col === 21,
        },
        border: {
          bottom: {
            style: 'thin',
            color: { rgb: 'E2E8F0' },
          },
        },
      };
    }
  }

  // ========================================================
  // ANOMALY HIGHLIGHT
  // ========================================================

  for (let row = headerRow + 1; row <= lastRow; row++) {
    const address = XLSX.utils.encode_cell({
      r: row,
      c: 13,
    });

    const cell = worksheet[address];

    if (!cell) continue;

    if (cell.v === 'KANDIDAT ANOMALI') {
      cell.s = {
        font: {
          bold: true,
          color: { rgb: 'B91C1C' },
        },
        fill: {
          fgColor: { rgb: 'FEE2E2' },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
      };
    }

    if (cell.v === 'NORMAL') {
      cell.s = {
        font: {
          bold: true,
          color: { rgb: '047857' },
        },
        fill: {
          fgColor: { rgb: 'D1FAE5' },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
      };
    }
  }

  // ========================================================
  // FILTER & FREEZE
  // ========================================================

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRow, c: 0 },
      e: { r: lastRow, c: columnCount - 1 },
    }),
  };

  worksheet['!freeze'] = {
    xSplit: 0,
    ySplit: 12,
    topLeftCell: 'A13',
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  // ========================================================
  // CREATE ONE WORKSHEET ONLY
  // ========================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Laporan Operasional'
  );

  const fileDate = now.toISOString().slice(0, 10);

  XLSX.writeFile(
    workbook,
    `Laporan_Operasional_ATP_${fileDate}.xlsx`,
    {
      compression: true,
      cellStyles: true,
    }
  );
}
