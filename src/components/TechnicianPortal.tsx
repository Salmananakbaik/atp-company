/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mobile-First Technician Dashboard & Authorized GPS Location Sharing Portal
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Radio,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
  FileText,
  Power,
  ClipboardList,
  Activity,
} from 'lucide-react';
import {
  PreprocessedWorkOrder,
  TechnicianLocation,
  UserAccount,
} from '../types/telco';
import { maskCustomerData } from '../utils/columnMapper';

interface TechnicianPortalProps {
  currentUser: UserAccount;
  records: PreprocessedWorkOrder[];
  technicianLocation?: TechnicianLocation;
  onUpdateLocation: (location: Partial<TechnicianLocation>) => void;
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
  onUpdateWoStatus: (
    woId: string,
    updates: Partial<PreprocessedWorkOrder>
  ) => void;
}

type TechnicianTab = 'assigned' | 'in_progress' | 'completed';

// Simpan foto teknisi di: public/images/technicians/AB96.jpg
// Ubah nama file/path ini jika foto teknisi yang digunakan berbeda.
const TECHNICIAN_PHOTO = '/AB96.jpeg';

const normalizeStatus = (value: unknown): string =>
  String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  currentUser,
  records,
  technicianLocation,
  onUpdateLocation,
  onSelectRecord,
  onUpdateWoStatus,
}) => {
  const technicianName = String(currentUser.fullName ?? '').trim();

  // Filter work orders assigned to the logged-in technician.
  // String(...) prevents errors if installer is null/undefined.
  const assignedRecords = useMemo(() => {
    const normalizedName = technicianName.toLowerCase();
    if (!normalizedName) return [];

    return records.filter((record) => {
      const installer = String(record.installer ?? '').trim().toLowerCase();
      return (
        installer.includes(normalizedName) ||
        normalizedName.includes(installer)
      );
    });
  }, [records, technicianName]);

  const [activeTab, setActiveTab] = useState<TechnicianTab>('assigned');
  const [isSharingGps, setIsSharingGps] = useState<boolean>(
    technicianLocation?.isSharingActive || false
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    time: string;
  } | null>(
    technicianLocation
      ? {
          lat: technicianLocation.latitude,
          lng: technicianLocation.longitude,
          accuracy: technicianLocation.accuracy,
          time: technicianLocation.timestamp,
        }
      : null
  );

  // Keep local GPS status synchronized when the parent updates the location.
  useEffect(() => {
    setIsSharingGps(Boolean(technicianLocation?.isSharingActive));
  }, [technicianLocation?.isSharingActive]);

  // Explicitly start/stop GPS sharing with technician consent.
  const handleToggleGpsSharing = () => {
    if (isSharingGps) {
      if (gpsWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
      setGpsWatchId(null);
      setIsSharingGps(false);
      setGpsError(null);
      onUpdateLocation({ isSharingActive: false });
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Perangkat atau browser tidak mendukung fitur GPS.');
      return;
    }

    setGpsError(null);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const nowStr = new Date().toISOString();

        setCurrentCoords({ lat, lng, accuracy, time: nowStr });
        setIsSharingGps(true);
        onUpdateLocation({
          latitude: lat,
          longitude: lng,
          accuracy,
          timestamp: nowStr,
          isSharingActive: true,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let message =
          'Izin akses GPS ditolak atau sinyal lokasi tidak tersedia.';
        if (error.code === 1) {
          message =
            'Izin akses lokasi ditolak. Izinkan lokasi melalui pengaturan browser.';
        } else if (error.code === 3) {
          message = 'Waktu mendapatkan lokasi habis. Silakan coba kembali.';
        }
        setGpsError(message);
        setIsSharingGps(false);
        setGpsWatchId(null);
        onUpdateLocation({ isSharingActive: false });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    setGpsWatchId(watchId);
  };

  // Clean up GPS watcher when the component is unmounted.
  useEffect(() => {
    return () => {
      if (gpsWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  // Record the time when a technician starts a work order.
  const handleStartJob = (record: PreprocessedWorkOrder) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onUpdateWoStatus(record.OFFERNUM, {
      start: timeStr,
      startDateTime: now,
      closeStatusWOM: 'IN_PROGRESS',
    });
  };

  // Record completion. Keep the existing database values for compatibility.
  const handleFinishJob = (record: PreprocessedWorkOrder) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onUpdateWoStatus(record.OFFERNUM, {
      finish: timeStr,
      finishDateTime: now,
      reportDate: now.toISOString(),
      reportDateTime: now,
      resultChoice: 'Done',
      closeStatusWOM: 'Closed',
    });
  };

  // Categorize tickets using the status fields first.
  // This fixes the previous Done vs DONE case-sensitive comparison.
  const completedList = useMemo(
    () =>
      assignedRecords.filter((record) => {
        const closeStatus = normalizeStatus(record.closeStatusWOM);
        const result = normalizeStatus(record.resultChoice);
        const isCompletedStatus =
          ['CLOSED', 'COMPLETED', 'DONE'].includes(closeStatus) ||
          ['DONE', 'COMPLETED'].includes(result);

        return isCompletedStatus && Boolean(record.finish);
      }),
    [assignedRecords]
  );

  const inProgressList = useMemo(
    () =>
      assignedRecords.filter((record) => {
        if (completedList.includes(record)) return false;

        const closeStatus = normalizeStatus(record.closeStatusWOM);
        if (['IN_PROGRESS', 'INPROGRESS', 'ONGOING', 'WORKING'].includes(closeStatus)) {
          return true;
        }

        // Fallback for records whose status field is empty but have a start time.
        return Boolean(record.start) && !record.finish && !closeStatus;
      }),
    [assignedRecords, completedList]
  );

  // Pending and CXL tickets remain in the new queue unless they are
  // explicitly in progress or completed.
  const pendingAssignedList = useMemo(
    () =>
      assignedRecords.filter(
        (record) =>
          !completedList.includes(record) && !inProgressList.includes(record)
      ),
    [assignedRecords, completedList, inProgressList]
  );

  const displayList =
    activeTab === 'assigned'
      ? pendingAssignedList
      : activeTab === 'in_progress'
        ? inProgressList
        : completedList;

  const performanceRate =
    assignedRecords.length > 0
      ? (completedList.length / assignedRecords.length) * 100
      : 0;

  const performanceText = performanceRate.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Technician Profile & Welcome Card */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!photoError ? (
              <img
                src={TECHNICIAN_PHOTO}
                alt={`Foto ${technicianName}`}
                onError={() => setPhotoError(true)}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {getInitials(technicianName)}
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                
              </span>
              <h1 className="text-base font-bold text-slate-900 truncate">
                {technicianName || 'Teknisi'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono flex-wrap">
                <span>{currentUser.branch}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">
                  Senior Field Tech L2
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {assignedRecords.length}
            </span>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Tiket Ditugaskan
            </span>
          </div>
        </div>
      </div>

      {/* Technician Performance */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Performa Penyelesaian Tiket
              </h2>
              <p className="text-xs text-slate-500">
                Persentase tiket selesai dari seluruh tiket yang ditugaskan.
              </p>
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {performanceText}%
          </span>
        </div>

        <div
          className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={Number(performanceRate.toFixed(1))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Persentase penyelesaian tiket"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${Math.min(100, performanceRate)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-lg bg-amber-50 p-3">
            <div className="text-lg font-bold font-mono text-amber-700">
              {pendingAssignedList.length}
            </div>
            <div className="text-[10px] font-medium text-amber-800">
              Pending / CXL
            </div>
          </div>
          <div className="rounded-lg bg-sky-50 p-3">
            <div className="text-lg font-bold font-mono text-sky-700">
              {inProgressList.length}
            </div>
            <div className="text-[10px] font-medium text-sky-800">
              Sedang Dikerjakan
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-lg font-bold font-mono text-emerald-700">
              {completedList.length}
            </div>
            <div className="text-[10px] font-medium text-emerald-800">
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* GPS Location Sharing Controller */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isSharingGps
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Radio
                className={`w-5 h-5 ${
                  isSharingGps ? 'animate-pulse text-emerald-600' : ''
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Status Berbagi Lokasi GPS
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    isSharingGps
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isSharingGps ? 'GPS AKTIF BERBAGI' : 'NON-AKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengiriman koordinat berkala untuk verifikasi radius penugasan
                Tikor di lapangan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGpsSharing}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs shrink-0 ${
              isSharingGps
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isSharingGps ? 'Hentikan Berbagi' : 'Aktifkan GPS'}</span>
          </button>
        </div>

        {currentCoords && isSharingGps && (
          <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 text-xs font-mono space-y-1">
            <div className="flex justify-between gap-2 text-emerald-950">
              <span>Koordinat Fisik Anda:</span>
              <span className="font-bold text-right">
                {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-emerald-800 text-[11px]">
              <span>
                Tingkat Akurasi GPS: ±{Math.round(currentCoords.accuracy)} meter
              </span>
              <span>{new Date(currentCoords.time).toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Lokasi hanya dibagikan selama jam kerja operasional aktif dan dapat
            dihentikan kapan saja.
          </span>
        </div>
      </div>

      {/* Technician Assigned Work Order Queue */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'assigned'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingAssignedList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'in_progress'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sedang Dikerjakan ({inProgressList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedList.length})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono shrink-0">
            {displayList.length} Tiket
          </span>
        </div>

        <div className="space-y-3">
          {displayList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Tidak ada tiket dalam kategori ini.
            </div>
          ) : (
            displayList.map((wo) => {
              const isCompleted = completedList.includes(wo);
              const isInProgress = inProgressList.includes(wo);

              return (
                <div
                  key={wo.id ?? wo.OFFERNUM}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {wo.OFFERNUM}
                        </span>
                        <span className="text-[10px] bg-slate-200 font-semibold text-slate-700 px-1.5 py-0.5 rounded">
                          {wo.networkType}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {wo.schDate} {wo.schTime}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">
                        {wo.jobTask}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {wo.jobType} · {wo.Branch}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectRecord(wo)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors shrink-0"
                      title="Lihat Detail Tiket"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Masked customer information */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-700 space-y-0.5">
                    <div className="text-[11px] text-slate-500">
                      Akun: {maskCustomerData(wo.CUST_ACCT, 'acct')} · Pelanggan:{' '}
                      {maskCustomerData(wo.Customer_Name, 'name')}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      Alamat: {maskCustomerData(wo.Address, 'address')}
                    </div>
                    {wo.hasValidGeoCoord && wo.latitude && wo.longitude && (
                      <div className="text-[10px] text-sky-700 pt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>
                          Tikor Target: {wo.latitude.toFixed(5)},{' '}
                          {wo.longitude.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Time & action controls */}
                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    <div className="text-xs font-mono text-slate-600">
                      {wo.start ? (
                        <span>
                          Jam Mulai: <strong>{wo.start}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum dimulai</span>
                      )}
                      {wo.finish && (
                        <span className="ml-3">
                          Selesai: <strong>{wo.finish}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted && !isInProgress && (
                        <button
                          type="button"
                          onClick={() => handleStartJob(wo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span>Terselesaikan</span>
                        </button>
                      )}

                      {isInProgress && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleFinishJob(wo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Selesai (FINISH)</span>
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
