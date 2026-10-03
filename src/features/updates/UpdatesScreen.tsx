import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, BellRing, CheckCheck, Handshake, RefreshCw, Search } from 'lucide-react-native';
import { ReportCard } from '../../components/ReportCard';
import { EmptyBoxIllustration } from '../../components/Illustrations';
import { OPEN_STATUSES, STATUS_FLOW, STATUS_LABELS, type AppNotification, type ItemReport, type MatchRecord, type NotificationType, type ReportStatus } from '../../types/report';

interface UpdatesScreenProps {
  myReports: ItemReport[];
  matches: MatchRecord[];
  notifications: AppNotification[];
  loading: boolean;
  onMarkAllRead: () => void;
  onDismissMatch: (matchId: string) => void;
  onOwnerAction: (report: ItemReport, action: 'recovered' | 'closed') => void;
}

const notificationIcons: Record<NotificationType, typeof BellRing> = {
  match: Search,
  status: RefreshCw,
  claim: Handshake,
  review: AlertTriangle,
  admin: BellRing,
};

export function UpdatesScreen({ myReports, matches, notifications, loading, onMarkAllRead, onDismissMatch, onOwnerAction }: UpdatesScreenProps) {
  const trackedReports = myReports.filter((report) => !['closed', 'cancelled', 'rejected'].includes(report.status));
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  function confirmOwnerAction(report: ItemReport, action: 'recovered' | 'closed') {
    const title = action === 'recovered' ? 'Item claimed?' : 'Close report?';
    const message = action === 'recovered'
      ? `Confirm the item in ${report.code} was claimed by its owner.`
      : `Close ${report.code}? Use this if the item was not claimed within 30 days.`;
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'recovered' ? 'Claimed' : 'Close',
        style: action === 'closed' ? 'destructive' : 'default',
        onPress: () => onOwnerAction(report, action),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>YOUR FINDBACK ACTIVITY</Text>
      <Text style={styles.title}>Updates</Text>
      <Text style={styles.subtitle}>Review possible matches and follow your reports.</Text>

      {matches.length ? (
        <>
          <Text style={styles.sectionTitle}>Possible matches</Text>
          {matches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <Text style={styles.matchTitle}>A {match.mineIsLost ? 'found' : 'lost'} report may match yours</Text>
              <Text style={styles.matchText}>‘{match.otherReportName}’ · {Math.round(match.score * 100)}% similar</Text>
              <Text style={styles.matchHint}>Find it in Search and contact the reporter by call or Facebook to verify in person.</Text>
              <View style={styles.matchActions}>
                <Pressable onPress={() => onDismissMatch(match.id)} style={[styles.matchButton, styles.matchSecondary]}>
                  <Text style={styles.matchSecondaryText}>Not a match</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {unreadCount ? (
          <Pressable onPress={onMarkAllRead} style={styles.markReadButton}>
            <CheckCheck size={13} color="#39765F" />
            <Text style={styles.markReadText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>
      {notifications.length ? notifications.slice(0, 10).map((notification) => {
        const Icon = notificationIcons[notification.type] ?? BellRing;
        const unread = !notification.isRead;
        return (
          <View key={notification.id} style={[styles.notification, unread && styles.notificationUnread]}>
            <View style={[styles.notificationIcon, unread && styles.notificationIconUnread]}>
              <Icon size={15} color={unread ? '#C64C32' : '#777D74'} />
            </View>
            <View style={styles.notificationBody}>
              <Text style={[styles.notificationTitle, unread && styles.notificationTitleUnread]}>{notification.title}</Text>
              {notification.message ? <Text style={styles.notificationText}>{notification.message}</Text> : null}
              <Text style={styles.notificationDate}>{new Date(notification.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        );
      }) : (
        <Text style={styles.emptyNotice}>{loading ? 'Loading updates...' : 'No notifications yet. Matches and status changes will appear here.'}</Text>
      )}

      <Text style={styles.sectionTitle}>My tracked reports</Text>
      {trackedReports.length ? trackedReports.map((report) => (
        <View key={report.id} style={styles.trackedReport}>
          <StatusStepper status={report.status} />
          <ReportCard report={report} showStatus />
          {OPEN_STATUSES.includes(report.status) ? (
            <View style={styles.ownerActions}>
              <Pressable onPress={() => confirmOwnerAction(report, 'recovered')} style={[styles.ownerButton, styles.claimedButton]}>
                <Text style={styles.claimedButtonText}>Claimed</Text>
              </Pressable>
              <Pressable onPress={() => confirmOwnerAction(report, 'closed')} style={[styles.ownerButton, styles.closeReportButton]}>
                <Text style={styles.closeReportButtonText}>Closed</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )) : (
        <View style={styles.emptyState}>
          <EmptyBoxIllustration />
          <Text style={styles.emptyTitle}>No tracked reports yet</Text>
          <Text style={styles.emptyText}>Your active reports will appear here. Create one from the Report tab.</Text>
        </View>
      )}

    </ScrollView>
  );
}

function StatusStepper({ status }: { status: ReportStatus }) {
  const currentIndex = STATUS_FLOW.indexOf(status);
  return (
    <View style={styles.stepper}>
      {STATUS_FLOW.map((step, index) => {
        const reached = currentIndex >= index;
        return (
          <View key={step} style={styles.stepperItem}>
            <View style={[styles.stepDot, reached && styles.stepDotReached]} />
            <Text style={[styles.stepLabel, reached && styles.stepLabelReached]} numberOfLines={1}>
              {STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 24 },
  eyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#20251F', fontSize: 27, fontWeight: '800', marginTop: 7 },
  subtitle: { color: '#697067', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#252922', fontSize: 17, fontWeight: '800', marginBottom: 11, marginTop: 6 },
  markReadButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  markReadText: { color: '#39765F', fontSize: 11, fontWeight: '700' },
  matchCard: { backgroundColor: '#FBEEE8', borderWidth: 1, borderColor: '#E4C7C0', borderRadius: 10, padding: 15, marginBottom: 12 },
  matchTitle: { color: '#B44732', fontSize: 13, fontWeight: '800' },
  matchText: { color: '#252922', fontSize: 13, fontWeight: '600', marginTop: 5 },
  matchHint: { color: '#8A5A4E', fontSize: 11, marginTop: 4 },
  matchActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  matchButton: { flex: 1, alignItems: 'center', borderRadius: 7, paddingVertical: 10 },
  matchPrimary: { backgroundColor: '#C64C32' },
  matchPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  matchSecondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4C7C0' },
  matchSecondaryText: { color: '#B44732', fontSize: 11, fontWeight: '700' },
  notification: { flexDirection: 'row', gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 8, padding: 13, marginBottom: 9 },
  notificationUnread: { borderColor: '#E4C7C0', backgroundColor: '#FDF8F6' },
  notificationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1ED', alignItems: 'center', justifyContent: 'center' },
  notificationIconUnread: { backgroundColor: '#FBEEE8' },
  notificationBody: { flex: 1 },
  notificationTitle: { color: '#454D43', fontSize: 13, fontWeight: '600' },
  notificationTitleUnread: { color: '#252922', fontWeight: '800' },
  notificationText: { color: '#656C63', fontSize: 12, lineHeight: 17, marginTop: 3 },
  notificationDate: { color: '#9AA096', fontSize: 10, marginTop: 5 },
  trackedReport: { marginBottom: 4 },
  stepper: { flexDirection: 'row', backgroundColor: '#E9EFE7', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, justifyContent: 'space-between' },
  stepperItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#AAB4A8', marginBottom: 5 },
  stepDotReached: { backgroundColor: '#C64C32' },
  stepLabel: { color: '#8A9187', fontSize: 8, fontWeight: '600', textAlign: 'center' },
  stepLabelReached: { color: '#454D43', fontWeight: '800' },
  ownerActions: { flexDirection: 'row', gap: 8, marginTop: -3, marginBottom: 14 },
  ownerButton: { flex: 1, alignItems: 'center', borderRadius: 7, paddingVertical: 11 },
  claimedButton: { backgroundColor: '#39765F' },
  claimedButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  closeReportButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4C7C0' },
  closeReportButtonText: { color: '#B44732', fontSize: 12, fontWeight: '700' },
  claimCard: { padding: 14, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', marginBottom: 9 },
  claimStatus: { fontSize: 12, fontWeight: '800' },
  claimApproved: { color: '#39765F' },
  claimPending: { color: '#B47F32' },
  claimRejected: { color: '#777D74' },
  claimItem: { color: '#252922', fontSize: 13, fontWeight: '700', marginTop: 4 },
  claimDate: { color: '#777D74', fontSize: 11, marginTop: 4 },
  emptyState: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 14 },
  emptyTitle: { color: '#252922', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { color: '#777D74', fontSize: 12, marginTop: 5, textAlign: 'center' },
  emptyNotice: { color: '#777D74', fontSize: 12, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 15, marginBottom: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(32, 37, 31, 0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#F7F8F4', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80%' },
  claimTitle: { color: '#20251F', fontSize: 19, fontWeight: '800', marginBottom: 6 },
  claimSubtitle: { color: '#596258', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  submitButton: { alignItems: 'center', backgroundColor: '#30372E', borderRadius: 7, paddingVertical: 13 },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#596258', fontSize: 12, fontWeight: '700' },
});
