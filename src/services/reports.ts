import * as FileSystem from 'expo-file-system/legacy';
import { requireClient } from '../lib/supabase';
import type { ClaimRequest, ItemReport, MatchRecord, NewReport, ReportContact, ReportKind, ReportStatus } from '../types/report';

const PHOTO_BUCKET = 'item-photos';
const MAX_PHOTOS = 3;

interface ReportRow {
  id: string;
  report_code: string;
  user_id: string;
  report_type: ReportKind;
  item_name: string;
  category: string;
  description: string;
  occurred_date: string;
  occurred_time: string;
  location: string;
  color: string;
  brand: string;
  model: string;
  distinguishing_features: string;
  additional_information: string;
  status: ReportStatus;
  recovered_at: string | null;
  created_at: string;
}

function mapReport(row: ReportRow, photoPaths: string[], creatorName?: string): ItemReport {
  return {
    id: row.id,
    code: row.report_code,
    kind: row.report_type,
    name: row.item_name,
    category: row.category,
    description: row.description,
    location: row.location,
    occurredDate: row.occurred_date,
    occurredTime: row.occurred_time,
    color: row.color,
    brand: row.brand,
    model: row.model,
    distinguishingFeatures: row.distinguishing_features,
    additionalInfo: row.additional_information,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.user_id,
    createdByName: creatorName,
    recoveredAt: row.recovered_at,
    photoUris: [],
    photoPaths,
  };
}

async function attachPhotos(reports: ItemReport[]): Promise<ItemReport[]> {
  const supabase = requireClient();
  return Promise.all(reports.map(async (report) => {
    if (!report.photoPaths?.length) return report;
    const uris: string[] = [];
    for (const path of report.photoPaths) {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
      if (!error && data) uris.push(data.signedUrl);
    }
    return { ...report, photoUris: uris };
  }));
}

async function fetchReports(userId?: string): Promise<ItemReport[]> {
  const supabase = requireClient();
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as ReportRow[];
  if (!rows.length) return [];

  const { data: photoRows, error: photosError } = await supabase
    .from('report_photos')
    .select('report_id, image_path')
    .in('report_id', rows.map((row) => row.id))
    .order('created_at', { ascending: true });
  if (photosError) throw photosError;

  const photosByReport = new Map<string, string[]>();
  for (const photo of photoRows ?? []) {
    const list = photosByReport.get(photo.report_id) ?? [];
    list.push(photo.image_path);
    photosByReport.set(photo.report_id, list);
  }

  const creatorNames = new Map<string, string>();
  const { data: creatorRows, error: creatorsError } = await supabase
    .rpc('get_report_creator_names', { p_report_ids: rows.map((row) => row.id) });
  if (creatorsError) {
    console.warn('[FindBack] get_report_creator_names failed (run supabase/creator_names.sql):', creatorsError.message);
  }
  for (const row of (creatorRows ?? []) as { report_id: string; full_name: string | null }[]) {
    if (row.full_name) creatorNames.set(row.report_id, row.full_name);
  }

  const reports = rows.map((row) => mapReport(row, photosByReport.get(row.id) ?? [], creatorNames.get(row.id)));
  return attachPhotos(reports);
}

export async function loadReports(): Promise<ItemReport[]> {
  const reports = await fetchReports();
  return reports.filter((report) => report.status !== 'closed' && report.status !== 'flagged');
}

export async function loadMyReports(userId: string): Promise<ItemReport[]> {
  return fetchReports(userId);
}

export async function loadAllReports(): Promise<ItemReport[]> {
  return fetchReports();
}

async function uploadPhoto(userId: string, uri: string): Promise<string> {
  const supabase = requireClient();
  const extension = uri.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1]?.toLowerCase() ?? 'jpg';
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;
  return path;
}

export async function createReport(report: NewReport, userId: string): Promise<string> {
  const supabase = requireClient();
  const photoUris = report.photoUris.slice(0, MAX_PHOTOS);
  const uploadedPaths: string[] = [];

  try {
    for (const uri of photoUris) {
      uploadedPaths.push(await uploadPhoto(userId, uri));
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        report_type: report.kind,
        item_name: report.name,
        category: report.category,
        description: report.description,
        occurred_date: report.occurredDate,
        occurred_time: report.occurredTime,
        location: report.location,
        color: report.color,
        brand: report.brand,
        model: report.model,
        distinguishing_features: report.distinguishingFeatures,
        additional_information: report.additionalInfo,
      })
      .select('id, report_code')
      .single();
    if (error) throw error;

    if (uploadedPaths.length) {
      const { error: photosError } = await supabase
        .from('report_photos')
        .insert(uploadedPaths.map((path) => ({ report_id: data.id, image_path: path })));
      if (photosError) throw photosError;
    }

    return data.report_code as string;
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
}

export async function adminDeleteReport(report: ItemReport): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc('admin_delete_report', { p_report_id: report.id });
  if (error) {
    if (error.message.includes('admin_delete_report')) {
      throw new Error('Database update needed: run supabase/admin_delete.sql in the Supabase SQL Editor, then try again.');
    }
    throw error;
  }

  if (report.photoPaths?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(report.photoPaths);
  }
}

export async function deleteReport(report: ItemReport): Promise<void> {
  const supabase = requireClient();
  const { data: photoRows } = await supabase
    .from('report_photos')
    .select('image_path')
    .eq('report_id', report.id);

  const { error } = await supabase.from('reports').delete().eq('id', report.id);
  if (error) throw error;

  const paths = (photoRows ?? []).map((row) => row.image_path);
  if (paths.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  }
}

export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  const { error } = await requireClient().rpc('admin_update_report_status', {
    p_report_id: reportId,
    p_status: status,
  });
  if (error) throw error;
}

export async function ownerUpdateReportStatus(reportId: string, status: 'recovered' | 'closed'): Promise<void> {
  const { error } = await requireClient().rpc('owner_update_report_status', {
    p_report_id: reportId,
    p_status: status,
  });
  if (error) {
    if (error.message.includes('owner_update_report_status')) {
      throw new Error('Database update needed: run supabase/owner_actions.sql in the Supabase SQL Editor, then try again.');
    }
    throw error;
  }
}

// ---------- Matches ----------

interface MatchRow {
  id: string;
  lost_report_id: string;
  found_report_id: string;
  match_score: number;
  status: 'pending' | 'dismissed' | 'confirmed';
  created_at: string;
}

export async function loadMyMatches(userId: string, myReportIds: string[]): Promise<MatchRecord[]> {
  if (!myReportIds.length) return [];
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('matches')
    .select('id, lost_report_id, found_report_id, match_score, status, created_at')
    .eq('status', 'pending')
    .or(`lost_report_id.in.(${myReportIds.join(',')}),found_report_id.in.(${myReportIds.join(',')})`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];
  const otherIds = [...new Set(rows.map((row) => myReportIds.includes(row.lost_report_id) ? row.found_report_id : row.lost_report_id))];
  const names = new Map<string, string>();
  if (otherIds.length) {
    const { data: reportRows } = await supabase.from('reports').select('id, item_name').in('id', otherIds);
    for (const row of reportRows ?? []) names.set(row.id, row.item_name);
  }

  return rows.map((row) => {
    const mineIsLost = myReportIds.includes(row.lost_report_id);
    const otherId = mineIsLost ? row.found_report_id : row.lost_report_id;
    return {
      id: row.id,
      lostReportId: row.lost_report_id,
      foundReportId: row.found_report_id,
      score: row.match_score,
      status: row.status,
      createdAt: row.created_at,
      otherReportName: names.get(otherId) ?? 'Report',
      mineIsLost,
    };
  });
}

export async function loadPendingMatches(): Promise<MatchRecord[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('matches')
    .select('id, lost_report_id, found_report_id, match_score, status, created_at')
    .eq('status', 'pending')
    .order('match_score', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];
  const reportIds = [...new Set(rows.flatMap((row) => [row.lost_report_id, row.found_report_id]))];
  const names = new Map<string, string>();
  if (reportIds.length) {
    const { data: reportRows } = await supabase.from('reports').select('id, item_name').in('id', reportIds);
    for (const row of reportRows ?? []) names.set(row.id, row.item_name);
  }

  return rows.map((row) => ({
    id: row.id,
    lostReportId: row.lost_report_id,
    foundReportId: row.found_report_id,
    score: row.match_score,
    status: row.status,
    createdAt: row.created_at,
    lostReportName: names.get(row.lost_report_id) ?? 'Deleted report',
    foundReportName: names.get(row.found_report_id) ?? 'Deleted report',
  }));
}

export async function confirmMatch(matchId: string): Promise<void> {
  const { error } = await requireClient().rpc('admin_confirm_match', { p_match_id: matchId });
  if (error) throw error;
}

export async function dismissMatch(matchId: string): Promise<void> {
  const { error } = await requireClient().rpc('dismiss_match', { p_match_id: matchId });
  if (error) throw error;
}

// ---------- Claims ----------

interface ClaimRow {
  id: string;
  report_id: string;
  claimant_id: string;
  verification_information: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

function mapClaim(row: ClaimRow): ClaimRequest {
  return {
    id: row.id,
    reportId: row.report_id,
    claimantId: row.claimant_id,
    verificationInformation: row.verification_information,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export async function submitClaim(reportId: string, claimantId: string, verificationInformation: string): Promise<void> {
  const { error } = await requireClient().from('claims').insert({
    report_id: reportId,
    claimant_id: claimantId,
    verification_information: verificationInformation.trim(),
  });
  if (error) throw error;
}

export async function loadUserClaims(userId: string): Promise<ClaimRequest[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('claimant_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const claims = ((data ?? []) as ClaimRow[]).map(mapClaim);
  const reportIds = [...new Set(claims.map((claim) => claim.reportId))];
  if (reportIds.length) {
    const { data: reportRows } = await supabase.from('reports').select('id, item_name, report_type').in('id', reportIds);
    const names = new Map((reportRows ?? []).map((row) => [row.id, { name: row.item_name, kind: row.report_type as ReportKind }]));
    for (const claim of claims) {
      claim.reportName = names.get(claim.reportId)?.name ?? 'Deleted report';
      claim.reportKind = names.get(claim.reportId)?.kind;
    }
  }
  return claims;
}

export async function loadPendingClaims(): Promise<ClaimRequest[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const claims = ((data ?? []) as ClaimRow[]).map(mapClaim);
  const reportIds = [...new Set(claims.map((claim) => claim.reportId))];
  if (reportIds.length) {
    const { data: reportRows } = await supabase.from('reports').select('id, item_name, report_type').in('id', reportIds);
    const names = new Map((reportRows ?? []).map((row) => [row.id, { name: row.item_name, kind: row.report_type as ReportKind }]));
    for (const claim of claims) {
      claim.reportName = names.get(claim.reportId)?.name ?? 'Deleted report';
      claim.reportKind = names.get(claim.reportId)?.kind;
    }
  }

  const claimantIds = [...new Set(claims.map((claim) => claim.claimantId))];
  if (claimantIds.length) {
    const { data: profileRows } = await supabase.from('profiles').select('id, full_name').in('id', claimantIds);
    const claimantNames = new Map((profileRows ?? []).map((row) => [row.id, row.full_name]));
    for (const claim of claims) {
      claim.claimantName = claimantNames.get(claim.claimantId) || 'FindBack user';
    }
  }

  return claims;
}

export async function reviewClaim(claimId: string, approve: boolean): Promise<void> {
  const { error } = await requireClient().rpc('admin_review_claim', {
    p_claim_id: claimId,
    p_approve: approve,
  });
  if (error) throw error;
}

export async function loadReportContact(reportId: string): Promise<ReportContact | null> {
  const { data, error } = await requireClient().rpc('get_report_contact', { p_report_id: reportId });
  if (error) {
    console.warn('[FindBack] get_report_contact failed (run supabase/contact_update.sql):', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    fullName: row.full_name ?? '',
    mobileNumber: row.mobile_number ?? '',
    facebookUrl: row.facebook_url ?? '',
    role: row.role === 'admin' ? 'admin' : 'user',
  };
}
