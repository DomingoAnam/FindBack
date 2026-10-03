import { requireClient } from '../lib/supabase';
import { mapProfile } from './auth';
import type { AdminInvitation, AdminStats, AuditLog, UserProfile } from '../types/report';

interface AuditRow {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

interface InvitationRow {
  id: string;
  email: string;
  full_name: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export async function loadUsers(): Promise<UserProfile[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, mobile_number, facebook_url, role, status, profile_photo_path, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id, email, full_name, mobile_number, role, status, profile_photo_path, created_at')
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map(mapProfile);
  }

  return (data ?? []).map(mapProfile);
}

export async function setUserStatus(userId: string, status: 'active' | 'suspended'): Promise<void> {
  const { error } = await requireClient().rpc('admin_set_user_status', {
    p_user_id: userId,
    p_status: status,
  });
  if (error) throw error;
}

export async function inviteAdmin(email: string, fullName: string): Promise<string> {
  const { data, error } = await requireClient().rpc('admin_create_invitation', {
    p_email: email,
    p_full_name: fullName,
  });
  if (error) throw error;
  return data as string;
}

export async function loadInvitations(): Promise<AdminInvitation[]> {
  const { data, error } = await requireClient()
    .from('admin_invitations')
    .select('id, email, full_name, expires_at, used_at, revoked_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as InvitationRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  }));
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await requireClient().rpc('admin_revoke_invitation', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function loadAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await requireClient()
    .from('audit_logs')
    .select('id, admin_id, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as AuditRow[]).map((row) => ({
    id: row.id,
    adminId: row.admin_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details,
    createdAt: row.created_at,
  }));
}

type CountableTable = 'profiles' | 'reports' | 'matches' | 'claims';

async function countRows(table: CountableTable, filter?: { column: string; value: string }): Promise<number> {
  let query = requireClient().from(table).select('id', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function loadAdminStats(): Promise<AdminStats> {
  const [totalUsers, totalReports, lostItems, foundItems, possibleMatches, pendingClaims, recoveredItems, closedReports] = await Promise.all([
    countRows('profiles'),
    countRows('reports'),
    countRows('reports', { column: 'report_type', value: 'lost' }),
    countRows('reports', { column: 'report_type', value: 'found' }),
    countRows('matches', { column: 'status', value: 'pending' }),
    countRows('claims', { column: 'status', value: 'pending' }),
    countRows('reports', { column: 'status', value: 'recovered' }),
    countRows('reports', { column: 'status', value: 'closed' }),
  ]);

  return { totalUsers, totalReports, lostItems, foundItems, possibleMatches, pendingClaims, recoveredItems, closedReports };
}
