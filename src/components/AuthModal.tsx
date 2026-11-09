
import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';

import type { UserAccount } from '../types/telco';
import { signInWithAtpCredentials } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  currentUser: UserAccount | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);

  if (!isOpen) return null;

  // ==========================================
  // LOGIN MENGGUNAKAN SUPABASE AUTH
  // ==========================================

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailOrUsername.trim() || !password) {
      setErrorMessage('Username/email dan password wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);

      const user = await signInWithAtpCredentials(
        emailOrUsername,
        password
      );

      setSuccessMessage('Login berhasil. Mengarahkan ke dashboard...');

      onLoginSuccess(user);
      onClose();

    } catch (error: unknown) {
      console.error('Login error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat login. Silakan coba kembali.';

      setErrorMessage(message);

    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // RESET PASSWORD SUPABASE
  // ==========================================

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const email = forgotEmail.trim().toLowerCase();

    if (!email) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setForgotEmailSent(true);
      setSuccessMessage(
        'Instruksi pemulihan kata sandi telah dikirim ke email Anda.'
      );

    } catch (error: unknown) {
      console.error('Reset password error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengirim tautan pemulihan password.';

      setErrorMessage(message);

    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // KEMBALI KE LOGIN
  // ==========================================

  const handleBackToLogin = () => {
    setIsForgotPasswordView(false);
    setForgotEmailSent(false);
    setForgotEmail('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setIsForgotPasswordView(false);
    setForgotEmailSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-slate-200 relative">

        {/* ================================== */}
        {/* LEFT SIDE - BRAND ATP */}
        {/* ================================== */}

        <div className="md:w-5/12 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden min-h-[300px]">

          <div className="relative z-10 space-y-4">

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs tracking-wider shadow-sm">
                ATP
              </div>

              <span className="font-bold text-sm tracking-wide text-white">
                PT. ANUGERAH TERANG PERSADA
              </span>

            </div>

            <div className="pt-4">

              <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                Research Implementation
              </span>

              <h1 className="text-lg font-bold tracking-tight text-white mt-1 leading-snug">
                FTTH & HFC SMART OPERATIONAL INTELLIGENCE SYSTEM
              </h1>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Rancang bangun sistem deteksi anomali data Work Order (WO)
                teknisi jaringan FTTH dan HFC berbasis algoritma Isolation
                Forest dan pemantauan geospasial real-time.
              </p>

            </div>
          </div>

          {/* SYSTEM CAPABILITIES */}

          <div className="relative z-10 pt-6 border-t border-slate-800 space-y-2 text-xs text-slate-300">

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Manajemen WO & Normalisasi 88 Kolom</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Model Isolation Forest FTTH & HFC</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Pemantauan GPS & Validasi Tikor Spasial</span>
            </div>

          </div>

          {/* DECORATIVE ELEMENT */}

          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

          <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        </div>

        {/* ================================== */}
        {/* RIGHT SIDE - LOGIN FORM */}
        {/* ================================== */}

        <div className="md:w-7/12 p-8 bg-white flex flex-col justify-between relative">

          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Tutup login"
          >
            <X className="w-4 h-4" />
          </button>

          <div>

            {/* HEADER */}

            <div className="flex items-center justify-between mb-6 pr-6">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  {isForgotPasswordView
                    ? 'Atur Ulang Kata Sandi'
                    : 'Masuk ke Sistem NOC'}
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Autentikasi multi-peran dengan otorisasi berbasis wewenang (RBAC).
                </p>

              </div>

            </div>

            {/* ERROR MESSAGE */}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2">

                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />

                <span>{errorMessage}</span>

              </div>
            )}

            {/* SUCCESS MESSAGE */}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-start gap-2">

                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                <span>{successMessage}</span>

              </div>
            )}

            {/* ================================== */}
            {/* LOGIN FORM */}
            {/* ================================== */}

            {!isForgotPasswordView ? (

              <form
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >

                {/* USERNAME / EMAIL */}

                <div>

                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Email atau Nama Pengguna
                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="admin@atp.co.id"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div>

                  <div className="flex items-center justify-between mb-1">

                    <label className="text-xs font-semibold text-slate-800 block">
                      Kata Sandi
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordView(true);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Lupa kata sandi?
                    </button>

                  </div>

                  <div className="relative">

                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      disabled={isLoading}
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >

                      {showPassword
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye className="w-3.5 h-3.5" />}

                    </button>

                  </div>

                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  <span>
                    {isLoading
                      ? 'Mengautentikasi...'
                      : 'Masuk ke Dashboard'}
                  </span>

                  {!isLoading && (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}

                </button>

              </form>

            ) : (

              /* ================================== */
              /* FORGOT PASSWORD FORM */
              /* ================================== */

              <div className="space-y-4 text-xs">

                {forgotEmailSent ? (

                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">

                    <div className="flex items-center gap-2 font-semibold">

                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                      <span>Instruksi Pemulihan Terkirim</span>

                    </div>

                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Jika alamat email terdaftar, instruksi pemulihan kata sandi
                      akan dikirimkan ke email tersebut. Periksa kotak masuk
                      dan folder spam Anda.
                    </p>

                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="mt-2 text-xs font-semibold text-emerald-900 underline"
                    >
                      Kembali ke Halaman Masuk
                    </button>

                  </div>

                ) : (

                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-3"
                  >

                    <p className="text-slate-600 leading-relaxed">
                      Masukkan alamat email yang terdaftar pada akun ATP
                      untuk menerima tautan pengaturan ulang kata sandi.
                    </p>

                    <div className="relative">

                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@atp.co.id"
                        disabled={isLoading}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 disabled:bg-slate-50"
                      />

                    </div>

                    <div className="flex items-center gap-2 pt-2">

                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        disabled={isLoading}
                        className="py-2 px-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium disabled:opacity-50"
                      >
                        {isLoading
                          ? 'Mengirim...'
                          : 'Kirim Tautan Pemulihan'}
                      </button>

                    </div>

                  </form>

                )}

              </div>

            )}

          </div>

          {/* FOOTER */}

          <div className="pt-6 text-[10px] text-slate-400 text-center font-mono">
            Keamanan Data & RBAC · PT. Anugerah Terang Persada
          </div>

        </div>

      </div>

    </div>
  );
};

export default AuthModal;
