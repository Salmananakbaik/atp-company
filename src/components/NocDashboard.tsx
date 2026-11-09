/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dashboard operasional berbasis dataset Work Order yang diimpor pengguna.
 * Tidak menggunakan angka, teknisi, lokasi, tren, atau anomali simulasi.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  FileText,
  Maximize2,
  MapPin,
  Share2,
  TrendingUp,
  User,
  Wifi,
} from 'lucide-react';

import {
  PreprocessedWorkOrder,
  TechnicianLocation,
} from '../types/telco';

import { maskCustomerData } from '../utils/columnMapper';

interface NocDashboardProps {
  records: PreprocessedWorkOrder[];
  technicians: TechnicianLocation[];
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
  onNavigateTab: (tab: string) => void;
  isDemoData: boolean;
}

type NetworkFilter = 'ALL' | 'FTTH' | 'HFC';

const COMPLETE_STATUSES = new Set([
  'DONE',
  'SUCCESS',
  'SELESAI',
  'SUKSES',
  'OK',
  'COMPLETE',
  'COMPLETED',
  'CLOSE',
  'CLOSED',
]);

const normalize = (value: unknown): string =>
  String(value ?? '').trim().toUpperCase();

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('id-ID').format(value);

const formatPercent = (value: number, total: number): string =>
  total > 0
    ? `${((value / total) * 100).toFixed(1).replace('.', ',')}%`
    : '0,0%';

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getBranchName = (
  record: PreprocessedWorkOrder
): string => {
  const raw = record as unknown as Record<string, unknown>;

  return String(
    raw.Branch ??
    raw.branch ??
    raw.branchName ??
    ''
  ).trim() || 'Tidak diketahui';
};

const getWorkOrderId = (
  record: PreprocessedWorkOrder
): string => {
  const raw = record as unknown as Record<string, unknown>;

  return String(
    raw.OFFERNUM ??
    raw.WORDER ??
    raw.id ??
    '-'
  );
};

const getMlScore = (
  record: PreprocessedWorkOrder
): number | null => {
  const score = Number(record.mlScore);

  return Number.isFinite(score) ? score : null;
};

const isComplete = (
  record: PreprocessedWorkOrder
): boolean =>
  COMPLETE_STATUSES.has(normalize(record.resultChoice));

const isAnomaly = (
  record: PreprocessedWorkOrder
): boolean =>
  normalize(record.compositeSeverity) !== 'NORMAL';

const parseCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getCoordinatePair = (
  latitude: unknown,
  longitude: unknown
): [number, number] | null => {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);

  if (
    lat === null ||
    lng === null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return [lat, lng];
};

const severityClass = (
  severity: unknown
): string => {
  switch (normalize(severity)) {
    case 'HIGH':
      return 'bg-red-950 text-red-300 border-red-800';

    case 'MEDIUM':
      return 'bg-orange-950 text-orange-300 border-orange-800';

    case 'LOW':
      return 'bg-amber-950 text-amber-300 border-amber-800';

    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

export const NocDashboard: React.FC<NocDashboardProps> = ({
  records,
  technicians,
  onSelectRecord,
  onNavigateTab,
  isDemoData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapNetworkFilter, setMapNetworkFilter] =
    useState<NetworkFilter>('ALL');

  // ==========================================
  // STATISTIK DASHBOARD
  // ==========================================

  const stats = useMemo(() => {
    const total = records.length;

    const ftth = records.filter(
      record => normalize(record.networkType) === 'FTTH'
    ).length;

    const hfc = records.filter(
      record => normalize(record.networkType) === 'HFC'
    ).length;

    const complete = records.filter(isComplete).length;
    const anomaly = records.filter(isAnomaly).length;

    return {
      total,
      ftth,
      hfc,
      complete,
      pending: Math.max(0, total - complete),
      anomaly,
    };
  }, [records]);

  // ==========================================
  // DATA ANOMALI TERBARU
  // ==========================================

  const recentAnomalies = useMemo(
    () => records.filter(isAnomaly).slice(0, 6),
    [records]
  );

  // ==========================================
  // DISTRIBUSI BRANCH
  // ==========================================

  const branchDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    records.forEach(record => {
      const branch = getBranchName(record);

      counts.set(
        branch,
        (counts.get(branch) ?? 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  // ==========================================
  // DATA KOORDINAT WORK ORDER
  // ==========================================

  const mapRecords = useMemo(() => {
    return records.filter(record => {
      const coordinates = getCoordinatePair(
        record.latitude,
        record.longitude
      );

      if (!coordinates) return false;

      return (
        mapNetworkFilter === 'ALL' ||
        normalize(record.networkType) === mapNetworkFilter
      );
    });
  }, [records, mapNetworkFilter]);

  // ==========================================
  // DATA KOORDINAT TEKNISI
  // ==========================================

  const mappedTechnicians = useMemo(
    () =>
      technicians.filter(tech =>
        getCoordinatePair(
          tech.latitude,
          tech.longitude
        ) !== null
      ),
    [technicians]
  );

  // ==========================================
  // INISIALISASI PETA LEAFLET
  // ==========================================

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapInstanceRef.current) {
      return;
    }

    const map = L.map(container, {
      center: [-2.5, 118],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap tidak membutuhkan API key.
    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    osmLayer.addTo(map);

    osmLayer.on('tileerror', error => {
      console.warn(
        'OpenStreetMap tile gagal dimuat:',
        error
      );
    });

    const layer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    mapLayerGroupRef.current = layer;

    // Memastikan ukuran peta dihitung setelah DOM siap.
    const resizeMap = () => {
      if (mapInstanceRef.current) {
        map.invalidateSize();
      }
    };

    requestAnimationFrame(resizeMap);

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);

    window.addEventListener('resize', resizeMap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeMap);

      map.remove();

      mapInstanceRef.current = null;
      mapLayerGroupRef.current = null;
    };
  }, []);

  // ==========================================
  // MENAMPILKAN MARKER PETA
  // ==========================================

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = mapLayerGroupRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    // Marker teknisi berdasarkan data aktual.
    mappedTechnicians.forEach(tech => {
      const coordinates = getCoordinatePair(
        tech.latitude,
        tech.longitude
      );

      if (!coordinates) return;

      const [latitude, longitude] = coordinates;

      const icon = L.divIcon({
        className: 'custom-tech-pin',
        html: `
          <div style="
            width:16px;
            height:16px;
            border-radius:50%;
            background:#10b981;
            border:2px solid #e2e8f0;
            box-shadow:0 0 10px #10b98199;
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker(
        [latitude, longitude],
        { icon }
      ).addTo(layer);

      marker.bindPopup(`
        <div style="
          font-family:sans-serif;
          color:#0f172a;
          min-width:150px;
        ">
          <strong>
            ${escapeHtml(
              tech.technicianName ||
              tech.technicianId ||
              'Teknisi'
            )}
          </strong>

          <div style="font-size:11px;margin-top:4px">
            Koordinat dari data teknisi
          </div>

          <div style="font-size:10px;margin-top:3px">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </div>
        </div>
      `);

      bounds.push([latitude, longitude]);
    });

    // Marker Work Order berdasarkan koordinat aktual.
    mapRecords.forEach(record => {
      const coordinates = getCoordinatePair(
        record.latitude,
        record.longitude
      );

      if (!coordinates) return;

      const [latitude, longitude] = coordinates;

      const severity = normalize(
        record.compositeSeverity
      );

      const anomaly = severity !== 'NORMAL';
      const network = normalize(record.networkType);

      const color = anomaly
        ? '#ef4444'
        : network === 'FTTH'
          ? '#3b82f6'
          : '#f59e0b';

      const icon = L.divIcon({
        className: 'custom-wo-pin',
        html: `
          <div style="
            width:13px;
            height:13px;
            border-radius:50%;
            background:${color};
            border:2px solid #f8fafc;
            box-shadow:0 1px 5px #0009;
          "></div>
        `,
        iconSize: [13, 13],
        iconAnchor: [6, 6],
      });

      const marker = L.marker(
        [latitude, longitude],
        { icon }
      ).addTo(layer);

      marker.bindPopup(`
        <div style="
          font-family:sans-serif;
          color:#0f172a;
          min-width:150px;
        ">
          <strong>
            WO ${escapeHtml(getWorkOrderId(record))}
          </strong>

          <div style="font-size:11px;margin-top:4px">
            ${escapeHtml(
              network || 'Jaringan tidak diketahui'
            )}
          </div>

          <div style="font-size:11px">
            Status: ${escapeHtml(record.resultChoice || '-')}
          </div>

          <div style="font-size:11px">
            Indikasi: ${escapeHtml(severity || '-')}
          </div>

          <div style="font-size:10px;margin-top:4px">
            Tikor: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectRecord(record);
      });

      marker.addTo(layer);

      bounds.push([latitude, longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(
        L.latLngBounds(bounds),
        {
          padding: [30, 30],
          maxZoom: 13,
        }
      );
    } else {
      map.setView([-2.5, 118], 5);
    }

    // Perbarui ukuran setelah marker selesai ditambahkan.
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [
    mappedTechnicians,
    mapRecords,
    onSelectRecord,
  ]);

  // ==========================================
  // RESET TAMPILAN PETA
  // ==========================================

  const resetMapView = () => {
    const map = mapInstanceRef.current;

    if (!map) return;

    const bounds: L.LatLngExpression[] = [];

    mappedTechnicians.forEach(tech => {
      const coordinates = getCoordinatePair(
        tech.latitude,
        tech.longitude
      );

      if (coordinates) bounds.push(coordinates);
    });

    mapRecords.forEach(record => {
      const coordinates = getCoordinatePair(
        record.latitude,
        record.longitude
      );

      if (coordinates) bounds.push(coordinates);
    });

    if (bounds.length > 0) {
      map.fitBounds(
        L.latLngBounds(bounds),
        {
          padding: [30, 30],
          maxZoom: 13,
        }
      );
    } else {
      map.setView([-2.5, 118], 5);
    }
  };

  // ==========================================
  // DATA KPI
  // ==========================================

  const kpis = [
    {
      label: 'Total WO',
      value: stats.total,
      detail: 'Jumlah data yang diimpor',
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Complete',
      value: stats.complete,
      detail: `${formatPercent(
        stats.complete,
        stats.total
      )} dari total WO`,
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      label: 'Pending / Lainnya',
      value: stats.pending,
      detail: `${formatPercent(
        stats.pending,
        stats.total
      )} dari total WO`,
      icon: Clock,
      color: 'amber',
    },
    {
      label: 'Indikasi Anomali',
      value: stats.anomaly,
      detail: `${formatPercent(
        stats.anomaly,
        stats.total
      )} dari total WO`,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'FTTH',
      value: stats.ftth,
      detail: `${formatPercent(
        stats.ftth,
        stats.total
      )} dari total WO`,
      icon: Share2,
      color: 'purple',
    },
    {
      label: 'HFC',
      value: stats.hfc,
      detail: `${formatPercent(
        stats.hfc,
        stats.total
      )} dari total WO`,
      icon: Wifi,
      color: 'teal',
    },
  ] as const;

  const kpiColors: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    emerald:
      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber:
      'bg-amber-500/15 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/15 text-red-400 border-red-500/20',
    purple:
      'bg-purple-500/15 text-purple-400 border-purple-500/20',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  };

  // ==========================================
  // TAMPILAN DASHBOARD
  // ==========================================

  return (
    <div className="space-y-5">

      {isDemoData && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-800/70 bg-amber-950/30 px-4 py-3 text-xs text-amber-200 sm:flex-row sm:items-center sm:justify-between">

          <span>
            Mode demo terdeteksi dari komponen induk.
            Dashboard ini tidak membuat data tambahan.
            Pastikan sumber data yang digunakan adalah
            file operasional yang telah diimpor.
          </span>

          <button
            type="button"
            onClick={() => onNavigateTab('records')}
            className="shrink-0 font-semibold text-amber-300 hover:underline"
          >
            Buka Import Dataset →
          </button>

        </div>
      )}

      {/* KPI */}

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">

        {kpis.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm transition-colors hover:border-blue-500/40"
            >

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${kpiColors[item.color]}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">

                <span className="block text-[11px] font-medium text-slate-400">
                  {item.label}
                </span>

                <div className="font-mono text-xl font-bold tracking-tight text-white tabular-nums">
                  {formatNumber(item.value)}
                </div>

                <span className="mt-0.5 block text-[10px] text-slate-500">
                  {item.detail}
                </span>

              </div>
            </div>
          );
        })}

      </div>
            {/* PETA DAN RINGKASAN */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        <section className="flex flex-col rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm lg:col-span-8">

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">

            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />

              <h2 className="text-xs font-bold tracking-wide text-white">
                Peta Koordinat Work Order dan Teknisi
              </h2>
            </div>

            <div className="flex items-center gap-2">

              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px] font-medium">

                {(['ALL', 'FTTH', 'HFC'] as const).map(filter => (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setMapNetworkFilter(filter)}
                    className={`rounded-md px-3 py-1 transition-colors ${
                      mapNetworkFilter === filter
                        ? 'bg-blue-600 font-semibold text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL' ? 'Semua' : filter}
                  </button>
                ))}

              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('gis')}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title="Buka peta penuh"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>

            </div>
          </div>

          {/* MAP CONTAINER */}

          <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-slate-800/60">

            <div
              ref={mapContainerRef}
              className="z-0 h-full w-full"
              style={{ minHeight: '360px' }}
            />

            {/* MAP CONTROLS */}

            <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-1.5">

              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                aria-label="Perbesar peta"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                aria-label="Perkecil peta"
              >
                -
              </button>

              <button
                type="button"
                onClick={resetMapView}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-cyan-400 shadow-md hover:bg-slate-800"
                title="Tampilkan seluruh koordinat data"
                aria-label="Atur ulang tampilan peta"
              >
                <Crosshair className="h-3.5 w-3.5" />
              </button>

            </div>

            {/* MAP LEGEND */}

            <div className="absolute bottom-3 right-3 z-[500] flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-[#070D1E]/90 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur-sm">

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Teknisi
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                FTTH
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                HFC
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Indikasi anomali
              </span>

            </div>

            {/* EMPTY MAP MESSAGE */}

            {mapRecords.length === 0 &&
              mappedTechnicians.length === 0 && (
                <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-[#091124]/35 p-5 text-center">

                  <div className="rounded-xl border border-slate-700 bg-[#091124]/95 px-5 py-4">

                    <MapPin className="mx-auto mb-2 h-6 w-6 text-slate-500" />

                    <p className="text-sm font-semibold text-slate-200">
                      Belum ada koordinat untuk ditampilkan
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Impor data WO yang memiliki latitude
                      dan longitude, atau hubungkan sumber
                      lokasi teknisi yang valid.
                    </p>

                  </div>
                </div>
              )}

          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Marker hanya ditampilkan dari koordinat valid
            pada data yang tersedia. Garis rute dan posisi
            teknisi tidak disimulasikan.
          </p>

        </section>

        {/* KOLOM KANAN */}

        <div className="space-y-4 lg:col-span-4">

          {/* RINGKASAN ANOMALI */}

          <section className="rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm">

            <div className="mb-3 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">

              <AlertTriangle className="h-4 w-4 text-cyan-400" />

              <h2 className="text-xs font-bold tracking-wide text-white">
                Ringkasan Anomali
              </h2>

            </div>

            <div className="flex items-center gap-4">

              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#ef4444 ${
                    stats.total > 0
                      ? (stats.anomaly / stats.total) * 100
                      : 0
                  }%, #1e293b 0)`,
                }}
              >

                <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full bg-[#091124]">

                  <span className="font-mono text-lg font-bold leading-none text-white">
                    {formatNumber(stats.anomaly)}
                  </span>

                  <span className="mt-1 text-[9px] text-slate-400">
                    anomali
                  </span>

                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2 text-[11px]">

                <div className="flex items-center justify-between gap-2">

                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Indikasi anomali
                  </span>

                  <strong className="font-mono text-white">
                    {formatPercent(stats.anomaly, stats.total)}
                  </strong>

                </div>

                <div className="flex items-center justify-between gap-2">

                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                    Normal
                  </span>

                  <strong className="font-mono text-white">
                    {formatPercent(
                      stats.total - stats.anomaly,
                      stats.total
                    )}
                  </strong>

                </div>

                <p className="border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">
                  Klasifikasi mengikuti nilai compositeSeverity
                  dari proses analisis. Indikasi anomali perlu
                  diverifikasi, bukan bukti pelanggaran.
                </p>

              </div>
            </div>
          </section>

          {/* DATA TEKNISI */}

          <section className="rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm">

            <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">

              <div className="flex items-center gap-2">

                <User className="h-4 w-4 text-cyan-400" />

                <h2 className="text-xs font-bold tracking-wide text-white">
                  Data Teknisi
                </h2>

              </div>

              <span className="rounded-md bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-300">
                {mappedTechnicians.length} lokasi
              </span>

            </div>

            {mappedTechnicians.length > 0 ? (

              <div className="max-h-40 space-y-2 overflow-y-auto">

                {mappedTechnicians.slice(0, 6).map((tech, index) => (

                  <div
                    key={`${tech.technicianId}-${index}`}
                    className="flex items-center justify-between gap-2 border-b border-slate-800/40 py-1.5 last:border-0"
                  >

                    <div className="flex min-w-0 items-center gap-2">

                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

                      <span className="truncate font-mono text-xs font-bold text-white">
                        {tech.technicianName ||
                          tech.technicianId ||
                          'Teknisi'}
                      </span>

                    </div>

                    <span className="shrink-0 text-[10px] text-slate-500">
                      {parseCoordinate(tech.latitude)?.toFixed(4) ?? '-'},
                      {' '}
                      {parseCoordinate(tech.longitude)?.toFixed(4) ?? '-'}
                    </span>

                  </div>

                ))}

              </div>

            ) : (

              <div className="py-5 text-center">

                <User className="mx-auto mb-2 h-5 w-5 text-slate-600" />

                <p className="text-xs text-slate-400">
                  Belum ada data lokasi teknisi.
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  Data WO tidak otomatis dianggap sebagai GPS teknisi.
                </p>

              </div>

            )}

            <button
              type="button"
              onClick={() => onNavigateTab('monitoring_teknisi')}
              className="mt-3 flex w-full items-center justify-end gap-1 border-t border-slate-800/60 pt-2 text-xs font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
            >
              <span>Lihat Monitoring Teknisi</span>
              <span>→</span>
            </button>

          </section>

        </div>
      </div>

      {/* DISTRIBUSI STATUS, BRANCH, DAN ANOMALI */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* DISTRIBUSI STATUS */}

        <section className="flex flex-col rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm lg:col-span-4">

          <div className="mb-3 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">

            <TrendingUp className="h-4 w-4 text-cyan-400" />

            <h2 className="text-xs font-bold tracking-wide text-white">
              Distribusi Status WO
            </h2>

          </div>

          {stats.total > 0 ? (

            <div className="space-y-4 py-2">

              {[
                {
                  label: 'Complete',
                  value: stats.complete,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Pending / lainnya',
                  value: stats.pending,
                  color: 'bg-amber-500',
                },
              ].map(item => (

                <div key={item.label}>

                  <div className="mb-1 flex justify-between gap-2 text-xs">

                    <span className="text-slate-300">
                      {item.label}
                    </span>

                    <span className="font-mono font-bold text-white">
                      {formatNumber(item.value)}
                      {' '}
                      ({formatPercent(item.value, stats.total)})
                    </span>

                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">

                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${
                          (item.value / stats.total) * 100
                        }%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-slate-500">
              Belum ada data untuk dihitung.
            </div>

          )}

          <p className="mt-2 text-[10px] text-slate-500">
            Status dihitung dari kolom Result Choice
            pada data hasil pemetaan.
          </p>

        </section>

        {/* DISTRIBUSI BRANCH */}

        <section className="rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm lg:col-span-3">

          <div className="mb-3 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">

            <Share2 className="h-4 w-4 text-cyan-400" />

            <h2 className="text-xs font-bold tracking-wide text-white">
              Distribusi WO per Branch
            </h2>

          </div>

          {branchDistribution.length > 0 ? (

            <div className="space-y-3.5">

              {branchDistribution.map(branch => (

                <div key={branch.name}>

                  <div className="mb-1 flex justify-between gap-2 text-xs font-medium">

                    <span className="truncate text-slate-300">
                      {branch.name}
                    </span>

                    <span className="font-mono font-bold text-white">
                      {formatNumber(branch.count)}
                    </span>

                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{
                        width: `${
                          (branch.count /
                            (branchDistribution[0]?.count || 1)) *
                          100
                        }%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="py-8 text-center text-xs text-slate-500">
              Data branch belum tersedia.
            </div>

          )}

        </section>

        {/* DAFTAR ANOMALI */}

        <section className="flex min-w-0 flex-col rounded-2xl border border-slate-800/80 bg-[#091124] p-4 shadow-sm lg:col-span-5">

          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">

            <div className="flex items-center gap-2">

              <AlertTriangle className="h-4 w-4 text-red-400" />

              <h2 className="text-xs font-bold tracking-wide text-white">
                Daftar WO Indikasi Anomali
              </h2>

            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('isolation_forest')}
              className="shrink-0 text-xs font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
            >
              Lihat Semua →
            </button>

          </div>

          {recentAnomalies.length > 0 ? (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[560px] text-left text-xs">

                <thead>

                  <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500">

                    <th className="pb-2">ID WO</th>

                    <th className="pb-2">Pelanggan</th>

                    <th className="pb-2">Job Task</th>

                    <th className="pb-2 text-right">Skor</th>

                    <th className="pb-2 text-center">Level</th>

                    <th className="pb-2 text-right">Aksi</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800/50">

                  {recentAnomalies.map((record, index) => {

                    const score = getMlScore(record);

                    return (

                      <tr
                        key={`${getWorkOrderId(record)}-${index}`}
                        className="transition-colors hover:bg-slate-800/30"
                      >

                        <td className="py-2.5 font-mono text-slate-300">
                          {getWorkOrderId(record)}
                        </td>

                        <td className="py-2.5 text-slate-200">
                          {maskCustomerData(
                            record.Customer_Name || 'Pelanggan',
                            'name'
                          )}
                        </td>

                        <td className="py-2.5 text-[11px] text-slate-400">
                          {record.jobTask || '-'}
                        </td>

                        <td className="py-2.5 text-right font-mono text-slate-300">
                          {score === null
                            ? '-'
                            : score.toFixed(3)}
                        </td>

                        <td className="py-2.5 text-center">

                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold ${severityClass(
                              record.compositeSeverity
                            )}`}
                          >
                            {normalize(record.compositeSeverity) || 'REVIEW'}
                          </span>

                        </td>

                        <td className="py-2.5 text-right">

                          <button
                            type="button"
                            onClick={() => onSelectRecord(record)}
                            className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-700"
                          >
                            Detail
                          </button>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">

              <CheckCircle2 className="mb-2 h-6 w-6 text-slate-600" />

              <p className="text-xs font-medium text-slate-300">
                {records.length === 0
                  ? 'Belum ada dataset yang diimpor.'
                  : 'Belum ada indikasi anomali.'}
              </p>

              <p className="mt-1 max-w-sm text-[10px] text-slate-500">
                {records.length === 0
                  ? 'Impor file Excel atau CSV untuk mulai menghitung statistik dan menjalankan analisis.'
                  : 'Hasil akan muncul di sini jika proses analisis menandai Work Order untuk ditinjau.'}
              </p>

              {records.length === 0 && (

                <button
                  type="button"
                  onClick={() => onNavigateTab('records')}
                  className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Import Dataset
                </button>

              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
};

export default NocDashboard;