/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Master Data Management View
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import { Database, Building2, Layers, Wrench, Search, Plus, CheckCircle2 } from 'lucide-react';
import { BranchInfo, SiteInfo, JobTypeInfo } from '../types/telco';

const INITIAL_BRANCHES: BranchInfo[] = [
  {
    id: 'br-01',
    code: 'JKT-SEL',
    name: 'Cabang Jakarta Selatan',
    region: 'Jabodetabek 1',
    coverageArea: 'Kebayoran, Cilandak, Pasar Minggu, Jagakarsa',
    activeTechniciansCount: 14,
    totalWorkOrdersCount: 2408,
    slaRate: 98.2,
  },
  {
    id: 'br-02',
    code: 'JKT-BAR',
    name: 'Cabang Jakarta Barat',
    region: 'Jabodetabek 1',
    coverageArea: 'Grogol, Cengkareng, Kebon Jeruk, Kembangan',
    activeTechniciansCount: 18,
    totalWorkOrdersCount: 3116,
    slaRate: 97.4,
  },
  {
    id: 'br-03',
    code: 'TNG',
    name: 'Cabang Tangerang',
    region: 'Banten & West Hub',
    coverageArea: 'Tangerang Kota, Serpong, BSD, Karawaci, Ciledug',
    activeTechniciansCount: 22,
    totalWorkOrdersCount: 4208,
    slaRate: 98.9,
  },
  {
    id: 'br-04',
    code: 'SBY',
    name: 'Cabang Surabaya',
    region: 'Jawa Timur Hub',
    coverageArea: 'Surabaya Pusat, Waru, Sidoarjo, Rungkut',
    activeTechniciansCount: 12,
    totalWorkOrdersCount: 1962,
    slaRate: 96.8,
  },
  {
    id: 'br-05',
    code: 'BDG',
    name: 'Cabang Bandung Hub',
    region: 'Jawa Barat Hub',
    coverageArea: 'Dago, Buahbatu, Antapani, Cimahi',
    activeTechniciansCount: 10,
    totalWorkOrdersCount: 1540,
    slaRate: 97.9,
  },
];

const INITIAL_JOB_TYPES: JobTypeInfo[] = [
  {
    id: 'jt-01',
    jobType: 'INSTALLATION',
    jobTask: 'INSTALLASI BARU FTTH',
    standardDurationMinutes: 120,
    defaultNetwork: 'FTTH',
    slaHours: 24,
    description: 'Pemasangan Drop Core, Optical Network Terminal (ONT), dan verifikasi redaman (Rx <= -24 dBm).',
  },
  {
    id: 'jt-02',
    jobType: 'INSTALLATION',
    jobTask: 'INSTALLASI BARU HFC',
    standardDurationMinutes: 90,
    defaultNetwork: 'HFC',
    slaHours: 24,
    description: 'Pemasangan kabel koaksial RG6, splitter tap, dan modem kabel DOCSIS 3.1.',
  },
  {
    id: 'jt-03',
    jobType: 'MAINTENANCE',
    jobTask: 'GANGGUAN REDAMAN / LOS',
    standardDurationMinutes: 60,
    defaultNetwork: 'FTTH',
    slaHours: 4,
    description: 'Perbaikan konektor fast connector, splicing ulang kabel drop core, dan inspeksi port FAT.',
  },
  {
    id: 'jt-04',
    jobType: 'DISMANTLE',
    jobTask: 'COLLECT CPE',
    standardDurationMinutes: 30,
    defaultNetwork: 'HFC',
    slaHours: 48,
    description: 'Penarikan perangkat modem/STB pada pelanggan terminated atau penutupan layanan.',
  },
];

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BRANCH' | 'JOB_TYPE'>('BRANCH');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-cyan-400 border border-blue-800">
              TELECOM MASTER ENTITIES
            </span>
            <span className="text-xs text-slate-400 font-mono">Struktur Referensi Wilayah & Operasional</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Master Data Operasional Telekomunikasi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Data acuan cabang regional, pemetaan Site ID / Fibernode, dan parameter standar durasi SLA penugasan.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('BRANCH')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'BRANCH'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cabang Regional ({INITIAL_BRANCHES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('JOB_TYPE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'JOB_TYPE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Katalog Jenis Pekerjaan ({INITIAL_JOB_TYPES.length})</span>
        </button>
      </div>

      {/* Tab 1: Branches Grid */}
      {activeTab === 'BRANCH' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INITIAL_BRANCHES.map(branch => (
            <div
              key={branch.id}
              className="p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    {branch.code} · {branch.region}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {branch.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  SLA {branch.slaRate}%
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Cakupan Area: {branch.coverageArea}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Teknisi Aktif</span>
                  <span className="text-white font-mono font-bold">{branch.activeTechniciansCount} Personel</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Total Work Order</span>
                  <span className="text-cyan-400 font-mono font-bold">{branch.totalWorkOrdersCount.toLocaleString()} WO</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Job Types List */}
      {activeTab === 'JOB_TYPE' && (
        <div className="rounded-2xl border border-slate-800 bg-[#091124] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Kategori Job Type</th>
                <th className="py-3 px-4">Job Task</th>
                <th className="py-3 px-4">Jaringan Default</th>
                <th className="py-3 px-4 text-center">Durasi Standar</th>
                <th className="py-3 px-4 text-center">SLA Penyelesaian</th>
                <th className="py-3 px-4">Deskripsi Teknis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {INITIAL_JOB_TYPES.map(jt => (
                <tr key={jt.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {jt.jobType}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {jt.jobTask}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        jt.defaultNetwork === 'FTTH'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {jt.defaultNetwork}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-cyan-300 font-semibold">
                    {jt.standardDurationMinutes} menit
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-400">
                    {jt.slaHours} jam
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs leading-relaxed">
                    {jt.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
