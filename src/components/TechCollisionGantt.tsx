/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Clock, User, AlertTriangle, Eye, Calendar, ShieldAlert } from 'lucide-react';
import { PreprocessedWorkOrder } from '../types/telco';

interface TechCollisionGanttProps {
  records: PreprocessedWorkOrder[];
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
}

export const TechCollisionGantt: React.FC<TechCollisionGanttProps> = ({
  records,
  onSelectRecord,
}) => {
  // Find technicians with collisions (Rule 6)
  const collidingRecords = useMemo(() => {
    return records.filter(r => r.ruleViolations.some(v => v.ruleId === 'R6'));
  }, [records]);

  // Extract unique technicians and dates that have collisions
  const techDateList = useMemo(() => {
    const map = new Map<string, { installer: string; date: string; count: number }>();
    collidingRecords.forEach(r => {
      const key = `${r.installer}___${r.schDate}`;
      if (!map.has(key)) {
        map.set(key, { installer: r.installer, date: r.schDate, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.values());
  }, [collidingRecords]);

  // Selected technician and date
  const [selectedTech, setSelectedTech] = useState<string>(
    techDateList[0]?.installer || 'Ahmad Fauzi'
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    techDateList[0]?.date || '2024-03-15'
  );

  // All jobs for selected technician and date
  const techJobs = useMemo(() => {
    return records
      .filter(r => r.installer === selectedTech && r.schDate === selectedDate)
      .sort((a, b) => {
        const aStart = a.startDateTime ? a.startDateTime.getTime() : 0;
        const bStart = b.startDateTime ? b.startDateTime.getTime() : 0;
        return aStart - bStart;
      });
  }, [records, selectedTech, selectedDate]);

  // Timeline bounds: 07:00 (420 mins) to 20:00 (1200 mins) = 780 minutes total
  const TIMELINE_START_MINUTES = 7 * 60; // 07:00
  const TIMELINE_END_MINUTES = 20 * 60; // 20:00
  const TOTAL_TIMELINE_MINUTES = TIMELINE_END_MINUTES - TIMELINE_START_MINUTES;

  // Convert time string "HH:mm" to minutes from 07:00
  const getMinutesOffset = (timeStr: string) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const total = h * 60 + m;
    return Math.max(0, Math.min(TOTAL_TIMELINE_MINUTES, total - TIMELINE_START_MINUTES));
  };

  const hoursMarks = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analisis Visual SOP Rule 6
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs font-mono font-medium text-amber-700">
                {collidingRecords.length} Tiket Bertabrakan
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Gantt Chart Jadwal & Deteksi Tabrakan Waktu Teknisi
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Memvisualisasikan alokasi slot jam mulai (`START`) dan jam selesai (`FINISH`) per teknisi. Garis bertumpuk mengindikasikan teknisi yang sama tercatat bekerja pada 2 lokasi bersamaan.
            </p>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <label className="text-[11px] text-slate-500 block mb-0.5">Pilih Teknisi</label>
              <select
                value={selectedTech}
                onChange={e => setSelectedTech(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium"
              >
                {Array.from(new Set(records.map(r => r.installer))).map(tech => {
                  const hasCollision = collidingRecords.some(r => r.installer === tech);
                  return (
                    <option key={tech} value={tech}>
                      {tech} {hasCollision ? '⚠️ (Tabrakan)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-0.5">Pilih Tanggal</label>
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono"
              >
                {Array.from(new Set(records.filter(r => r.installer === selectedTech).map(r => r.schDate))).map(d => (
                  <option key={d} value={d}>
                    {d || 'Tanggal Kosong'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Visual Area */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-900">{selectedTech}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono text-slate-600">{selectedDate}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-600">{techJobs.length} Pekerjaan</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 inline-block" />
              <span>Jadwal Normal</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
              <span>Bertabrakan (Rule 6)</span>
            </span>
          </div>
        </div>

        {/* Timeline Axis */}
        <div className="relative pt-6 pb-2">
          {/* Time markers */}
          <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px] font-mono text-slate-400">
            {hoursMarks.map(h => (
              <span key={h} className="text-center w-8">
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {/* Job Bars Container */}
          <div className="mt-4 space-y-3 min-h-[160px]">
            {techJobs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada tiket yang terjadwal untuk teknisi ini pada tanggal yang dipilih.
              </div>
            ) : (
              techJobs.map((job, idx) => {
                const startOffset = getMinutesOffset(job.start);
                const finishOffset = getMinutesOffset(job.finish);

                const hasValidTimes = startOffset !== null && finishOffset !== null && finishOffset >= startOffset;
                const leftPercent = hasValidTimes ? (startOffset! / TOTAL_TIMELINE_MINUTES) * 100 : 0;
                const widthPercent = hasValidTimes
                  ? Math.max(3, ((finishOffset! - startOffset!) / TOTAL_TIMELINE_MINUTES) * 100)
                  : 10;

                const isCollision = job.ruleViolations.some(v => v.ruleId === 'R6');

                return (
                  <div key={job.id} className="relative h-14 bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center">
                    <div className="w-48 shrink-0 text-xs truncate pr-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-900">{job.OFFERNUM}</span>
                        {isCollision && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{job.jobTask}</span>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative h-9 bg-slate-100 rounded overflow-hidden">
                      {hasValidTimes ? (
                        <div
                          onClick={() => onSelectRecord(job)}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded px-2 flex items-center justify-between text-[11px] font-mono text-white cursor-pointer transition-all shadow-xs hover:opacity-90 ${
                            isCollision ? 'bg-amber-700' : 'bg-slate-800'
                          }`}
                          title={`Klik untuk melihat dossier: ${job.start} s/d ${job.finish}`}
                        >
                          <span className="truncate font-semibold">{job.start} - {job.finish}</span>
                          <span className="hidden sm:inline text-[10px] opacity-80 pl-1">
                            {job.recordingWindowMinutes}m
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[11px] text-red-600 font-mono">
                          Format jam tidak valid ({job.start || '-'} s/d {job.finish || '-'})
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectRecord(job)}
                      className="ml-3 p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-200/50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
