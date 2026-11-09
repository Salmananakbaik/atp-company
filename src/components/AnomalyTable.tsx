/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * High-Density Operational Work Order Table
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  Building,
} from 'lucide-react';
import { PreprocessedWorkOrder } from '../types/telco';
import { maskCustomerData } from '../utils/columnMapper';

interface AnomalyTableProps {
  records: PreprocessedWorkOrder[];
  onSelectRecord: (record: PreprocessedWorkOrder) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({
  records,
  onSelectRecord,
  selectedFilter,
  setSelectedFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<'mlScore' | 'recordingWindowMinutes' | 'schDate' | 'CUST_ACCT'>('CUST_ACCT');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Filter type (anomalies, ftth, hfc, etc.)
    if (selectedFilter === 'anomalies') {
      result = result.filter(r => r.compositeSeverity !== 'NORMAL');
    } else if (selectedFilter === 'rules') {
      result = result.filter(r => r.ruleViolations.length > 0);
    } else if (selectedFilter === 'ftth') {
      result = result.filter(r => r.networkType === 'FTTH');
    } else if (selectedFilter === 'hfc') {
      result = result.filter(r => r.networkType === 'HFC');
    }

    // Branch filter
    if (branchFilter !== 'ALL') {
      result = result.filter(r => (r.Branch || '').toUpperCase() === branchFilter.toUpperCase());
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(r => (r.resultChoice || '').toUpperCase() === statusFilter.toUpperCase());
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        r =>
          (r.CUST_ACCT || '').toLowerCase().includes(q) ||
          (r.OFFERNUM || '').toLowerCase().includes(q) ||
          (r.Customer_Name || '').toLowerCase().includes(q) ||
          (r.Address || '').toLowerCase().includes(q) ||
          (r.installer || '').toLowerCase().includes(q) ||
          (r.jobTask || '').toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;

      if (sortBy === 'mlScore') {
        aVal = a.mlScore;
        bVal = b.mlScore;
      } else if (sortBy === 'recordingWindowMinutes') {
        aVal = a.recordingWindowMinutes ?? -999;
        bVal = b.recordingWindowMinutes ?? -999;
      } else if (sortBy === 'schDate') {
        aVal = a.schDate || '';
        bVal = b.schDate || '';
      } else if (sortBy === 'CUST_ACCT') {
        aVal = a.CUST_ACCT || '';
        bVal = b.CUST_ACCT || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, selectedFilter, branchFilter, statusFilter, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter Tabs & Branch Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091124] border border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari CUST_ACCT, nama pelanggan, teknisi..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Category */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <button
              onClick={() => { setSelectedFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({records.length})
            </button>
            <button
              onClick={() => { setSelectedFilter('anomalies'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'anomalies'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Indikasi Deviasi</span>
            </button>
            <button
              onClick={() => { setSelectedFilter('ftth'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'ftth'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FTTH
            </button>
            <button
              onClick={() => { setSelectedFilter('hfc'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedFilter === 'hfc'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HFC
            </button>
          </div>

          {/* Branch Dropdown */}
          <select
            value={branchFilter}
            onChange={e => { setBranchFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">Semua Branch</option>
            <option value="TANGERANG">Tangerang</option>
            <option value="WEST">Jakarta Barat (West)</option>
            <option value="SOUTH">Jakarta Selatan (South)</option>
            <option value="SURABAYA">Surabaya</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCEL">CANCEL</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#091124] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 font-mono uppercase tracking-wider select-none">
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-white"
                  onClick={() => handleSort('CUST_ACCT')}
                >
                  <div className="flex items-center gap-1">
                    <span>CUST_ACCT</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3">Nama Pelanggan</th>
                <th className="py-3 px-3">Alamat</th>
                <th className="py-3 px-3">Job Task</th>
                <th className="py-3 px-3">Jadwal (SCH)</th>
                <th className="py-3 px-3">Teknisi</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('recordingWindowMinutes')}
                >
                  <div className="flex items-center gap-1">
                    <span>START - FINISH</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Hasil</th>
                <th className="py-3 px-3 text-center">Jaringan</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Indikasi SOP / AI</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada data Work Order yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(item => {
                  const isAnomaly = item.compositeSeverity !== 'NORMAL';
                  const isZeroDuration = item.recordingWindowMinutes === 0;
                  const isShortDuration = item.recordingWindowMinutes !== null && item.recordingWindowMinutes > 0 && item.recordingWindowMinutes < 10;
                  const isFtth = item.networkType === 'FTTH';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectRecord(item)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isAnomaly ? 'bg-red-950/10' : ''
                      }`}
                    >
                      {/* CUST_ACCT */}
                      <td className="py-3 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isAnomaly && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                          <span>{item.CUST_ACCT}</span>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 text-slate-200 font-medium whitespace-nowrap">
                        {item.Customer_Name}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[200px] truncate" title={item.Address}>
                        {item.Address}
                      </td>

                      {/* Job Task */}
                      <td className="py-3 px-3 font-mono text-[11px] text-cyan-300 font-medium whitespace-nowrap">
                        {item.jobTask}
                      </td>

                      {/* Schedule (SCH Date & Time) */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-300 whitespace-nowrap">
                        <div>{item.schDate}</div>
                        <div className="text-[10px] text-slate-500">{item.schTime}</div>
                      </td>

                      {/* Installer */}
                      <td className="py-3 px-3 font-mono text-white font-semibold whitespace-nowrap">
                        {item.installer}
                      </td>

                      {/* START - FINISH & Duration */}
                      <td className="py-3 px-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        <div className="text-slate-200">
                          {item.start || '-'} - {item.finish || '-'}
                        </div>
                        <span
                          className={`text-[10px] font-bold block ${
                            isZeroDuration
                              ? 'text-amber-400'
                              : isShortDuration
                              ? 'text-orange-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.recordingWindowMinutes !== null
                            ? `${item.recordingWindowMinutes} mnt ${isZeroDuration ? '(NOL)' : ''}`
                            : 'N/A'}
                        </span>
                      </td>

                      {/* Result Choice */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.resultChoice === 'COMPLETE' || item.resultChoice === 'DONE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : item.resultChoice === 'CANCEL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {item.resultChoice}
                        </span>
                      </td>

                      {/* Jenis Jaringan */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isFtth
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-teal-950 text-teal-400 border border-teal-800'
                          }`}
                        >
                          {item.networkType}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-3 font-medium text-slate-300 text-xs whitespace-nowrap">
                        {item.Branch}
                      </td>

                      {/* Indikasi Anomali & SOP Rules */}
                      <td className="py-3 px-3 max-w-[200px]">
                        {item.ruleViolations.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono font-bold text-red-400 block truncate">
                              {item.ruleViolations[0].ruleName}
                            </span>
                            {item.ruleViolations.length > 1 && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                +{item.ruleViolations.length - 1} deviasi lainnya
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Aksi Button */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectRecord(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan <strong className="text-white font-mono">{paginatedRecords.length}</strong> dari{' '}
            <strong className="text-white font-mono">{filteredRecords.length}</strong> data Work Order
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px]">
              Halaman {currentPage} dari {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
