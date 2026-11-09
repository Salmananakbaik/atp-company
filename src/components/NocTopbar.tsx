import React, { useState } from 'react';

import {
  CalendarDays,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  X,
  Server,
} from 'lucide-react';

import {
  UserAccount,
  BackendStatus,
} from '../types/telco';

interface NocTopbarProps {
  activeTab: string;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  backendStatus: BackendStatus;
  onOpenSettings: () => void;
}

export const NocTopbar: React.FC<NocTopbarProps> = ({
  activeTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  backendStatus,
  onOpenSettings,
}) => {
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showUserDropdown, setShowUserDropdown] =
    useState(false);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    records: 'Work Order',
    rules: 'Validasi SOP',
    isolation_forest: 'Isolation Forest',
    gis: 'Peta Operasional',
    monitoring_teknisi: 'Monitoring Teknisi',
    review_supervisor: 'Review Supervisor',
    reports: 'Laporan',
    master_data: 'Master Data',
    user_management: 'Manajemen Pengguna',
    settings: 'Pengaturan',
  };

  const title = pageTitles[activeTab] || 'Dashboard';

  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const userName = currentUser?.fullName || 'Supervisor';
  const userRole = currentUser?.role || 'Supervisor';

  const initial = userName
    .trim()
    .charAt(0)
    .toUpperCase() || 'S';

  const closeDropdowns = () => {
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  return (
    <header className="
      sticky top-0 z-[1000]
      w-full
      bg-[#091124]
      border-b border-slate-800
      text-white
    ">

      <div className="
        min-h-[68px]
        px-5 lg:px-7
        flex items-center
        justify-between
        gap-4
      ">

        {/* PAGE TITLE */}

        <div className="min-w-0">
          <h1 className="
            text-lg
            font-semibold
            tracking-tight
            text-white
            truncate
          ">
            {title}
          </h1>
        </div>

        {/* RIGHT ACTIONS */}

        <div className="
          flex items-center
          gap-2 sm:gap-4
          shrink-0
        ">

          {/* BACKEND STATUS */}

          <button
            type="button"
            onClick={onOpenSettings}
            title="Status koneksi backend"
            className="
              flex items-center
              gap-2
              px-2.5 py-2
              rounded-lg
              hover:bg-slate-800/70
              transition-colors
            "
          >

            <span className={`
              w-2 h-2
              rounded-full
              ${
                backendStatus.isConnected
                  ? 'bg-emerald-400'
                  : 'bg-red-400'
              }
            `} />

            <span className="hidden sm:block text-xs text-slate-300">
              {backendStatus.isConnected ? 'Online' : 'Offline'}
            </span>

          </button>

          {/* DATE */}

          <div className="
            hidden md:flex
            items-center
            gap-2
            text-xs
            text-slate-400
            border-l border-slate-800
            pl-4
          ">

            <CalendarDays className="w-4 h-4 text-slate-500" />

            <span>{today}</span>

          </div>

          {/* NOTIFICATION */}

          <div className="relative">

            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserDropdown(false);
              }}
              aria-label="Notifikasi"
              className="
                relative
                p-2.5
                rounded-lg
                text-slate-400
                hover:text-white
                hover:bg-slate-800
                transition-colors
              "
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>

            {showNotifications && (
              <div className="
                absolute right-0 top-full
                mt-2 w-64
                bg-[#111c32]
                border border-slate-700
                rounded-xl
                shadow-xl
                p-4
                z-[1100]
              ">

                <div className="
                  flex items-center
                  justify-between
                  mb-3
                ">
                  <span className="text-sm font-semibold">
                    Notifikasi
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="
                  py-5
                  text-center
                  text-xs
                  text-slate-500
                ">
                  Belum ada notifikasi
                </div>

              </div>
            )}

          </div>

          {/* DIVIDER */}

          <div className="hidden sm:block h-8 w-px bg-slate-800" />

          {/* USER PROFILE */}

          <div className="relative">

            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }}
              aria-expanded={showUserDropdown}
              className="
                flex items-center
                gap-2.5
                rounded-lg
                py-1.5 pl-1.5 pr-2
                hover:bg-slate-800/70
                transition-colors
              "
            >

              <div className="
                w-8 h-8
                rounded-full
                bg-blue-600
                flex items-center
                justify-center
                text-xs
                font-bold
                text-white
              ">
                {initial}
              </div>

              <div className="hidden sm:block text-left">

                <p className="
                  text-xs
                  font-semibold
                  text-white
                  max-w-[120px]
                  truncate
                ">
                  {userName}
                </p>

                <p className="
                  text-[10px]
                  text-slate-400
                ">
                  {userRole}
                </p>

              </div>

              <ChevronDown className="
                w-3.5 h-3.5
                text-slate-500
              " />

            </button>

            {/* USER DROPDOWN */}

            {showUserDropdown && (
              <div className="
                absolute right-0 top-full
                mt-2 w-56
                rounded-xl
                border border-slate-700
                bg-[#111c32]
                shadow-xl
                p-2
                z-[1100]
              ">

                <div className="
                  px-3 py-3
                  border-b border-slate-700
                  mb-1
                ">

                  <p className="text-sm font-semibold text-white truncate">
                    {userName}
                  </p>

                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {currentUser?.email || '-'}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onOpenAuthModal();
                  }}
                  className="
                    w-full
                    flex items-center
                    gap-3
                    px-3 py-2.5
                    rounded-lg
                    text-xs
                    text-slate-300
                    hover:bg-slate-800
                    hover:text-white
                  "
                >
                  <User className="w-4 h-4" />
                  Ganti Akun
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onOpenSettings();
                  }}
                  className="
                    w-full
                    flex items-center
                    gap-3
                    px-3 py-2.5
                    rounded-lg
                    text-xs
                    text-slate-300
                    hover:bg-slate-800
                    hover:text-white
                  "
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </button>

                <div className="border-t border-slate-700 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onLogout();
                  }}
                  className="
                    w-full
                    flex items-center
                    gap-3
                    px-3 py-2.5
                    rounded-lg
                    text-xs
                    text-red-400
                    hover:bg-red-950/40
                  "
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>

              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

export default NocTopbar;