export const REPORT_STATUSES = [
  'reported',
  'possible_match',
  'under_review',
  'for_recovery',
  'recovered',
  'closed',
  'rejected',
  'cancelled',
  'flagged',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportKind = 'lost' | 'found';

export const STATUS_LABELS: Record<ReportStatus, string> = {
  reported: 'Reported',
  possible_match: 'Possible Match',
  under_review: 'Under Review',
  for_recovery: 'For Recovery',
  recovered: 'Recovered',
  closed: 'Closed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  flagged: 'Flagged',
};

export const STATUS_FLOW: ReportStatus[] = ['reported', 'possible_match', 'for_recovery', 'recovered', 'closed'];

export const OPEN_STATUSES: ReportStatus[] = ['reported', 'possible_match', 'under_review', 'for_recovery'];

export interface ItemReport {
  id: string;
  code: string;
  kind: ReportKind;
  name: string;
  category: string;
  description: string;
  location: string;
  occurredDate: string;
  occurredTime: string;
  color: string;
  brand: string;
  model: string;
  distinguishingFeatures: string;
  additionalInfo: string;
  status: ReportStatus;
  createdAt: string;
  createdBy: string;
  recoveredAt?: string | null;
  photoUris: string[];
  photoPaths?: string[];
}

export interface NewReport {
  kind: ReportKind;
  name: string;
  category: string;
  description: string;
  location: string;
  occurredDate: string;
  occurredTime: string;
  color: string;
  brand: string;
  model: string;
  distinguishingFeatures: string;
  additionalInfo: string;
  photoUris: string[];
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  facebookUrl: string;
  role: UserRole;
  status: 'active' | 'suspended';
  profilePhotoPath?: string | null;
  createdAt: string;
}

export interface ReportContact {
  fullName: string;
  mobileNumber: string;
  facebookUrl: string;
  role: UserRole;
}

export interface MatchRecord {
  id: string;
  lostReportId: string;
  foundReportId: string;
  score: number;
  status: 'pending' | 'dismissed' | 'confirmed';
  createdAt: string;
  otherReport?: ItemReport;
  otherReportName?: string;
  mineIsLost?: boolean;
  lostReportName?: string;
  foundReportName?: string;
}

export interface ClaimRequest {
  id: string;
  reportId: string;
  claimantId: string;
  verificationInformation: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  reportName?: string;
  reportKind?: ReportKind;
  claimantName?: string;
}

export type NotificationType = 'match' | 'status' | 'claim' | 'review' | 'admin';

export interface AppNotification {
  id: string;
  userId: string;
  reportId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactSettings {
  organizationName: string;
  pickupLocation: string;
  phoneNumber: string;
  facebookPageName: string;
  facebookPageUrl: string;
  officeHours: string;
  additionalInstructions: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  fullName: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  lostItems: number;
  foundItems: number;
  possibleMatches: number;
  pendingClaims: number;
  recoveredItems: number;
  closedReports: number;
}

export const REPORT_CATEGORIES = [
  'Personal items',
  'Electronics',
  'Documents & IDs',
  'Bags & wallets',
  'Clothing & accessories',
  'Jewelry & watches',
  'Keys',
  'Money',
  'Groceries & goods',
  'Other',
] as const;
