import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Archive, CheckCircle2, FileText, GitCompareArrows, LayoutDashboard, LogOut, Package, Phone, Plus, ScrollText, SearchX, ShieldCheck, Users } from 'lucide-react-native';
import { RoleHeader } from '../../components/RoleHeader';
import { HeroIllustration } from '../../components/Illustrations';
import { NotificationPopup } from '../../components/NotificationPopup';
import { ReportCard } from '../../components/ReportCard';
import { FormField } from '../../components/FormField';
import { StatusBadge } from '../../components/StatusBadge';
import { supabase } from '../../lib/supabase';
import { inviteAdmin, loadAdminStats, loadAuditLogs, loadInvitations, loadUsers, revokeInvitation, setUserStatus } from '../../services/admin';
import { adminDeleteReport, createReport, loadAllReports, updateReportStatus } from '../../services/reports';
import { loadContactSettings, updateContactSettings } from '../../services/settings';
import { ReportFormScreen } from '../reports/ReportFormScreen';
import { OPEN_STATUSES, STATUS_LABELS, type AdminInvitation, type AdminStats, type AuditLog, type ContactSettings, type ItemReport, type NewReport, type ReportStatus, type UserProfile } from '../../types/report';

type AdminSection = 'dashboard' | 'reports' | 'create' | 'users' | 'admins' | 'contact' | 'logs';

const SECTIONS: { key: Exclude<AdminSection, 'create'>; label: string }[] = [
  { key: 'dashboard', label: 'Home' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
  { key: 'admins', label: 'Admins' },
  { key: 'contact', label: 'Contact' },
  { key: 'logs', label: 'Audit Logs' },
];

interface AdminDashboardProps {
  profile: UserProfile;
  onSignOut: () => void;
}

export function AdminDashboard({ profile, onSignOut }: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [popup, setPopup] = useState<{ id: number; title: string; message: string } | null>(null);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      loadAdminStats(),
      loadAllReports(),
      loadUsers(),
      loadInvitations(),
      loadAuditLogs(),
      loadContactSettings(),
    ]);
    const [statsR, reportsR, usersR, invitationsR, logsR, settingsR] = results;
    if (statsR.status === 'fulfilled') setStats(statsR.value);
    if (reportsR.status === 'fulfilled') setReports(reportsR.value);
    if (usersR.status === 'fulfilled') setUsers(usersR.value);
    if (invitationsR.status === 'fulfilled') setInvitations(invitationsR.value);
    if (logsR.status === 'fulfilled') setLogs(logsR.value);
    if (settingsR.status === 'fulfilled') setSettings(settingsR.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      await refresh();
    })();

    if (!supabase) {
      return () => { mounted = false; };
    }

    const supabaseClient = supabase;
    const channel = supabaseClient
      .channel('findback-admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void refresh(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload) => {
        const row = payload.new as { title?: string; message?: string };
        setPopup({ id: Date.now(), title: row.title ?? 'FindBack update', message: row.message ?? '' });
        void refresh();
      })
      .subscribe();
    return () => {
      mounted = false;
      void supabaseClient.removeChannel(channel);
    };
  }, [refresh, profile.id]);

  function run(action: () => Promise<void>, successMessage: string) {
    void action()
      .then(async () => {
        await refresh();
        if (successMessage) Alert.alert('Done', successMessage);
      })
      .catch((error: unknown) => Alert.alert('Action failed', error instanceof Error ? error.message : 'Please try again.'));
  }

  function changeStatus(report: ItemReport, status: ReportStatus) {
    run(() => updateReportStatus(report.id, status), `${report.code} is now ${STATUS_LABELS[status]}.`);
  }

  function confirmDelete(report: ItemReport) {
    Alert.alert(
      'Delete report?',
      `Remove ${report.code} (${report.name}) permanently? Use this for false reports or reports not related to lost and found. This is recorded in the audit log.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => run(() => adminDeleteReport(report), `${report.code} was deleted.`) },
      ],
    );
  }

  async function submitReport(report: NewReport) {
    const code = await createReport(report, profile.id);
    await refresh();
    return code;
  }

  const openReports = reports.filter((report) => !['closed', 'cancelled', 'rejected'].includes(report.status));

  return (
    <View style={styles.screen}>
      <RoleHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <Text style={styles.empty}>Loading...</Text> : null}

        {!loading && section === 'dashboard' && stats ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.heroEyebrow}>ADMIN HOME</Text>
                <Text style={styles.heroTitle}>Welcome back,{'\n'}{profile.fullName.split(' ')[0] || 'Admin'}!</Text>
                <Text style={styles.heroSubtitle}>Here is what is happening at the market today.</Text>
              </View>
              <HeroIllustration width={112} height={90} />
            </View>

            <View style={styles.statsGrid}>
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} accent="#39765F" />
              <StatCard icon={FileText} label="Total Reports" value={stats.totalReports} accent="#30372E" />
              <StatCard icon={SearchX} label="Lost Items" value={stats.lostItems} accent="#B44732" />
              <StatCard icon={Package} label="Found Items" value={stats.foundItems} accent="#39765F" />
              <StatCard icon={GitCompareArrows} label="Possible Matches" value={stats.possibleMatches} accent="#C64C32" highlight={stats.possibleMatches > 0} />
              <StatCard icon={CheckCircle2} label="Claimed" value={stats.recoveredItems} accent="#2C5C4A" />
              <StatCard icon={Archive} label="Closed" value={stats.closedReports} accent="#777D74" />
            </View>

          </>
        ) : null}

        {!loading && section === 'reports' ? (
          <>
            <Text style={styles.title}>Reports ({openReports.length} open)</Text>
            {openReports.map((report) => (
              <View key={report.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <StatusBadge status={report.status} />
                  <Text style={styles.cardCode}>{report.code}</Text>
                </View>
                <ReportCard report={report} />
                <View style={styles.actionRow}>
                  {OPEN_STATUSES.includes(report.status) ? (
                    <ActionButton label="Claimed" onPress={() => changeStatus(report, 'recovered')} kind="primary" />
                  ) : null}
                  <ActionButton label="Delete" onPress={() => confirmDelete(report)} kind="danger" />
                </View>
              </View>
            ))}
            {!openReports.length ? <Text style={styles.empty}>No open reports.</Text> : null}
          </>
        ) : null}

        {!loading && section === 'users' ? (
          <>
            <Text style={styles.title}>Users ({users.length})</Text>
            {users.map((user) => (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.userName}>{user.fullName || 'Unnamed user'}</Text>
                  <Text style={[styles.userStatus, user.status === 'suspended' && styles.userSuspended]}>
                    {user.role.toUpperCase()} · {user.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.muted}>{user.email}{user.mobileNumber ? ` · ${user.mobileNumber}` : ''}</Text>
                {user.id !== profile.id ? (
                  <View style={styles.actionRow}>
                    {user.status === 'active' ? (
                      <ActionButton label="Disable" onPress={() => run(() => setUserStatus(user.id, 'suspended'), `${user.fullName || user.email} disabled. They can no longer sign in.`)} kind="danger" />
                    ) : (
                      <ActionButton label="Enable" onPress={() => run(() => setUserStatus(user.id, 'active'), `${user.fullName || user.email} enabled. They can sign in again.`)} kind="primary" />
                    )}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {!loading && section === 'admins' ? (
          <AdminsSection
            users={users}
            invitations={invitations}
            onInvite={() => inviteAdmin()}
            onRevoke={(id) => run(() => revokeInvitation(id), 'Invitation revoked.')}
            onRefresh={refresh}
          />
        ) : null}

        {!loading && section === 'contact' && settings ? (
          <ContactSection settings={settings} onSave={(next) => run(() => updateContactSettings(next), 'Contact information updated and logged.')} />
        ) : null}

        {!loading && section === 'create' ? (
          <ReportFormScreen key={formKey} settings={settings} onSubmit={submitReport} />
        ) : null}

        {!loading && section === 'logs' ? (
          <>
            <Text style={styles.title}>Audit Logs</Text>
            {logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <Text style={styles.logAction}>{log.action}</Text>
                {log.details ? <Text style={styles.logDetails}>{log.details}</Text> : null}
                <Text style={styles.muted}>{log.targetType} {log.targetId ? `· ${log.targetId.slice(0, 8)}` : ''} · {new Date(log.createdAt).toLocaleString()}</Text>
              </View>
            ))}
            {!logs.length ? <Text style={styles.empty}>No admin activity recorded yet.</Text> : null}
          </>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityLabel="Add report"
        accessibilityRole="button"
        onPress={() => {
          setFormKey((key) => key + 1);
          setSection('create');
        }}
        style={styles.fab}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      <View style={styles.navbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navbarContent}>
          {SECTIONS.map((item) => {
            const isActive = section === item.key;
            const Icon = SECTION_ICONS[item.key];
            return (
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={item.key}
                onPress={() => setSection(item.key)}
                style={styles.navTab}
              >
                <View style={styles.navIconWrap}>
                  <Icon size={18} color={isActive ? '#C64C32' : '#72796F'} strokeWidth={2} />
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
          <Pressable accessibilityLabel="Log out" accessibilityRole="button" onPress={onSignOut} style={styles.navTab}>
            <View style={styles.navIconWrap}>
              <LogOut size={18} color="#B44732" strokeWidth={2} />
            </View>
            <Text style={styles.navLogoutLabel}>Log out</Text>
          </Pressable>
        </ScrollView>
      </View>

      {popup ? (
        <NotificationPopup
          key={popup.id}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
          onPress={() => {
            setPopup(null);
            setSection('reports');
          }}
        />
      ) : null}
    </View>
  );
}

const SECTION_ICONS: Record<Exclude<AdminSection, 'create'>, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  reports: FileText,
  users: Users,
  admins: ShieldCheck,
  contact: Phone,
  logs: ScrollText,
};

function StatCard({ icon: Icon, label, value, accent, highlight = false }: { icon: typeof Users; label: string; value: number; accent: string; highlight?: boolean }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}1A` }]}>
        <Icon size={16} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, kind }: { label: string; onPress: () => void; kind: 'primary' | 'neutral' | 'danger' }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionButton, kind === 'primary' && styles.actionPrimary, kind === 'danger' && styles.actionDanger]}>
      <Text style={[styles.actionText, kind === 'primary' && styles.actionTextPrimary, kind === 'danger' && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

interface AdminsSectionProps {
  users: UserProfile[];
  invitations: AdminInvitation[];
  onInvite: () => Promise<string>;
  onRevoke: (invitationId: string) => void;
  onRefresh: () => Promise<void>;
}

function AdminsSection({ users, invitations, onInvite, onRevoke, onRefresh }: AdminsSectionProps) {
  const [generatedToken, setGeneratedToken] = useState('');
  const [busy, setBusy] = useState(false);
  const admins = users.filter((user) => user.role === 'admin');

  async function generateCode() {
    setBusy(true);
    try {
      const token = await onInvite();
      setGeneratedToken(token);
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (error as { message?: string } | null)?.message ?? 'Please try again.';
      Alert.alert('Could not generate code', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Text style={styles.title}>Administrators ({admins.length})</Text>
      {admins.map((admin) => (
        <View key={admin.id} style={styles.card}>
          <Text style={styles.userName}>{admin.fullName || 'Admin'}</Text>
          <Text style={styles.muted}>{admin.email}</Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>INVITE ADMINISTRATOR</Text>
      <View style={styles.card}>
        <Text style={styles.generateText}>Generate code to add Admin Accounts.</Text>
        <Pressable disabled={busy} onPress={generateCode} style={[styles.inviteButton, busy && styles.actionDisabled]}>
          <Text style={styles.inviteButtonText}>{busy ? 'Generating...' : 'Generate code'}</Text>
        </Pressable>
        {generatedToken ? (
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Share this single-use code (expires in 30 minutes):</Text>
            <Text selectable style={styles.tokenValue}>{generatedToken}</Text>
            <Text style={styles.tokenHint}>The new admin copies this code, signs in (or registers), then pastes it in Profile → ‘Have an Admin invitation?’ → Accept Invitation.</Text>
          </View>
        ) : null}
      </View>

      {invitations.length ? <Text style={styles.sectionLabel}>INVITATIONS</Text> : null}
      {invitations.map((invitation) => {
        const state = invitation.usedAt ? 'Used' : invitation.revokedAt ? 'Revoked' : new Date(invitation.expiresAt) < new Date() ? 'Expired' : 'Pending';
        return (
          <View key={invitation.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>Invitation code</Text>
              <Text style={[styles.userStatus, state !== 'Pending' && styles.userSuspended]}>{state.toUpperCase()}</Text>
            </View>
            <Text style={styles.muted}>Expires {new Date(invitation.expiresAt).toLocaleString()}</Text>
            {state === 'Pending' ? (
              <View style={styles.actionRow}>
                <ActionButton label="Revoke" onPress={() => onRevoke(invitation.id)} kind="danger" />
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

function ContactSection({ settings, onSave }: { settings: ContactSettings; onSave: (settings: Omit<ContactSettings, 'updatedAt'>) => void }) {
  const [organizationName, setOrganizationName] = useState(settings.organizationName);
  const [pickupLocation, setPickupLocation] = useState(settings.pickupLocation);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [facebookPageName, setFacebookPageName] = useState(settings.facebookPageName);
  const [facebookPageUrl, setFacebookPageUrl] = useState(settings.facebookPageUrl);
  const [officeHours, setOfficeHours] = useState(settings.officeHours);
  const [additionalInstructions, setAdditionalInstructions] = useState(settings.additionalInstructions);

  return (
    <>
      <Text style={styles.title}>Contact Information</Text>
      <Text style={styles.subtitle}>Shown on every lost and found report. Changes are recorded in the audit log.</Text>
      <View style={styles.card}>
        <FormField label="Organization Name" onChangeText={setOrganizationName} value={organizationName} />
        <FormField label="Pickup Location" onChangeText={setPickupLocation} value={pickupLocation} />
        <FormField label="Phone Number" onChangeText={setPhoneNumber} value={phoneNumber} keyboardType="phone-pad" />
        <FormField label="Facebook Page Name" onChangeText={setFacebookPageName} value={facebookPageName} />
        <FormField label="Facebook Page URL" onChangeText={setFacebookPageUrl} value={facebookPageUrl} autoCapitalize="none" />
        <FormField label="Office Hours" onChangeText={setOfficeHours} value={officeHours} />
        <FormField label="Additional Instructions" onChangeText={setAdditionalInstructions} value={additionalInstructions} multiline optional />
        <Pressable
          onPress={() => onSave({ organizationName, pickupLocation, phoneNumber, facebookPageName, facebookPageUrl, officeHours, additionalInstructions })}
          style={styles.inviteButton}
        >
          <Text style={styles.inviteButtonText}>Save contact information</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F4' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 76,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C64C32',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#20251F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 10,
  },
  navbar: { borderTopWidth: 1, borderTopColor: '#E5E8E1', backgroundColor: '#FFFFFF', paddingTop: 10, paddingBottom: 8 },
  navbarContent: { gap: 4, paddingHorizontal: 12, alignItems: 'center' },
  navTab: { minWidth: 62, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  navIconWrap: { width: 30, height: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  navLabel: { color: '#72796F', fontSize: 10, fontWeight: '600' },
  navLabelActive: { color: '#C64C32' },
  navLogoutLabel: { color: '#B44732', fontSize: 10, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  title: { color: '#20251F', fontSize: 22, fontWeight: '800', marginBottom: 4, marginTop: 6 },
  subtitle: { color: '#697067', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  sectionLabel: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 14, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E9EFE7', borderRadius: 12, padding: 18, marginBottom: 14 },
  heroText: { flex: 1, paddingRight: 8 },
  heroEyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#20251F', fontSize: 22, lineHeight: 27, fontWeight: '800', marginTop: 6 },
  heroSubtitle: { color: '#596258', fontSize: 12, lineHeight: 17, marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 10, padding: 14 },
  statCardHighlight: { borderColor: '#E4C7C0', backgroundColor: '#FBEEE8' },
  statIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  statValue: { color: '#252922', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#777D74', fontSize: 11, marginTop: 3 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 10, padding: 14, marginBottom: 11 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardCode: { color: '#AAB4A8', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  muted: { color: '#777D74', fontSize: 11, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  actionButton: { width: 112, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDE1D9', borderRadius: 7, paddingVertical: 9, backgroundColor: '#FFFFFF' },
  actionPrimary: { backgroundColor: '#30372E', borderColor: '#30372E' },
  actionDanger: { backgroundColor: '#FFFFFF', borderColor: '#E4C7C0' },
  actionText: { color: '#596258', fontSize: 11, fontWeight: '700' },
  actionTextPrimary: { color: '#FFFFFF' },
  actionTextDanger: { color: '#B44732' },
  matchNames: { color: '#252922', fontSize: 14, fontWeight: '700' },
  claimant: { color: '#39765F', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  claimTitle: { color: '#252922', fontSize: 14, fontWeight: '700' },
  verificationLabel: { color: '#777D74', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },
  verificationText: { color: '#454D43', fontSize: 12, lineHeight: 18, marginTop: 4, backgroundColor: '#F7F8F4', borderRadius: 6, padding: 10 },
  userName: { color: '#252922', fontSize: 14, fontWeight: '700' },
  userStatus: { color: '#39765F', fontSize: 10, fontWeight: '800' },
  userSuspended: { color: '#B44732' },
  inviteButton: { alignItems: 'center', backgroundColor: '#C64C32', borderRadius: 7, paddingVertical: 12, marginTop: 10 },
  generateText: { color: '#596258', fontSize: 12, lineHeight: 17 },
  inviteButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  actionDisabled: { opacity: 0.55 },
  tokenBox: { backgroundColor: '#F6F0E3', borderRadius: 7, padding: 12, marginTop: 12 },
  tokenLabel: { color: '#8A6224', fontSize: 11, fontWeight: '700' },
  tokenValue: { color: '#252922', fontSize: 13, fontWeight: '800', marginTop: 5, letterSpacing: 0.5 },
  tokenHint: { color: '#8A6224', fontSize: 10, lineHeight: 15, marginTop: 6 },
  logCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 8, padding: 12, marginBottom: 8 },
  logAction: { color: '#252922', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  logDetails: { color: '#596258', fontSize: 11, marginTop: 3 },
  empty: { color: '#777D74', fontSize: 12, paddingVertical: 16 },
});
