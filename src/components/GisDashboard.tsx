/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Interactive GIS & OpenStreetMap Dashboard
 * PT. ANUGERAH TERANG PERSADA
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import L from 'leaflet';

import {
  Navigation,
  Radio,
  Eye,
  AlertTriangle,
  Compass,
  Search,
} from 'lucide-react';

import {
  PreprocessedWorkOrder,
  TechnicianLocation,
} from '../types/telco';

import {
  calculateHaversineDistanceMeters,
  formatDistance,
} from '../utils/geoUtils';

import { maskCustomerData } from '../utils/columnMapper';

// ============================================================
// 1. PROPS
// ============================================================

interface GisDashboardProps {
  records: PreprocessedWorkOrder[];
  technicians: TechnicianLocation[];
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
}

// ============================================================
// 2. HELPER FUNCTIONS
// ============================================================

type CoordinateCandidate = {
  latitude?: unknown;
  longitude?: unknown;
};

/**
 * Memastikan objek mempunyai latitude dan longitude valid.
 * TypeScript akan mengenali kedua koordinat sebagai number
 * setelah fungsi ini menghasilkan true.
 */
function hasValidCoordinates<T extends CoordinateCandidate>(
  value: T | null | undefined
): value is T & {
  latitude: number;
  longitude: number;
} {
  if (!value) return false;

  const { latitude, longitude } = value;

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * Escape HTML untuk mencegah isi file Excel
 * diperlakukan sebagai markup HTML pada popup Leaflet.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// 3. COMPONENT
// ============================================================

export const GisDashboard: React.FC<GisDashboardProps> = ({
  records,
  technicians,
  onSelectRecord,
}) => {
  // ==========================================================
  // A. MAP REFERENCES
  // ==========================================================

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const techMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const proximityLineLayerRef = useRef<L.Polyline | null>(null);

  // ==========================================================
  // B. FILTER STATES
  // ==========================================================

  const [networkFilter, setNetworkFilter] =
    useState<'ALL' | 'FTTH' | 'HFC'>('ALL');

  const [branchFilter, setBranchFilter] =
    useState<string>('ALL');

  const [anomalyOnly, setAnomalyOnly] =
    useState<boolean>(false);

  const [showTechFleet, setShowTechFleet] =
    useState<boolean>(true);

  const [searchQuery, setSearchQuery] =
    useState<string>('');

  const [selectedTechId, setSelectedTechId] =
    useState<string>('');

  const [selectedWoId, setSelectedWoId] =
    useState<string>('');

  // ==========================================================
  // C. VALID WORK ORDER COORDINATES
  // ==========================================================

  const validGeoRecords = useMemo(() => {
    return records.filter(
      (
        record
      ): record is PreprocessedWorkOrder & {
        latitude: number;
        longitude: number;
      } =>
        record.hasValidGeoCoord === true &&
        hasValidCoordinates(record)
    );
  }, [records]);

  // ==========================================================
  // D. BRANCH LIST
  // ==========================================================

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(record => record.Branch?.trim())
          .filter((branch): branch is string =>
            Boolean(branch)
          )
      )
    ).sort();
  }, [records]);

  // ==========================================================
  // E. FILTERED WORK ORDERS
  // ==========================================================

  const geocodedRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return validGeoRecords.filter(record => {
      if (
        networkFilter !== 'ALL' &&
        record.networkType !== networkFilter
      ) {
        return false;
      }

      if (
        branchFilter !== 'ALL' &&
        (record.Branch || '') !== branchFilter
      ) {
        return false;
      }

      if (
        anomalyOnly &&
        record.compositeSeverity === 'NORMAL'
      ) {
        return false;
      }

      if (query) {
        const matchOffer = String(record.OFFERNUM || '')
          .toLowerCase()
          .includes(query);

        const matchTech = String(record.installer || '')
          .toLowerCase()
          .includes(query);

        const matchBranch = String(record.Branch || '')
          .toLowerCase()
          .includes(query);

        if (!matchOffer && !matchTech && !matchBranch) {
          return false;
        }
      }

      return true;
    });
  }, [
    validGeoRecords,
    networkFilter,
    branchFilter,
    anomalyOnly,
    searchQuery,
  ]);

  // ==========================================================
  // F. VALID TECHNICIAN LOCATIONS
  // ==========================================================

  const validTechnicians = useMemo(() => {
    return technicians.filter(
      (
        technician
      ): technician is TechnicianLocation & {
        latitude: number;
        longitude: number;
      } => hasValidCoordinates(technician)
    );
  }, [technicians]);

  const activeTechCount = validTechnicians.filter(
    technician => technician.isSharingActive
  ).length;

  // ==========================================================
  // G. INITIALIZE LEAFLET MAP
  // ==========================================================

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapInstanceRef.current) {
      return;
    }

    const map = L.map(container, {
      center: [-6.2297, 106.8166],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

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

    const markersLayer = L.layerGroup().addTo(map);
    const techMarkersLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    techMarkersLayerRef.current = techMarkersLayer;
    mapInstanceRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();

      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      techMarkersLayerRef.current = null;
      proximityLineLayerRef.current = null;
    };
  }, []);

  // ==========================================================
  // H. UPDATE WORK ORDER MARKERS
  // ==========================================================

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    const markerBounds: L.LatLngExpression[] = [];

    geocodedRecords.forEach(wo => {
      if (!hasValidCoordinates(wo)) return;

      const latitude = wo.latitude;
      const longitude = wo.longitude;

      const isAnomaly =
        wo.compositeSeverity !== 'NORMAL';

      const isFtth = wo.networkType === 'FTTH';

      const bgColor = isAnomaly
        ? '#dc2626'
        : isFtth
          ? '#0284c7'
          : '#d97706';

      const badgeText = isFtth
        ? 'FTTH'
        : wo.networkType === 'HFC'
          ? 'HFC'
          : 'OTHER';

      const customIcon = L.divIcon({
        className: 'custom-wo-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: white;
            font-family: sans-serif;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 6px;
            border-radius: 6px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            white-space: nowrap;
          ">
            <span>${badgeText}</span>
            ${isAnomaly ? '<span>●</span>' : ''}
          </div>
        `,
        iconSize: [50, 24],
        iconAnchor: [25, 12],
      });

      const marker = L.marker(
        [latitude, longitude],
        { icon: customIcon }
      );

      const popupHtml = `
        <div style="
          font-family: Arial, sans-serif;
          font-size: 12px;
          min-width: 200px;
          padding: 4px;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 6px;
          ">
            <strong style="
              font-size: 13px;
              color: #0f172a;
            ">
              ${escapeHtml(wo.OFFERNUM)}
            </strong>

            <span style="
              font-size: 10px;
              background: #f1f5f9;
              padding: 2px 5px;
              border-radius: 4px;
            ">
              ${escapeHtml(wo.networkType)}
            </span>
          </div>

          <div style="
            color: #475569;
            line-height: 1.6;
            font-size: 11px;
          ">
            <div>
              <strong>Cabang:</strong>
              ${escapeHtml(wo.Branch || '-')}
            </div>

            <div>
              <strong>Teknisi:</strong>
              ${escapeHtml(wo.installer || '-')}
            </div>

            <div>
              <strong>Tugas:</strong>
              ${escapeHtml(wo.jobTask || '-')}
            </div>

            <div>
              <strong>Hasil:</strong>
              ${escapeHtml(wo.resultChoice || '-')}
            </div>

            <div>
              <strong>Close Status:</strong>
              ${escapeHtml(wo.closeStatusWOM || '-')}
            </div>

            <div style="
              margin-top: 5px;
              font-family: monospace;
              color: #64748b;
            ">
              Tikor:
              ${latitude.toFixed(5)},
              ${longitude.toFixed(5)}
            </div>

            ${
              isAnomaly
                ? `
                  <div style="
                    margin-top: 7px;
                    padding: 5px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 5px;
                    color: #991b1b;
                    font-weight: 600;
                  ">
                    Indikasi Deviasi:
                    ${escapeHtml(wo.compositeSeverity)}
                  </div>
                `
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedWoId(String(wo.OFFERNUM || ''));
      });

      marker.addTo(layer);

      markerBounds.push([
        latitude,
        longitude,
      ]);
    });

    if (markerBounds.length > 0) {
      const bounds = L.latLngBounds(markerBounds);

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [geocodedRecords]);

  // ==========================================================
  // I. UPDATE TECHNICIAN MARKERS
  // ==========================================================

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = techMarkersLayerRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    if (!showTechFleet) return;

    validTechnicians.forEach(tech => {
      if (!hasValidCoordinates(tech)) return;

      const latitude = tech.latitude;
      const longitude = tech.longitude;

      const pulseColor = tech.isSharingActive
        ? '#10b981'
        : '#94a3b8';

      const techIcon = L.divIcon({
        className: 'custom-tech-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
          ">
            ${
              tech.isSharingActive
                ? `
                  <div style="
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.25);
                    animation: ping 1.5s infinite;
                  "></div>
                `
                : ''
            }

            <div style="
              position: absolute;
              top: 4px;
              left: 4px;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #0f172a;
              border: 2px solid ${pulseColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              T
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(
        [latitude, longitude],
        { icon: techIcon }
      );

      const timestamp = new Date(tech.timestamp);

      const lastUpdateStr =
        Number.isNaN(timestamp.getTime())
          ? 'Tidak diketahui'
          : timestamp.toLocaleTimeString('id-ID');

      const techPopup = `
        <div style="
          font-family: Arial, sans-serif;
          font-size: 12px;
          min-width: 190px;
        ">
          <div style="
            font-weight: 700;
            font-size: 13px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 6px;
          ">
            ${escapeHtml(tech.technicianName)}
          </div>

          <div style="
            font-size: 11px;
            color: #475569;
            line-height: 1.7;
          ">
            <div>
              <strong>Status GPS:</strong>
              ${
                tech.isSharingActive
                  ? '<span style="color:#15803d">● Aktif Berbagi</span>'
                  : '<span style="color:#64748b">Mati</span>'
              }
            </div>

            <div>
              <strong>Cabang:</strong>
              ${escapeHtml(tech.assignedBranch || '-')}
            </div>

            <div>
              <strong>Akurasi:</strong>
              ±${
                Number.isFinite(tech.accuracy)
                  ? Math.round(tech.accuracy)
                  : '-'
              } meter
            </div>

            <div>
              <strong>Update Terakhir:</strong>
              ${escapeHtml(lastUpdateStr)}
            </div>

            <div style="
              font-family: monospace;
              color: #64748b;
              margin-top: 4px;
            ">
              ${latitude.toFixed(5)},
              ${longitude.toFixed(5)}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(techPopup);

      marker.on('click', () => {
        setSelectedTechId(tech.technicianId);
      });

      marker.addTo(layer);
    });
  }, [
    validTechnicians,
    showTechFleet,
  ]);

  // ==========================================================
  // J. PROXIMITY LINE
  // ==========================================================

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) return;

    if (proximityLineLayerRef.current) {
      proximityLineLayerRef.current.remove();
      proximityLineLayerRef.current = null;
    }

    if (!selectedTechId || !selectedWoId) {
      return;
    }

    const tech = validTechnicians.find(
      item => item.technicianId === selectedTechId
    );

    const wo = validGeoRecords.find(
      item => String(item.OFFERNUM || '') === selectedWoId
    );

    if (!tech || !wo) return;

    if (
      !hasValidCoordinates(tech) ||
      !hasValidCoordinates(wo)
    ) {
      return;
    }

    const line = L.polyline(
      [
        [tech.latitude, tech.longitude],
        [wo.latitude, wo.longitude],
      ],
      {
        color: '#0284c7',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      }
    ).addTo(map);

    proximityLineLayerRef.current = line;

    map.fitBounds(line.getBounds(), {
      padding: [50, 50],
    });
  }, [
    selectedTechId,
    selectedWoId,
    validTechnicians,
    validGeoRecords,
  ]);

  // ==========================================================
  // K. SELECTED WORK ORDER
  // ==========================================================

  const selectedWo = useMemo(() => {
    return records.find(
      record =>
        String(record.OFFERNUM || '') === selectedWoId
    );
  }, [
    records,
    selectedWoId,
  ]);

  // ==========================================================
  // L. SELECTED TECHNICIAN
  // ==========================================================

  const selectedTech = useMemo(() => {
    return validTechnicians.find(
      technician =>
        technician.technicianId === selectedTechId
    );
  }, [
    validTechnicians,
    selectedTechId,
  ]);

  // ==========================================================
  // M. HAVERSINE DISTANCE
  // ==========================================================

  const proximityDistance = useMemo(() => {
    if (
      !selectedTech ||
      !selectedWo ||
      !hasValidCoordinates(selectedTech) ||
      !hasValidCoordinates(selectedWo)
    ) {
      return null;
    }

    return calculateHaversineDistanceMeters(
      selectedTech.latitude,
      selectedTech.longitude,
      selectedWo.latitude,
      selectedWo.longitude
    );
  }, [
    selectedTech,
    selectedWo,
  ]);

  // ==========================================================
  // N. RESET MAP VIEW
  // ==========================================================

  const handleResetView = () => {
    const map = mapInstanceRef.current;

    if (!map) return;

    if (geocodedRecords.length > 0) {
      const bounds = L.latLngBounds(
        geocodedRecords.map(record => [
          record.latitude,
          record.longitude,
        ] as L.LatLngTuple)
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });

      return;
    }

    if (validTechnicians.length > 0) {
      const bounds = L.latLngBounds(
        validTechnicians.map(tech => [
          tech.latitude,
          tech.longitude,
        ] as L.LatLngTuple)
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });

      return;
    }

    map.setView([-6.2297, 106.8166], 11);
  };

  // ==========================================================
  // O. RENDER
  // ==========================================================

  return (
    <div className="space-y-4">

      {/* GIS TOOLBAR */}

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Geographic Intelligence & Monitoring GPS
              </span>

              <span className="text-slate-300">·</span>

              <span className="text-xs font-mono font-medium text-emerald-700 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                {activeTechCount} Teknisi Berbagi Lokasi
              </span>

            </div>

            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Peta Operasional Wilayah PT. Anugerah Terang Persada
            </h2>
          </div>

          {/* QUICK ACTIONS */}

          <div className="flex items-center gap-2 flex-wrap">

            <button
              type="button"
              onClick={handleResetView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Pusatkan Wilayah</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setShowTechFleet(previous => !previous)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                showTechFleet
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />

              <span>
                {showTechFleet
                  ? 'Sembunyikan Armada'
                  : 'Tampilkan Armada'}
              </span>
            </button>

          </div>
        </div>

        {/* FILTER CONTROLS */}

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">

          {/* NETWORK FILTER */}

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">

            {(['ALL', 'FTTH', 'HFC'] as const).map(type => (
              <button
                type="button"
                key={type}
                onClick={() => setNetworkFilter(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  networkFilter === type
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'ALL' ? 'Semua Jaringan' : type}
              </button>
            ))}

          </div>

          {/* BRANCH FILTER */}

          <div className="flex items-center gap-1">

            <span className="text-slate-400">
              Cabang:
            </span>

            <select
              value={branchFilter}
              onChange={event =>
                setBranchFilter(event.target.value)
              }
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="ALL">
                Semua Cabang ({branches.length})
              </option>

              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

          </div>

          {/* ANOMALY FILTER */}

          <button
            type="button"
            onClick={() =>
              setAnomalyOnly(previous => !previous)
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              anomalyOnly
                ? 'bg-red-50 border-red-300 text-red-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />

            <span>
              Hanya Titik Deviasi / Anomali
            </span>
          </button>

          {/* SEARCH */}

          <div className="relative flex-1 min-w-[200px]">

            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Cari ID WO, Teknisi, atau Cabang..."
              value={searchQuery}
              onChange={event =>
                setSearchQuery(event.target.value)
              }
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />

          </div>

          {/* TOTAL MARKERS */}

          <span className="text-slate-500 font-mono tabular-nums text-xs ml-auto">
            {geocodedRecords.length} Titik Terpetakan
          </span>

        </div>
      </div>

      {/* MAP AND INSPECTOR */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* MAP CANVAS */}

        <div className="lg:col-span-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm h-[520px] relative">

          <div
            ref={mapContainerRef}
            className="w-full h-full z-10"
          />

          {/* MAP LEGEND */}

          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-2.5 rounded-lg border border-slate-200 shadow-md text-[11px] font-mono space-y-1 pointer-events-none">

            <div className="font-sans font-bold text-slate-800 text-xs mb-1">
              Legenda Peta
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
              <span>Work Order FTTH</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
              <span>Work Order HFC</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600 inline-block" />
              <span>Indikasi Deviasi / Anomali</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-slate-900 inline-block" />
              <span>Posisi GPS Teknisi</span>
            </div>

          </div>

          {/* EMPTY MAP MESSAGE */}

          {geocodedRecords.length === 0 &&
            validTechnicians.length === 0 && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">

                <div className="bg-white/95 border border-slate-200 shadow-lg rounded-xl px-5 py-4 text-center max-w-xs">

                  <p className="text-sm font-bold text-slate-800">
                    Belum Ada Koordinat
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Import Work Order yang memiliki latitude
                    dan longitude valid untuk menampilkan
                    titik pada peta.
                  </p>

                </div>
              </div>
            )}

        </div>

        {/* RIGHT SIDEBAR */}

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 lg:col-span-1 flex flex-col justify-between">

          <div className="space-y-3">

            <div className="border-b border-slate-100 pb-2">

              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inspektur Jarak Teknisi & Tikor
              </h3>

              <p className="text-[11px] text-slate-500 mt-0.5">
                Perhitungan jarak Haversine antara lokasi
                teknisi dan koordinat Work Order.
              </p>

            </div>

            {/* SELECT TECHNICIAN */}

            <div>

              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Pilih Teknisi:
              </label>

              <select
                value={selectedTechId}
                onChange={event =>
                  setSelectedTechId(event.target.value)
                }
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-900"
              >
                <option value="">
                  — Pilih Teknisi —
                </option>

                {validTechnicians.map(tech => (
                  <option
                    key={tech.technicianId}
                    value={tech.technicianId}
                  >
                    {tech.technicianName}
                    {' '}
                    ({tech.isSharingActive
                      ? 'Aktif'
                      : 'Non-Aktif'})
                  </option>
                ))}
              </select>

            </div>

            {/* SELECT WORK ORDER */}

            <div>

              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Pilih Tiket WO:
              </label>

              <select
                value={selectedWoId}
                onChange={event =>
                  setSelectedWoId(event.target.value)
                }
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              >
                <option value="">
                  — Pilih Work Order —
                </option>

                {geocodedRecords.slice(0, 100).map(wo => (
                  <option
                    key={wo.OFFERNUM}
                    value={String(wo.OFFERNUM || '')}
                  >
                    {wo.OFFERNUM} — {wo.installer || '-'}
                  </option>
                ))}
              </select>

            </div>

            {/* DISTANCE CARD */}

            {proximityDistance !== null ? (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  proximityDistance > 1000
                    ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                    : 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                }`}
              >

                <div className="flex items-center justify-between">

                  <span className="font-semibold">
                    Jarak Haversine:
                  </span>

                  <span className="font-mono text-sm font-bold">
                    {formatDistance(proximityDistance)}
                  </span>

                </div>

                <div className="text-[11px] leading-relaxed pt-1">

                  {proximityDistance > 1000 ? (
                    <span className="text-amber-800">
                      Jarak koordinat lebih dari 1 km.
                      Perlu pemeriksaan lebih lanjut.
                    </span>
                  ) : (
                    <span className="text-emerald-800">
                      Jarak koordinat berada dalam radius 1 km.
                    </span>
                  )}

                </div>

                <p className="text-[10px] text-slate-500 pt-1">
                  Jarak garis lurus, bukan jarak perjalanan
                  jalan raya.
                </p>

              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-[11px]">
                Pilih teknisi dan Work Order untuk menghitung
                jarak.
              </div>
            )}

            {/* SELECTED WO DETAILS */}

            {selectedWo && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">

                <div className="flex items-center justify-between font-mono">

                  <span className="font-bold text-slate-900">
                    {selectedWo.OFFERNUM}
                  </span>

                  <span className="text-[10px] bg-slate-200 px-1 rounded">
                    {selectedWo.networkType}
                  </span>

                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5">

                  <div>
                    Teknisi: {selectedWo.installer || '-'}
                  </div>

                  <div>
                    Tugas: {selectedWo.jobTask || '-'}
                  </div>

                  <div>
                    Hasil: {selectedWo.resultChoice || '-'}
                  </div>

                  <div className="font-mono text-[10px] text-slate-500">
                    Akun: {
                      maskCustomerData(
                        selectedWo.CUST_ACCT,
                        'acct'
                      )
                    }
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => onSelectRecord(selectedWo)}
                  className="w-full mt-2 py-1 px-2 text-[11px] font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />

                  <span>
                    Buka Dossier Investigatif
                  </span>
                </button>

              </div>
            )}

          </div>

          {/* FOOTER */}

          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2 font-mono">
            Sistem GIS PT. ATP · OpenStreetMap
          </div>

        </div>
      </div>
    </div>
  );
};