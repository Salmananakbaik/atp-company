/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PreprocessedWorkOrder } from '../types/telco';

interface TimelineViewerProps {
  record: PreprocessedWorkOrder;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ record }) => {
  const formatTimestamp = (d: Date | null, fallback: string) => {
    if (!d) return fallback || 'Tidak Tercatat';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const steps = [
    {
      label: 'Jadwal (SCH Date)',
      val: record.schDate ? `${record.schDate} ${record.schTime || ''}` : '-',
      time: record.schDateTime?.getTime(),
      status: record.schDate ? 'ok' : 'missing',
    },
    {
      label: 'Jam START',
      val: record.start || '-',
      time: record.startDateTime?.getTime(),
      status: record.start ? 'ok' : 'missing',
    },
    {
      label: 'Jam FINISH',
      val: record.finish || '-',
      time: record.finishDateTime?.getTime(),
      status: record.recordingWindowMinutes !== null && record.recordingWindowMinutes < 0 ? 'error' : record.finish ? 'ok' : 'missing',
      annotation: record.recordingWindowMinutes !== null ? `${record.recordingWindowMinutes} mnt` : undefined,
    },
    {
      label: 'Report Date',
      val: formatTimestamp(record.reportDateTime, record.reportDate),
      time: record.reportDateTime?.getTime(),
      status: record.reportDate ? 'ok' : 'missing',
    },
    {
      label: 'Update Date',
      val: formatTimestamp(record.updateDateTime, record.updateDate),
      time: record.updateDateTime?.getTime(),
      status:
        record.updateDateTime && record.reportDateTime && record.updateDateTime.getTime() < record.reportDateTime.getTime() - 120000
          ? 'error'
          : 'ok',
    },
    {
      label: 'CloseDate (WOM)',
      val: formatTimestamp(record.closeDateTime, record.closeDate),
      time: record.closeDateTime?.getTime(),
      status:
        record.closeDateTime && record.reportDateTime && record.closeDateTime.getTime() < record.reportDateTime.getTime()
          ? 'error'
          : 'ok',
    },
  ];

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Alur Kronologis Siklus Waktu Tiket</span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Verifikasi Urutan & Inversi Waktu
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border text-xs ${
              step.status === 'error'
                ? 'border-red-200 bg-red-50/50 text-red-900'
                : step.status === 'missing'
                ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                : 'border-slate-100 bg-slate-50 text-slate-800'
            }`}
          >
            <span className="text-[10px] text-slate-500 block uppercase font-medium">{step.label}</span>
            <span className="font-mono font-semibold text-[11px] block mt-1 truncate">
              {step.val}
            </span>
            {step.annotation && (
              <span className={`text-[10px] font-mono font-bold block mt-0.5 ${step.status === 'error' ? 'text-red-700' : 'text-slate-500'}`}>
                {step.annotation}
              </span>
            )}
            {step.status === 'error' && (
              <span className="text-[10px] text-red-700 font-semibold block mt-1 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Inversi
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
