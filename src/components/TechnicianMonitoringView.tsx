/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Technician GPS Monitoring & Fleet Operations View
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  Battery,
  Shield,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { TechnicianLocation, UserAccount } from '../types/telco';

interface TechnicianMonitoringViewProps {
  technicians: TechnicianLocation[];
  currentUser: UserAccount | null;
  onNavigateToMap: () => void;
  onToggleSharing: (techId: string, active: boolean) => void;
}

export const TechnicianMonitoringView: React.FC<TechnicianMonitoringViewProps> = ({
  technicians,
  currentUser,
  onNavigateToMap,
  onToggleSharing,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  const filteredTechs = technicians.filter(t => {
    if (selectedBranch !== 'ALL' && t.assignedBranch !== selectedBranch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.technicianName.toLowerCase().includes(q) ||
        t.technicianId.toLowerCase().includes(q) ||
        t.assignedBranch.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeSharingCount = technicians.filter(t => t.isSharingActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              FLEET GPS SURVEILLANCE
            </span>
            <span className="text-xs text-slate-400 font-mono">Persetujuan Eksplisit & Retensi Terbatas</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Monitoring Lapangan Armada Teknisi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Pemantauan presensi dan pergerakan armada secara real-time. Pelacakan GPS hanya aktif atas izin sukarela teknisi untuk keperluan penugasan Work Order resmi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Armada Aktif</span>
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              {activeSharingCount} / {technicians.length}
            </span>
          </div>

          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Lihat di Peta GIS</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama teknisi, ID, cabang..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Semua Cabang (Branch)</option>
          <option value="Cabang Jakarta Selatan">Cabang Jakarta Selatan</option>
          <option value="Cabang Jakarta Barat">Cabang Jakarta Barat</option>
          <option value="Cabang Bandung Hub">Cabang Bandung Hub</option>
          <option value="Cabang Tangerang">Cabang Tangerang</option>
          <option value="Cabang Surabaya">Cabang Surabaya</option>
        </select>
      </div>

      {/* Technician Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTechs.map(tech => {
          return (
            <div
              key={tech.technicianId}
              className={`p-4 rounded-2xl border transition-all ${
                tech.isSharingActive
                  ? 'border-slate-800 bg-[#091124] shadow-sm'
                  : 'border-slate-800/60 bg-slate-950/60 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center font-bold font-mono text-xs">
                    {tech.technicianName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{tech.technicianName}</span>
                      {tech.isSharingActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      ID: {tech.technicianId} · {tech.assignedBranch}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    tech.isSharingActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tech.isSharingActive ? 'LIVE GPS' : 'OFFLINE'}
                </span>
              </div>

              {/* Coordinates and Location Info */}
              <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Koordinat GPS:
                  </span>
                  <span className="font-mono text-cyan-300">
                    {tech.latitude.toFixed(4)}, {tech.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Update Terakhir:
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(tech.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Akurasi GPS:
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    ±{tech.accuracy || 10} meter
                  </span>
                </div>
              </div>

              {/* Action: Toggle GPS Sharing */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Status Izin Berbagi:
                </span>

                <button
                  onClick={() => onToggleSharing(tech.technicianId, !tech.isSharingActive)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tech.isSharingActive
                      ? 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-800'
                      : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800'
                  }`}
                >
                  {tech.isSharingActive ? 'Hentikan Berbagi' : 'Aktifkan GPS'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
