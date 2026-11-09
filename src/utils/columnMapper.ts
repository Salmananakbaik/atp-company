
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Column Mapper
 * Fungsi:
 * 1. Memetakan header Excel/CSV ke struktur CanonicalWorkOrder.
 * 2. Mendukung format nama kolom yang berbeda.
 * 3. Mendukung koordinat LATITUDE dan LONGITUDE.
 * 4. Melindungi data pribadi pelanggan.
 * 5. Memvalidasi keunikan OFFERNUM.
 */

import {
  ColumnMappingDefinition,
  CanonicalWorkOrder,
} from '../types/telco';

/**
 * ============================================================
 * 1. STANDARD COLUMN DEFINITIONS
 * ============================================================
 *
 * isMandatory digunakan sebagai informasi kebutuhan kolom.
 * Kolom yang tidak tersedia tidak otomatis menyebabkan seluruh
 * proses impor gagal.
 *
 * OFFERNUM dan WORDER merupakan identitas WO.
 * CUST_ACCT merupakan data akun pelanggan, bukan ID WO.
 */

export const STANDARD_COLUMN_DEFINITIONS: ColumnMappingDefinition[] = [
  // ----------------------------------------------------------
  // IDENTITY
  // ----------------------------------------------------------
  {
    canonicalKey: 'OFFERNUM',
    label: 'OFFERNUM (Primary Business Key)',
    category: 'identity',
    description: 'Nomor order atau penawaran sebagai kandidat identitas WO.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'offernum',
      'offer_num',
      'offer number',
      'no_offer',
      'order_id',
      'id_wo',
      'nomor order',
      'nomor wo',
      'wo id',
    ],
  },
  {
    canonicalKey: 'WORDER',
    label: 'WORDER (Work Order ID)',
    category: 'identity',
    description: 'Kode identifikasi tiket Work Order.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'worder',
      'wo_number',
      'no_worder',
      'tiket_id',
      'ticket id',
      'work order',
      'workorder',
      'work order number',
    ],
  },

  // ----------------------------------------------------------
  // CUSTOMER DATA - PROTECTED
  // ----------------------------------------------------------
  {
    canonicalKey: 'CUST_ACCT',
    label: 'CUST_ACCT (Protected)',
    category: 'protected_customer',
    description:
      'Nomor akun pelanggan. Tidak boleh digunakan sebagai fitur Isolation Forest.',
    isMandatory: false,
    isProtectedCustomerData: true,
    aliases: [
      'cust_acct',
      'cust acct',
      'customer_account',
      'customer account',
      'account_id',
      'no_pelanggan',
      'id_pelanggan',
      'customer_no',
      'cust id',
    ],
  },
  {
    canonicalKey: 'Customer_Name',
    label: 'Customer Name (Protected)',
    category: 'protected_customer',
    description:
      'Nama pelanggan. Data dilindungi dan harus dimasker pada laporan.',
    isMandatory: false,
    isProtectedCustomerData: true,
    aliases: [
      'customer_name',
      'customer name',
      'nama_pelanggan',
      'nama customer',
      'cust_name',
      'client_name',
    ],
  },
  {
    canonicalKey: 'Address',
    label: 'Address (Protected)',
    category: 'protected_customer',
    description:
      'Alamat instalasi pelanggan. Tidak boleh digunakan sebagai fitur ML.',
    isMandatory: false,
    isProtectedCustomerData: true,
    aliases: [
      'address',
      'alamat',
      'installation_address',
      'cust_address',
      'lokasi_instalasi',
      'alamat_pelanggan',
    ],
  },
  {
    canonicalKey: 'Phone_No',
    label: 'Phone No (Protected)',
    category: 'protected_customer',
    description:
      'Nomor telepon pelanggan. Data dilindungi.',
    isMandatory: false,
    isProtectedCustomerData: true,
    aliases: [
      'phone_no',
      'phone',
      'telepon',
      'no_hp',
      'no_telp',
      'mobile_phone',
      'contact_no',
    ],
  },

  // ----------------------------------------------------------
  // NETWORK
  // ----------------------------------------------------------
  {
    canonicalKey: 'SITE_ID',
    label: 'SITE_ID',
    category: 'network',
    description:
      'Kode Site atau Node. Diperlakukan sebagai kategori, bukan angka kontinu.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'site_id',
      'site id',
      'id_site',
      'site code',
      'cluster_id',
      'area_id',
    ],
  },
  {
    canonicalKey: 'FIBERNODE',
    label: 'FIBERNODE',
    category: 'network',
    description: 'Kode atau nama node fiber optik.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'fibernode',
      'fiber node',
      'fn_code',
      'node_id',
      'hub_node',
    ],
  },
  {
    canonicalKey: 'MKTTYPE',
    label: 'MKTTYPE',
    category: 'network',
    description: 'Segmen pasar atau tipe jaringan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'mkttype',
      'mkt_type',
      'market type',
      'tipe_pasar',
      'network_tech',
      'segmen',
    ],
  },
  {
    canonicalKey: 'Jenis_Jaringan',
    label: 'Jenis Jaringan (FTTH / HFC)',
    category: 'network',
    description: 'Klasifikasi teknologi jaringan fisik.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'jenis jaringan',
      'jenis_jaringan',
      'network_type',
      'tipe_jaringan',
      'teknologi',
      'network type',
    ],
  },

  // ----------------------------------------------------------
  // GPS COORDINATES
  // ----------------------------------------------------------
  {
    canonicalKey: 'latitude',
    label: 'LATITUDE (GPS)',
    category: 'network',
    description:
      'Koordinat lintang lokasi pekerjaan. Nilai harus berada pada rentang -90 sampai 90.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'latitude',
      'lat',
      'gps_latitude',
      'gps latitude',
      'gps_lat',
      'koordinat_latitude',
      'koordinat_lat',
      'titik_latitude',
    ],
  },
  {
    canonicalKey: 'longitude',
    label: 'LONGITUDE (GPS)',
    category: 'network',
    description:
      'Koordinat bujur lokasi pekerjaan. Nilai harus berada pada rentang -180 sampai 180.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'longitude',
      'long',
      'lon',
      'lng',
      'gps_longitude',
      'gps longitude',
      'gps_lon',
      'koordinat_longitude',
      'koordinat_lon',
      'titik_longitude',
    ],
  },

  // ----------------------------------------------------------
  // OPERATIONAL
  // ----------------------------------------------------------
  {
    canonicalKey: 'jobType',
    label: 'Job Type',
    category: 'operational',
    description: 'Jenis aktivitas pekerjaan teknisi.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'job type',
      'job_type',
      'tipe_pekerjaan',
      'jenis_pekerjaan',
      'activity_type',
    ],
  },
  {
    canonicalKey: 'jobTask',
    label: 'Job Task',
    category: 'operational',
    description: 'Rincian tugas teknis pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'job task',
      'job_task',
      'tugas',
      'task_description',
      'rincian_tugas',
      'task_name',
    ],
  },
  {
    canonicalKey: 'installer',
    label: 'Installer',
    category: 'operational',
    description: 'Teknisi pelaksana pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'installer',
      'teknisi',
      'technician',
      'nama_teknisi',
      'installer_name',
      'field_engineer',
    ],
  },
  {
    canonicalKey: 'contractor',
    label: 'Contractor',
    category: 'operational',
    description: 'Mitra atau vendor pelaksana pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'contractor',
      'vendor',
      'mitra',
      'subcon',
      'nama_vendor',
      'partner',
    ],
  },
  {
    canonicalKey: 'Branch',
    label: 'Branch',
    category: 'operational',
    description: 'Wilayah atau kantor cabang operasional.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'branch',
      'cabang',
      'kantor_cabang',
      'area_operasional',
      'witel',
      'sto',
    ],
  },
  {
    canonicalKey: 'Routing',
    label: 'Routing',
    category: 'operational',
    description: 'Jalur penugasan atau dispatch pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'routing',
      'jalur',
      'dispatch_route',
      'rute',
    ],
  },
  {
    canonicalKey: 'Stat_GD',
    label: 'Stat GD',
    category: 'operational',
    description: 'Status General Dispatch.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'stat gd',
      'stat_gd',
      'status_gd',
    ],
  },
  {
    canonicalKey: 'STAT_GT',
    label: 'STAT_GT',
    category: 'operational',
    description: 'Status Group Technician.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'stat gt',
      'stat_gt',
      'status_gt',
    ],
  },
  {
    canonicalKey: 'Stat_GC',
    label: 'Stat GC',
    category: 'operational',
    description: 'Status General Close.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'stat gc',
      'stat_gc',
      'status_gc',
    ],
  },
  {
    canonicalKey: 'Confirmation_Status',
    label: 'Confirmation Status',
    category: 'operational',
    description: 'Status konfirmasi pelanggan atau dispatch.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'confirmation status',
      'confirmation_status',
      'konfirmasi_pelanggan',
    ],
  },
  {
    canonicalKey: 'monitoring_Remark',
    label: 'Monitoring Remark',
    category: 'operational',
    description: 'Catatan tim monitoring atau NOC.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'monitoring remark',
      'monitoring_remark',
      'catatan_noc',
      'noc_remark',
    ],
  },

  // ----------------------------------------------------------
  // TIMESTAMPS
  // ----------------------------------------------------------
  {
    canonicalKey: 'schDate',
    label: 'SCH Date',
    category: 'timestamps',
    description: 'Tanggal jadwal pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'sch date',
      'sch_date',
      'schedule_date',
      'tgl_jadwal',
      'appointment_date',
      'scheduled_date',
    ],
  },
  {
    canonicalKey: 'schTime',
    label: 'SCH Time',
    category: 'timestamps',
    description: 'Slot waktu jadwal pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'sch time',
      'sch_time',
      'schedule_time',
      'jam_jadwal',
      'appointment_time',
      'time_slot',
    ],
  },
  {
    canonicalKey: 'start',
    label: 'START',
    category: 'timestamps',
    description: 'Waktu mulai aktivitas pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'start',
      'jam_mulai',
      'time_start',
      'waktu_mulai',
      'actual_start',
    ],
  },
  {
    canonicalKey: 'finish',
    label: 'FINISH',
    category: 'timestamps',
    description: 'Waktu selesai aktivitas pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'finish',
      'jam_selesai',
      'time_finish',
      'waktu_selesai',
      'actual_finish',
      'end',
    ],
  },
  {
    canonicalKey: 'reportDate',
    label: 'Report Date',
    category: 'timestamps',
    description: 'Tanggal atau waktu pelaporan pekerjaan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'report date',
      'report_date',
      'tgl_laporan',
      'waktu_lapor',
      'reported_date',
      'reported_at',
    ],
  },
  {
    canonicalKey: 'reportBy',
    label: 'Report By',
    category: 'operational',
    description: 'Identitas pembuat laporan.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'report by',
      'report_by',
      'pelapor',
      'reported_by',
      'created_by',
    ],
  },
  {
    canonicalKey: 'updateDate',
    label: 'Update Date',
    category: 'timestamps',
    description: 'Waktu pembaruan data terakhir.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'update date',
      'update_date',
      'tgl_update',
      'waktu_update',
      'last_updated',
      'modified_date',
    ],
  },
  {
    canonicalKey: 'updateBy',
    label: 'Update By',
    category: 'operational',
    description: 'Identitas pengguna yang memperbarui data.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'update by',
      'update_by',
      'diupdate_oleh',
      'updated_by',
      'modified_by',
    ],
  },
  {
    canonicalKey: 'closeDate',
    label: 'CloseDate',
    category: 'timestamps',
    description: 'Waktu penutupan resmi tiket WO.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'closedate',
      'close_date',
      'close date',
      'tgl_tutup',
      'waktu_selesai_wo',
      'resolved_date',
    ],
  },

  // ----------------------------------------------------------
  // WORK ORDER STATUS AND RESULTS
  // ----------------------------------------------------------
  {
    canonicalKey: 'closeStatusWOM',
    label: 'Close Status WOM',
    category: 'operational',
    description: 'Status penutupan tiket pada sistem WOM.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'close status wom',
      'close_status_wom',
      'status_wom',
      'wom_status',
      'ticket_status',
    ],
  },
  {
    canonicalKey: 'resultChoice',
    label: 'Result Choice',
    category: 'operational',
    description: 'Pilihan hasil pekerjaan teknisi.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'result choice',
      'result_choice',
      'hasil',
      'work_result',
      'status_hasil',
      'disposition',
    ],
  },
  {
    canonicalKey: 'resultRemark',
    label: 'Result Remark',
    category: 'operational',
    description: 'Catatan hasil pekerjaan teknisi.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'result remark',
      'result_remark',
      'catatan_hasil',
      'keterangan_hasil',
      'closing_remark',
    ],
  },
  {
    canonicalKey: 'wipComment',
    label: 'WIP Comment',
    category: 'operational',
    description: 'Komentar proses pengerjaan Work In Progress.',
    isMandatory: false,
    isProtectedCustomerData: false,
    aliases: [
      'wip comment',
      'wip_comment',
      'komentar_wip',
      'wip_notes',
      'kendala_lapangan',
      'work_notes',
    ],
  },
];

/**
 * ============================================================
 * 2. HEADER NORMALIZATION
 * ============================================================
 *
 * Mengubah nama header menjadi bentuk standar.
 *
 * Contoh:
 * "Jenis Jaringan" -> "jenisjaringan"
 * "LATITUDE"       -> "latitude"
 * "SCH_Date"       -> "schdate"
 */

function normalizeHeaderName(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * ============================================================
 * 3. AUTOMATIC COLUMN MAPPING
 * ============================================================
 *
 * Pencocokan dilakukan melalui:
 * 1. Nama canonical key.
 * 2. Alias yang telah ditentukan.
 *
 * Tidak menggunakan pencocokan substring bebas karena dapat
 * menyebabkan kolom salah dipetakan.
 */

export function autoMapColumns(
  rawHeaders: string[]
): Record<string, keyof CanonicalWorkOrder | null> {
  const mapping: Record<
    string,
    keyof CanonicalWorkOrder | null
  > = {};

  const matchedCanonicalKeys = new Set<
    keyof CanonicalWorkOrder
  >();

  const definitions = STANDARD_COLUMN_DEFINITIONS;

  // Membuat indeks nama header untuk pencocokan yang lebih cepat.
  const headerLookup = new Map<
    string,
    keyof CanonicalWorkOrder
  >();

  for (const definition of definitions) {
    const canonical = definition.canonicalKey;

    const canonicalNormalized =
      normalizeHeaderName(canonical);

    if (canonicalNormalized) {
      headerLookup.set(
        canonicalNormalized,
        canonical
      );
    }

    for (const alias of definition.aliases) {
      const aliasNormalized =
        normalizeHeaderName(alias);

      if (
        aliasNormalized &&
        !headerLookup.has(aliasNormalized)
      ) {
        headerLookup.set(
          aliasNormalized,
          canonical
        );
      }
    }
  }

  // Tahap pertama: exact match.
  for (const rawHeader of rawHeaders) {
    const normalized =
      normalizeHeaderName(rawHeader);

    if (!normalized) {
      mapping[rawHeader] = null;
      continue;
    }

    const matchedKey =
      headerLookup.get(normalized);

    if (
      matchedKey &&
      !matchedCanonicalKeys.has(matchedKey)
    ) {
      mapping[rawHeader] = matchedKey;
      matchedCanonicalKeys.add(matchedKey);
    } else {
      mapping[rawHeader] = null;
    }
  }

  return mapping;
}

/**
 * ============================================================
 * 4. COLUMN MAPPING VALIDATION
 * ============================================================
 *
 * Menghasilkan informasi kolom yang berhasil dan belum
 * berhasil dipetakan.
 */

export interface ColumnMappingValidation {
  totalColumns: number;
  mappedColumns: number;
  unmappedColumns: number;
  protectedColumns: string[];
  coordinateColumns: string[];
  missingRecommendedColumns: string[];
  isCoordinateMappingAvailable: boolean;
}

export function validateColumnMapping(
  mapping: Record<string, keyof CanonicalWorkOrder | null>
): ColumnMappingValidation {
  const mappedValues = Object.values(mapping).filter(
    (value): value is keyof CanonicalWorkOrder =>
      value !== null
  );

  const mappedSet = new Set(mappedValues);

  const protectedColumns = STANDARD_COLUMN_DEFINITIONS
    .filter(
      definition =>
        definition.isProtectedCustomerData &&
        mappedSet.has(definition.canonicalKey)
    )
    .map(definition => String(definition.canonicalKey));

  const coordinateColumns = [
    'latitude',
    'longitude',
  ].filter(key =>
    mappedValues.some(value => String(value) === key)
  );

  const recommendedKeys: (keyof CanonicalWorkOrder)[] = [
    'OFFERNUM',
    'WORDER',
    'jobType',
    'installer',
    'schDate',
    'start',
    'finish',
    'resultChoice',
    'Jenis_Jaringan',
  ];

  const missingRecommendedColumns =
    recommendedKeys
      .filter(key => !mappedSet.has(key))
      .map(key => String(key));

  return {
    totalColumns: Object.keys(mapping).length,
    mappedColumns: mappedValues.length,
    unmappedColumns:
      Object.keys(mapping).length - mappedValues.length,
    protectedColumns,
    coordinateColumns,
    missingRecommendedColumns,
    isCoordinateMappingAvailable:
      coordinateColumns.includes('latitude') &&
      coordinateColumns.includes('longitude'),
  };
}

/**
 * ============================================================
 * 5. CUSTOMER DATA MASKING
 * ============================================================
 *
 * Data pribadi tidak ditampilkan secara utuh pada laporan
 * atau halaman audit yang tidak memerlukan identitas asli.
 */

export function maskCustomerData(
  value: unknown,
  type: 'acct' | 'name' | 'address' | 'phone' = 'name'
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '-';
  }

  const str = String(value).trim();

  if (!str) {
    return '-';
  }

  // Masking nomor akun pelanggan.
  if (type === 'acct') {
    if (str.length <= 4) {
      return '*'.repeat(str.length);
    }

    return (
      str.slice(0, 2) +
      '*'.repeat(Math.max(3, str.length - 5)) +
      str.slice(-3)
    );
  }

  // Masking nomor telepon.
  if (type === 'phone') {
    if (str.length <= 4) {
      return '*'.repeat(str.length);
    }

    return (
      str.slice(0, 3) +
      '*'.repeat(Math.max(3, str.length - 6)) +
      str.slice(-3)
    );
  }

  // Masking nama pelanggan.
  if (type === 'name') {
    return str
      .split(/\s+/)
      .map(part => {
        if (part.length <= 1) {
          return '*';
        }

        return (
          part.charAt(0) +
          '*'.repeat(Math.min(part.length - 1, 5))
        );
      })
      .join(' ');
  }

  // Masking alamat pelanggan.
  if (type === 'address') {
    return '[Alamat Disamarkan]';
  }

  return '-';
}

/**
 * ============================================================
 * 6. OFFERNUM UNIQUENESS VALIDATION
 * ============================================================
 *
 * Memeriksa apakah OFFERNUM:
 * - Terisi.
 * - Unik.
 * - Memiliki duplikasi.
 *
 * Fungsi ini tidak mengganti OFFERNUM kosong dengan
 * CUST_ACCT atau membuat nomor WO palsu.
 */

export interface OfferNumUniquenessResult {
  isUnique: boolean;
  totalRows: number;
  uniqueCount: number;
  emptyCount: number;
  duplicateCount: number;
  duplicateKeys: string[];
  recommendation: string;
}

export function validateOfferNumUniqueness(
  rows: Record<string, unknown>[],
  offerNumColumn: string
): OfferNumUniquenessResult {
  const counts = new Map<string, number>();

  let emptyCount = 0;

  for (const row of rows) {
    const rawValue = row[offerNumColumn];

    const key =
      rawValue === null || rawValue === undefined
        ? ''
        : String(rawValue).trim();

    if (!key) {
      emptyCount++;
      continue;
    }

    counts.set(
      key,
      (counts.get(key) || 0) + 1
    );
  }

  const duplicateKeys = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  const uniqueCount = counts.size;

  const duplicateCount = Array.from(counts.values())
    .reduce(
      (total, count) => total + Math.max(0, count - 1),
      0
    );

  const totalRows = rows.length;

  const isUnique =
    emptyCount === 0 &&
    duplicateKeys.length === 0;

  let recommendation =
    'OFFERNUM terisi dan unik pada seluruh baris yang diperiksa.';

  if (totalRows === 0) {
    recommendation =
      'Tidak ada data yang dapat diperiksa.';
  } else if (emptyCount > 0 && duplicateKeys.length > 0) {
    recommendation =
      `Ditemukan ${emptyCount} baris tanpa OFFERNUM dan ` +
      `${duplicateKeys.length} nilai OFFERNUM duplikat. ` +
      'Periksa kolom WORDER dan identitas WO pada sumber data.';
  } else if (emptyCount > 0) {
    recommendation =
      `Ditemukan ${emptyCount} baris tanpa OFFERNUM. ` +
      'Periksa apakah WORDER tersedia dan dapat digunakan ' +
      'sebagai identitas WO. Jangan mengganti dengan CUST_ACCT.';
  } else if (duplicateKeys.length > 0) {
    recommendation =
      `Ditemukan ${duplicateKeys.length} nilai OFFERNUM duplikat ` +
      `dengan total ${duplicateCount} baris pengulangan. ` +
      'Periksa kemungkinan pencatatan ganda sebelum analisis.';
  }

  return {
    isUnique,
    totalRows,
    uniqueCount,
    emptyCount,
    duplicateCount,
    duplicateKeys,
    recommendation,
  };
}

/**
 * ============================================================
 * 7. GET CANONICAL KEY FROM RAW HEADER
 * ============================================================
 *
 * Helper untuk mengambil canonical key dari nama kolom Excel.
 */

export function getCanonicalKeyFromHeader(
  rawHeader: string
): keyof CanonicalWorkOrder | null {
  const normalized =
    normalizeHeaderName(rawHeader);

  if (!normalized) {
    return null;
  }

  for (const definition of STANDARD_COLUMN_DEFINITIONS) {
    if (
      normalizeHeaderName(definition.canonicalKey) ===
      normalized
    ) {
      return definition.canonicalKey;
    }

    const matchedAlias = definition.aliases.some(
      alias =>
        normalizeHeaderName(alias) === normalized
    );

    if (matchedAlias) {
      return definition.canonicalKey;
    }
  }

  return null;
}
