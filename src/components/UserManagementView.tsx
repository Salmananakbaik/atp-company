
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User Management & RBAC View
 * PT. ANUGERAH TERANG PERSADA
 */

import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Key,
  Search,
  CheckCircle2,
} from 'lucide-react';

import { UserAccount, UserRole } from '../types/telco';

interface UserManagementViewProps {
  currentUser: UserAccount | null;
  onSelectUser: (user: UserAccount) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onSelectUser,
}) => {
  const [usersList] = useState<UserAccount[]>(
    currentUser ? [currentUser] : []
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredUsers = usersList.filter((user) => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      return (
        user.fullName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.branch.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">
            ADMINISTRATOR
          </span>
        );

      case 'SUPERVISOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-cyan-400 border border-blue-800">
            SUPERVISOR NOC
          </span>
        );

      case 'TECHNICIAN':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            TEKNISI LAPANGAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* TOP BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#091124] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">
              ROLE-BASED ACCESS CONTROL
            </span>

            <span className="text-xs text-slate-400 font-mono">
              3 Peran Sistem Resmi
            </span>
          </div>

          <h2 className="text-lg font-bold text-white mt-1">
            Manajemen Akun & Otorisasi Pengguna
          </h2>

          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Pengelolaan hak akses berjenjang. Proteksi data sensitif
            pelanggan (PII) hanya dapat diakses oleh peran berwenang.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center shrink-0">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">
            Pengguna Aktif
          </span>

          <span className="text-base font-bold text-white font-mono tabular-nums">
            {usersList.length} Akun
          </span>
        </div>
      </div>

      {/* ROLE DESCRIPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="p-4 rounded-xl border border-slate-800 bg-[#091124]">
          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">
            Peran 1
          </span>

          <h3 className="text-sm font-bold text-white mt-1">
            ADMINISTRATOR
          </h3>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Akses menyeluruh: kelola pengguna, dataset, model ML,
            SOP rules, dan semua laporan eksekutif.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#091124]">
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
            Peran 2
          </span>

          <h3 className="text-sm font-bold text-white mt-1">
            SUPERVISOR
          </h3>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Monitoring WO, verifikasi status anomali lapangan,
            tindak lanjut catatan teknisi, dan ekspor audit.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#091124]">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
            Peran 3
          </span>

          <h3 className="text-sm font-bold text-white mt-1">
            TEKNISI
          </h3>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Portal mobile khusus: penugasan WO pribadi,
            update status mulai/selesai, dan persetujuan GPS sukarela.
          </p>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />

          <input
            type="text"
            placeholder="Cari nama, email, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Semua Peran (Role)</option>
          <option value="ADMIN">ADMINISTRATOR</option>
          <option value="SUPERVISOR">SUPERVISOR</option>
          <option value="TECHNICIAN">TECHNICIAN</option>
        </select>

      </div>

      {/* USERS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-[#091124] overflow-hidden shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">

            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">
                  Nama Lengkap & Username
                </th>

                <th className="py-3 px-4">
                  Email
                </th>

                <th className="py-3 px-4">
                  Peran (Role)
                </th>

                <th className="py-3 px-4">
                  Cabang Penugasan
                </th>

                <th className="py-3 px-4 text-center">
                  Status Sesi
                </th>

                <th className="py-3 px-4 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">

              {filteredUsers.length > 0 ? (

                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">

                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {user.fullName.charAt(0)}
                          </div>

                          <div>
                            <span className="font-bold text-white block">
                              {user.fullName}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono block">
                              @{user.username}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {user.email}
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {user.branch}
                      </td>

                      <td className="py-3 px-4 text-center">

                        {isCurrent ? (

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                            <CheckCircle2 className="w-3 h-3" />
                            AKTIF SAAT INI
                          </span>

                        ) : (

                          <span className="text-[10px] text-slate-500 font-mono">
                            Standby
                          </span>

                        )}

                      </td>

                      <td className="py-3 px-4 text-right">

                        <button
                          onClick={() => onSelectUser(user)}
                          disabled={isCurrent}
                          className={
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ' +
                            (isCurrent
                              ? 'bg-slate-800 text-slate-400 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer')
                          }
                        >
                          {isCurrent
                            ? 'Sedang Digunakan'
                            : 'Masuk Sebagai'}
                        </button>

                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-4 text-center"
                  >
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />

                    <p className="text-sm text-slate-400 font-semibold">
                      Belum ada data pengguna
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Data pengguna akan ditampilkan setelah terhubung
                      dengan database Supabase.
                    </p>
                  </td>
                </tr>

              )}

            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
};
