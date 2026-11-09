
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Activity,
  MapPin,
  Radio,
  CheckSquare,
  BarChart3,
  Database,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Network,
  Sparkles,
  CircleHelp,
} from 'lucide-react';

interface NocSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anomalyCount: number;
  totalRecords: number;
  unreviewedCount: number;
}

export const NocSidebar: React.FC<NocSidebarProps> = ({
  activeTab,
  setActiveTab,
  anomalyCount,
  totalRecords,
  unreviewedCount,
}) => {
  const [woExpanded, setWoExpanded] = useState(true);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [masterExpanded, setMasterExpanded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isActive = (tab: string) => activeTab === tab;

  const menuBase =
    'group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12px] transition-all duration-200';

  const menuStyle = (tab: string) =>
    `${menuBase} ${
      isActive(tab)
        ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    }`;

  const subMenuStyle = (tab: string) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] transition-all ${
      isActive(tab)
        ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
    }`;

  const sectionLabel =
    'mb-2 mt-5 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600';

  const Badge = ({
    children,
    color = 'cyan',
  }: {
    children: React.ReactNode;
    color?: 'cyan' | 'red' | 'amber' | 'green';
  }) => {
    const colors = {
      cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    return (
      <span
        className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${colors[color]}`}
      >
        {children}
      </span>
    );
  };

  const MenuButton = ({
    tab,
    icon: Icon,
    label,
    badge,
    badgeColor,
    onClick,
  }: {
    tab: string;
    icon: React.ElementType;
    label: string;
    badge?: React.ReactNode;
    badgeColor?: 'cyan' | 'red' | 'amber' | 'green';
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={menuStyle(tab)}
    >
      {isActive(tab) && (
        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
      )}

      <span className="flex min-w-0 items-center gap-3">
        <Icon
          className={`h-[17px] w-[17px] shrink-0 transition-colors ${
            isActive(tab)
              ? 'text-cyan-300'
              : 'text-slate-500 group-hover:text-slate-200'
          }`}
          strokeWidth={1.8}
        />

        <span className="truncate">{label}</span>
      </span>

      {badge !== undefined && (
        <Badge color={badgeColor}>{badge}</Badge>
      )}
    </button>
  );

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-slate-800/80 bg-[#080F1D] text-slate-200">

      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-cyan-500/[0.035] blur-3xl" />

      {/* BRAND HEADER */}
      <div className="relative border-b border-slate-800/80 px-5 pb-5 pt-6">

        <div className="flex items-center gap-3">

          {/* ATP LOGO */}
          <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-white p-1 shadow-lg shadow-cyan-500/10">

            {!logoError ? (
              <img
                src="/atp-logo.png"
                alt="Logo ATP"
                className="h-full w-full rounded-xl object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700">
                <span className="text-sm font-black tracking-wider text-white">
                  ATP
                </span>
              </div>
            )}

          </div>

          {/* COMPANY IDENTITY */}
          <div className="min-w-0 flex-1">

            <div className="text-[13px] font-extrabold leading-tight tracking-tight text-white">
              ANUGERAH TERANG
            </div>

            <div className="mt-0.5 text-[12px] font-semibold text-slate-300">
              PERSADA
            </div>

            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)]" />
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-400">
                Network Operations
              </span>
            </div>

          </div>

        </div>

        {/* SYSTEM LABEL */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2.5">

          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />

            <div>
              <p className="text-[10px] font-bold text-slate-200">
                FTTH & HFC
              </p>
              <p className="mt-0.5 text-[9px] text-slate-500">
                Operational Intelligence
              </p>
            </div>
          </div>

          <Badge color="green">ACTIVE</Badge>

        </div>

      </div>

      {/* NAVIGATION */}
      <nav className="relative flex-1 overflow-y-auto px-3 pb-5 pt-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">

        {/* MAIN MENU */}
        <p className={sectionLabel}>Main Menu</p>

        <div className="space-y-1">

          <MenuButton
            tab="dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={() => setActiveTab('dashboard')}
          />

        </div>

        {/* OPERATIONAL MENU */}
        <p className={sectionLabel}>Operational Management</p>

        <div className="space-y-1">

          {/* WORK ORDER */}
          <div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('records');
                setWoExpanded(!woExpanded);
              }}
              className={menuStyle('records')}
            >
              {isActive('records') && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-400" />
              )}

              <span className="flex items-center gap-3">
                <FileText
                  className={`h-[17px] w-[17px] ${
                    isActive('records')
                      ? 'text-cyan-300'
                      : 'text-slate-500'
                  }`}
                />
                Work Order
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                  woExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />

            </button>

            {woExpanded && (
              <div className="ml-[22px] mt-1 space-y-1 border-l border-slate-700/70 pl-3">

                <button
                  type="button"
                  onClick={() => setActiveTab('records')}
                  className={subMenuStyle('records')}
                >
                  <span>Daftar Work Order</span>
                  <span className="text-[9px] tabular-nums text-slate-500">
                    {totalRecords.toLocaleString('id-ID')}
                  </span>
                </button>

              </div>
            )}

          </div>

          <MenuButton
            tab="rules"
            icon={ShieldCheck}
            label="Validasi Data (SOP)"
            badge="10"
            onClick={() => setActiveTab('rules')}
          />

          <MenuButton
            tab="isolation_forest"
            icon={Activity}
            label="Deteksi Anomali"
            badge={anomalyCount > 0 ? anomalyCount : undefined}
            badgeColor="red"
            onClick={() => setActiveTab('isolation_forest')}
          />

          <MenuButton
            tab="gis"
            icon={MapPin}
            label="Peta Operasional"
            onClick={() => setActiveTab('gis')}
          />

          <MenuButton
            tab="monitoring_teknisi"
            icon={Radio}
            label="Monitoring Teknisi"
            badge="LIVE"
            badgeColor="green"
            onClick={() => setActiveTab('monitoring_teknisi')}
          />

          <MenuButton
            tab="review_supervisor"
            icon={CheckSquare}
            label="Review Supervisor"
            badge={unreviewedCount > 0 ? unreviewedCount : undefined}
            badgeColor="amber"
            onClick={() => setActiveTab('review_supervisor')}
          />

        </div>

        {/* ANALYTICS */}
        <p className={sectionLabel}>Analytics & Data</p>

        <div className="space-y-1">

          {/* REPORTS */}
          <div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('reports');
                setReportsExpanded(!reportsExpanded);
              }}
              className={menuStyle('reports')}
            >
              <span className="flex items-center gap-3">
                <BarChart3
                  className={`h-[17px] w-[17px] ${
                    isActive('reports')
                      ? 'text-cyan-300'
                      : 'text-slate-500'
                  }`}
                />
                Laporan
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                  reportsExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />

            </button>

            {reportsExpanded && (
              <div className="ml-[22px] mt-1 border-l border-slate-700/70 pl-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={subMenuStyle('reports')}
                >
                  Ringkasan Laporan
                </button>
              </div>
            )}

          </div>

          {/* MASTER DATA */}
          <div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('master_data');
                setMasterExpanded(!masterExpanded);
              }}
              className={menuStyle('master_data')}
            >
              <span className="flex items-center gap-3">
                <Database
                  className={`h-[17px] w-[17px] ${
                    isActive('master_data')
                      ? 'text-cyan-300'
                      : 'text-slate-500'
                  }`}
                />
                Master Data
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                  masterExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />

            </button>

            {masterExpanded && (
              <div className="ml-[22px] mt-1 border-l border-slate-700/70 pl-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('master_data')}
                  className={subMenuStyle('master_data')}
                >
                  Data Master
                </button>
              </div>
            )}

          </div>

        </div>

        {/* SYSTEM */}
        <p className={sectionLabel}>System Management</p>

        <div className="space-y-1">

          <MenuButton
            tab="user_management"
            icon={Users}
            label="Manajemen Pengguna"
            onClick={() => setActiveTab('user_management')}
          />

          <MenuButton
            tab="settings"
            icon={Settings}
            label="Pengaturan Sistem"
            onClick={() => setActiveTab('settings')}
          />

        </div>

      </nav>

      {/* FOOTER */}
      <div className="relative border-t border-slate-800/80 bg-[#070D18] p-4">

        {/* Brand panel */}
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent p-3">

          <div className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative flex items-center gap-2.5">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-slate-950/70">
              <Building2 className="h-4 w-4 text-cyan-400" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wide text-white">
                ATP NETWORK SYSTEM
              </p>
              <p className="mt-1 truncate text-[9px] text-slate-400">
                FTTH / HFC Monitoring Platform
              </p>
            </div>

          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-2.5">
            <span className="text-[9px] text-slate-500">
              System Version
            </span>
            <span className="font-mono text-[9px] font-semibold text-cyan-400">
              v1.0.0
            </span>
          </div>

        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[9px] text-slate-500">
            <Sparkles className="h-3 w-3 text-cyan-500" />
            Powered by ATP
          </span>

          <span className="flex items-center gap-1 text-[9px] text-slate-600">
            <CircleHelp className="h-3 w-3" />
            Operations
          </span>
        </div>

      </div>

    </aside>
  );
};
