
import { supabase } from '../lib/supabase';
import type { UserAccount, UserRole } from '../types/telco';

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  role: string;
  branch: string | null;
  created_at: string;
}

const mapRole = (role: string): UserRole => {
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case 'admin':
      return 'ADMIN';

    case 'spv':
    case 'supervisor':
      return 'SUPERVISOR';

    case 'teknisi':
    case 'technician':
      return 'TECHNICIAN';

    default:
      throw new Error(`Role tidak dikenali: ${role}`);
  }
};

const getProfile = async (userId: string): Promise<UserAccount> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, role, branch, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Gagal mengambil profil: ${error.message}`);
  }

  if (!data) {
    throw new Error('Profil pengguna tidak ditemukan.');
  }

  const profile = data as ProfileData;

  return {
    id: profile.id,
    username: profile.username,
    email: '',
    fullName: profile.full_name,
    role: mapRole(profile.role),
    branch: profile.branch ?? '',
    createdAt: profile.created_at,
  };
};

/**
 * Login menggunakan email atau username.
 * Username dipetakan ke email akun Supabase Auth.
 */
export const signInWithAtpCredentials = async (
  identifier: string,
  password: string
): Promise<UserAccount> => {
  const cleanIdentifier = identifier.trim().toLowerCase();

  if (!cleanIdentifier || !password) {
    throw new Error('Username/email dan password wajib diisi.');
  }

  const usernameEmailMap: Record<string, string> = {
    'admin.atp': 'admin@atp.co.id',
    'spv.surya': 'supervisor@atp.co.id',
    'ahmad.fauzi': 'teknisi.ahmad@atp.co.id',
  };

  const email = cleanIdentifier.includes('@')
    ? cleanIdentifier
    : usernameEmailMap[cleanIdentifier];

  if (!email) {
    throw new Error('Username tidak terdaftar dalam konfigurasi login.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Autentikasi gagal. Pengguna tidak ditemukan.');
  }

  try {
    const profile = await getProfile(data.user.id);

    return {
      ...profile,
      email: data.user.email ?? '',
    };
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
};

/**
 * Mengambil pengguna yang sedang memiliki sesi aktif.
 */
export const getSignedInAtpUser = async (): Promise<UserAccount | null> => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;

  if (!session?.user) {
    return null;
  }

  try {
    const profile = await getProfile(session.user.id);

    return {
      ...profile,
      email: session.user.email ?? '',
    };
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
};

/**
 * Logout pengguna.
 */
export const signOutAtpUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};
