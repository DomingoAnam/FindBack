import { requireClient } from '../lib/supabase';
import type { UserProfile } from '../types/report';

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  mobile_number: string;
  facebook_url?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  profile_photo_path: string | null;
  created_at: string;
}

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    mobileNumber: row.mobile_number,
    facebookUrl: row.facebook_url ?? '',
    role: row.role,
    status: row.status,
    profilePhotoPath: row.profile_photo_path,
    createdAt: row.created_at,
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user.id)
      .single();
    if (profile?.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('Your account has been disabled. Contact the FindBack office for assistance.');
    }
  }
}

export async function signUp(fullName: string, email: string, mobileNumber: string, password: string): Promise<boolean> {
  const { data, error } = await requireClient().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
      },
    },
  });
  if (error) throw error;
  return Boolean(data.session);
}

export async function signOut(): Promise<void> {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await requireClient().auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, mobile_number, facebook_url, role, status, profile_photo_path, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id, email, full_name, mobile_number, role, status, profile_photo_path, created_at')
      .eq('id', userId)
      .single();
    if (fallback.error) throw fallback.error;
    return fallback.data ? mapProfile(fallback.data as ProfileRow) : null;
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

export async function ensureProfile(): Promise<void> {
  const { error } = await requireClient().rpc('ensure_profile');
  if (error) throw error;
}

export async function updateProfile(userId: string, fullName: string, mobileNumber: string, facebookUrl: string): Promise<void> {
  const { error } = await requireClient()
    .from('profiles')
    .update({ full_name: fullName.trim(), mobile_number: mobileNumber.trim(), facebook_url: facebookUrl.trim(), updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) {
    if (error.message.includes('facebook_url')) {
      throw new Error('Database update needed: run supabase/contact_update.sql in the Supabase SQL Editor, then try again.');
    }
    throw error;
  }
}

export async function adminSetupAvailable(): Promise<boolean> {
  const { data, error } = await requireClient().rpc('admin_setup_available');
  if (error) return false;
  return data === true;
}

function normalizeCode(value: string): string {
  return value.replace(/[^A-Za-z0-9!@#$%^&*]/g, '');
}

export async function promoteToAdminWithSecret(secret: string): Promise<void> {
  const { error } = await requireClient().rpc('promote_to_admin_with_secret', { p_secret: normalizeCode(secret) });
  if (error) throw error;
}

export async function acceptAdminInvitation(token: string): Promise<void> {
  const { error } = await requireClient().rpc('accept_admin_invitation', { p_token: normalizeCode(token) });
  if (error) throw error;
}
