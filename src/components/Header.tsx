/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Top Bar Header (3-Zone Enterprise NOC Contract)
 * PT. ANUGERAH TERANG PERSADA
 */

import React from 'react';
import { Download, ShieldCheck, User, LogOut, Radio } from 'lucide-react';
import { UserAccount } from '../types/telco';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportExcel: () => void;
  totalRecords: number;
  anomalyCount: number;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  totalRecords,
  anomalyCount,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      {/* Zone 1: Brand title wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
          ATP
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
            FTTH & HFC Intelligence
          </span>
          <span className="text-[10px] text-slate-400 font-mono tracking-normal block -mt-0.5">
            PT. ANUGERAH TERANG PERSADA
          </span>
        </div>
      </div>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Ringkasan NOC
        </button>
        <button
          onClick={() => setActiveTab('gis')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer flex items-center gap-1 ${
            activeTab === 'gis'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          <span>Peta GIS & Armada</span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'records'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Data WO ({totalRecords})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'rules'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Validasi SOP (9 Rule)
        </button>
        <button
          onClick={() => setActiveTab('gantt')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'gantt'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Gantt Benturan (Rule 6)
        </button>
        <button
          onClick={() => setActiveTab('isolation_forest')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'isolation_forest'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Isolation Forest
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Laporan
        </button>
        <button
          onClick={() => setActiveTab('technician_portal')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'technician_portal'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          Portal Teknisi
        </button>
        <button
          onClick={() => setActiveTab('prompt_matrix')}
          className={`whitespace-nowrap transition-colors pb-0.5 cursor-pointer ${
            activeTab === 'prompt_matrix'
              ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
              : 'hover:text-white'
          }`}
        >
          # Matriks Prompt
        </button>
      </nav>

      {/* Zone 3: 1 primary action & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 mr-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privasi Aktif</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-semibold text-amber-400">
            {anomalyCount} Deviasi
          </span>
        </div>

        {/* User Account / Role Badge */}
        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer"
              title="Ganti Peran atau Lihat Profil"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                {currentUser.role[0]}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-semibold text-white block truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono block -mt-0.5">
                  {currentUser.role}
                </span>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              title="Keluar (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            Masuk / Login
          </button>
        )}

        <button
          onClick={onExportExcel}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Excel</span>
        </button>
      </div>
    </header>
  );
};
