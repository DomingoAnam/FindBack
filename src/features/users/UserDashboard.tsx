import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomTabBar, type AppTab } from '../../components/BottomTabBar';
import { NotificationPopup } from '../../components/NotificationPopup';
import { RoleHeader } from '../../components/RoleHeader';
import { supabase } from '../../lib/supabase';
import { loadNotifications, markAllNotificationsRead } from '../../services/notifications';
import {
  createReport,
  dismissMatch,
  loadMyMatches,
  loadMyReports,
  loadReports,
  ownerUpdateReportStatus,
} from '../../services/reports';
import { loadContactSettings } from '../../services/settings';
import type { AppNotification, ContactSettings, ItemReport, MatchRecord, NewReport, UserProfile } from '../../types/report';
import { HomeScreen } from '../home/HomeScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { ReportFormScreen } from '../reports/ReportFormScreen';
import { SearchScreen } from '../search/SearchScreen';
import { UpdatesScreen } from '../updates/UpdatesScreen';

interface UserDashboardProps {
  profile: UserProfile;
  onSignOut: () => void;
  onProfileChanged: () => void;
}

export function UserDashboard({ profile, onSignOut, onProfileChanged }: UserDashboardProps) {
  const [tab, setTab] = useState<AppTab>('home');
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [myReports, setMyReports] = useState<ItemReport[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [popup, setPopup] = useState<{ id: number; title: string; message: string } | null>(null);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      loadReports(),
      loadMyReports(profile.id),
      loadNotifications(profile.id),
      loadContactSettings(),
    ]);

    const [reportsResult, myReportsResult, notificationsResult, settingsResult] = results;
    if (reportsResult.status === 'fulfilled') setReports(reportsResult.value);
    if (myReportsResult.status === 'fulfilled') setMyReports(myReportsResult.value);
    if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
    if (settingsResult.status === 'fulfilled') setSettings(settingsResult.value);

    if (reportsResult.status === 'rejected') {
      const reason = reportsResult.reason;
      setErrorMessage(reason instanceof Error ? reason.message : 'Could not load reports.');
    } else if (results.some((result) => result.status === 'rejected')) {
      setErrorMessage('Some data could not be loaded. Pull to retry shortly.');
    } else {
      setErrorMessage('');
    }
    setLoading(false);
  }, [profile.id]);

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
      .channel(`findback-user-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => { void refresh(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload) => {
        const row = payload.new as { title?: string; message?: string };
        setPopup({ id: Date.now(), title: row.title ?? 'FindBack update', message: row.message ?? '' });
        void refresh();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => { void refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void refresh(); })
      .subscribe();
    return () => {
      mounted = false;
      void supabaseClient.removeChannel(channel);
    };
  }, [refresh, profile.id]);

  useEffect(() => {
    let cancelled = false;
    void loadMyMatches(profile.id, myReports.map((report) => report.id))
      .then((next) => { if (!cancelled) setMatches(next); })
      .catch(() => { if (!cancelled) setMatches([]); });
    return () => { cancelled = true; };
  }, [myReports, profile.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  async function submitReport(report: NewReport) {
    const code = await createReport(report, profile.id);
    await refresh();
    setTab('updates');
    return code;
  }

  async function handleDismissMatch(matchId: string) {
    try {
      await dismissMatch(matchId);
      await refresh();
    } catch (error) {
      Alert.alert('Could not update match', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function handleOwnerAction(report: ItemReport, action: 'recovered' | 'closed') {
    try {
      await ownerUpdateReportStatus(report.id, action);
      await refresh();
      Alert.alert(
        action === 'recovered' ? 'Item claimed' : 'Report closed',
        action === 'recovered'
          ? `${report.code} is marked as claimed. Great news!`
          : `${report.code} is now closed.`,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (error as { message?: string } | null)?.message ?? 'Please try again.';
      Alert.alert('Could not update report', message);
    }
  }

  async function readAllNotifications() {
    try {
      await markAllNotificationsRead(profile.id);
      await refresh();
    } catch {
      // Non-critical: badges refresh on next sync.
    }
  }

  return (
    <View style={styles.screen}>
      <RoleHeader />
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.content}>
        {tab === 'home' ? (
          <HomeScreen reports={reports} myReports={myReports} notifications={notifications} firstName={profile.fullName.split(' ')[0] || 'there'} onNavigate={setTab} />
        ) : tab === 'search' ? (
          <SearchScreen
            reports={reports}
            loading={loading}
            settings={settings}
            currentUserId={profile.id}
            onOwnerAction={(report, action) => { void handleOwnerAction(report, action); }}
          />
        ) : tab === 'report' ? (
          <ReportFormScreen
            settings={settings}
            ownerContact={{ fullName: profile.fullName, mobileNumber: profile.mobileNumber, facebookUrl: profile.facebookUrl, role: profile.role }}
            onSubmit={submitReport}
          />
        ) : tab === 'updates' ? (
          <UpdatesScreen
            myReports={myReports}
            matches={matches}
            notifications={notifications}
            loading={loading}
            onMarkAllRead={() => { void readAllNotifications(); }}
            onDismissMatch={(matchId) => { void handleDismissMatch(matchId); }}
            onOwnerAction={(report, action) => { void handleOwnerAction(report, action); }}
          />
        ) : (
          <ProfileScreen
            profile={profile}
            onSignOut={onSignOut}
            onProfileChanged={onProfileChanged}
          />
        )}
      </View>
      <BottomTabBar activeTab={tab} onSelect={setTab} badges={{ updates: unreadCount }} />
      {popup ? (
        <NotificationPopup
          key={popup.id}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
          onPress={() => {
            setPopup(null);
            setTab('updates');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F4' },
  content: { flex: 1 },
  error: { color: '#B44732', fontSize: 12, paddingHorizontal: 20, paddingVertical: 6 },
});
