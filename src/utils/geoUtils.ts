
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Geographic intelligence & Tikor coordinate parser
 * PT. ANUGERAH TERANG PERSADA
 *
 * Tidak membuat koordinat buatan.
 * Koordinat hanya digunakan jika tersedia dan valid.
 */

export interface ParsedCoordinates {
  latitude?: number;
  longitude?: number;
  isValid: boolean;
  rawTikor?: string;
  source: 'REMARK_TIKOR' | 'DIRECT_COLUMN' | 'NONE';
}

type CoordinateValue = string | number | null | undefined;

/**
 * Normalisasi nama kolom agar mendukung variasi header Excel.
 */
function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Mengambil nilai berdasarkan beberapa kemungkinan nama header.
 */
function getColumnValue(
  row: Record<string, unknown>,
  aliases: string[]
): unknown {
  const normalizedAliases = new Set(
    aliases.map(normalizeKey)
  );

  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.has(normalizeKey(key))) {
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Mengubah angka atau teks menjadi angka koordinat.
 *
 * Mendukung:
 * - -6.227841
 * - -6,227841
 * - 106.563219
 * - 106,563219
 *
 * Jika format ambigu, nilai tidak dipaksakan.
 */
function parseCoordinateNumber(
  value: CoordinateValue
): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  let text = value.trim();

  if (!text) {
    return undefined;
  }

  text = text.replace(/\s/g, '');

  // Format koma desimal tanpa titik.
  if (
    text.includes(',') &&
    !text.includes('.')
  ) {
    if ((text.match(/,/g) || []).length !== 1) {
      return undefined;
    }

    text = text.replace(',', '.');
  }

  // Jika memiliki titik dan koma sekaligus,
  // format dianggap ambigu dan tidak ditebak.
  if (
    text.includes(',') &&
    text.includes('.')
  ) {
    return undefined;
  }

  if (!/^-?\d+(?:\.\d+)?$/.test(text)) {
    return undefined;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

/**
 * Validasi rentang geografis Indonesia.
 */
export function isValidIndonesianCoordinates(
  lat: number,
  lng: number
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (lat === 0 && lng === 0) {
    return false;
  }

  return (
    lat >= -11.5 &&
    lat <= 6.5 &&
    lng >= 94.5 &&
    lng <= 141.5
  );
}

/**
 * Membulatkan koordinat hingga enam angka desimal.
 */
function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Membuat hasil koordinat valid.
 */
function createValidCoordinates(
  latitude: number,
  longitude: number,
  source: 'REMARK_TIKOR' | 'DIRECT_COLUMN',
  rawTikor?: string
): ParsedCoordinates {
  return {
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    isValid: true,
    rawTikor,
    source,
  };
}

/**
 * Mengambil pasangan koordinat dari teks remark.
 *
 * Mendukung contoh:
 * - Tikor: -6.2297, 106.8166
 * - [-6.2148, 106.8456]
 * - -6.229712;106.816621
 * - -6,229712;106,816621
 * - lat -6.2301 long 106.8170
 */
function parseCoordinateText(
  text: string
): ParsedCoordinates | null {
  if (!text.trim()) {
    return null;
  }

  // Pola koordinat dengan label latitude dan longitude.
  const labelledPattern =
    /(?:lat(?:itude)?)[^-\d]*(-?\d{1,2}(?:[.,]\d{3,8})?)[\s\S]{0,60}?(?:lon(?:gitude)?|lng)[^-\d]*(-?\d{2,3}(?:[.,]\d{3,8})?)/i;

  const labelledMatch = text.match(labelledPattern);

  if (labelledMatch) {
    const lat = parseCoordinateNumber(labelledMatch[1]);
    const lng = parseCoordinateNumber(labelledMatch[2]);

    if (
      lat !== undefined &&
      lng !== undefined &&
      isValidIndonesianCoordinates(lat, lng)
    ) {
      return createValidCoordinates(
        lat,
        lng,
        'REMARK_TIKOR',
        `${labelledMatch[1]}, ${labelledMatch[2]}`
      );
    }
  }

  // Pola pasangan koordinat dengan pemisah titik koma atau pipe.
  // Pola ini mendukung koma sebagai tanda desimal.
  const commaDecimalPattern =
    /(-?\d{1,2},\d{3,8})\s*[;|/]\s*(-?\d{2,3},\d{3,8})/;

  const commaDecimalMatch = text.match(commaDecimalPattern);

  if (commaDecimalMatch) {
    const lat = parseCoordinateNumber(commaDecimalMatch[1]);
    const lng = parseCoordinateNumber(commaDecimalMatch[2]);

    if (
      lat !== undefined &&
      lng !== undefined &&
      isValidIndonesianCoordinates(lat, lng)
    ) {
      return createValidCoordinates(
        lat,
        lng,
        'REMARK_TIKOR',
        `${commaDecimalMatch[1]}, ${commaDecimalMatch[2]}`
      );
    }
  }

  // Pola pasangan koordinat dengan titik desimal.
  const decimalPattern =
    /(-?\d{1,2}\.\d{3,8})\s*[,;|/ ]+\s*(-?\d{2,3}\.\d{3,8})/;

  const decimalMatch = text.match(decimalPattern);

  if (decimalMatch) {
    let first = parseCoordinateNumber(decimalMatch[1]);
    let second = parseCoordinateNumber(decimalMatch[2]);

    if (first !== undefined && second !== undefined) {
      // Mengakomodasi urutan longitude, latitude.
      if (
        Math.abs(first) > 90 &&
        Math.abs(second) <= 90
      ) {
        [first, second] = [second, first];
      }

      if (isValidIndonesianCoordinates(first, second)) {
        return createValidCoordinates(
          first,
          second,
          'REMARK_TIKOR',
          `${decimalMatch[1]}, ${decimalMatch[2]}`
        );
      }
    }
  }

  return null;
}

/**
 * Mengekstrak dan memvalidasi koordinat dari:
 * 1. Kolom LATITUDE dan LONGITUDE.
 * 2. Result Remark.
 * 3. WIP Comment.
 * 4. KOORDINAT atau Tikor.
 *
 * Kolom langsung diprioritaskan.
 * Tidak membuat koordinat jika data tidak tersedia.
 */
export function extractCoordinates(
  row: Record<string, unknown>
): ParsedCoordinates {
  const rawLatitude = getColumnValue(row, [
    'LATITUDE',
    'latitude',
    'LAT',
    'GPS Latitude',
    'GPS_LAT',
    'koordinat_latitude',
  ]);

  const rawLongitude = getColumnValue(row, [
    'LONGITUDE',
    'longitude',
    'LONG',
    'LNG',
    'LON',
    'GPS Longitude',
    'GPS_LON',
    'koordinat_longitude',
  ]);

  const latitude = parseCoordinateNumber(
    rawLatitude as CoordinateValue
  );

  const longitude = parseCoordinateNumber(
    rawLongitude as CoordinateValue
  );

  // Gunakan kolom koordinat langsung jika keduanya tersedia.
  if (
    latitude !== undefined &&
    longitude !== undefined &&
    isValidIndonesianCoordinates(latitude, longitude)
  ) {
    return createValidCoordinates(
      latitude,
      longitude,
      'DIRECT_COLUMN',
      `${String(rawLatitude)}, ${String(rawLongitude)}`
    );
  }

  // Jika koordinat langsung tidak lengkap atau tidak valid,
  // coba cari koordinat dari remark.
  const resultRemark = getColumnValue(row, [
    'Result Remark',
    'resultRemark',
    'result_remark',
  ]);

  const wipComment = getColumnValue(row, [
    'WIP Comment',
    'wipComment',
    'wip_comment',
  ]);

  const tikor = getColumnValue(row, [
    'KOORDINAT',
    'Tikor',
    'GPS',
    'Location',
  ]);

  const textCorpus = [
    resultRemark,
    wipComment,
    tikor,
  ]
    .filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
    )
    .map(value => String(value))
    .join(' ');

  const remarkCoordinates =
    parseCoordinateText(textCorpus);

  if (remarkCoordinates) {
    return remarkCoordinates;
  }

  // Tidak mengarang atau mengisi koordinat yang tidak tersedia.
  return {
    isValid: false,
    source: 'NONE',
    rawTikor: textCorpus || undefined,
  };
}

/**
 * Menghitung jarak dua titik menggunakan Haversine.
 * Hasil dalam meter.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const coordinates = [lat1, lon1, lat2, lon2];

  if (!coordinates.every(Number.isFinite)) {
    return NaN;
  }

  const R = 6_371_000;

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;

  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));

  const c =
    2 *
    Math.atan2(
      Math.sqrt(safeA),
      Math.sqrt(1 - safeA)
    );

  return Math.round(R * c);
}

/**
 * Format jarak dalam meter atau kilometer.
 */
export function formatDistance(
  meters: number | undefined
): string {
  if (
    meters === undefined ||
    !Number.isFinite(meters)
  ) {
    return '-';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}
