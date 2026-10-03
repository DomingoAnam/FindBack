import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReportCard } from '../../components/ReportCard';
import { HeroIllustration } from '../../components/Illustrations';
import type { AppTab } from '../../components/BottomTabBar';
import type { AppNotification, ItemReport } from '../../types/report';

interface HomeScreenProps {
  reports: ItemReport[];
  myReports: ItemReport[];
  notifications: AppNotification[];
  firstName: string;
  onNavigate: (tab: AppTab) => void;
}

export function HomeScreen({ reports, myReports, notifications, firstName, onNavigate }: HomeScreenProps) {
  const activeReports = reports.filter((report) => report.status !== 'closed' && report.status !== 'recovered');
  const possibleMatches = reports.filter((report) => report.status === 'possible_match').length;
  const myOpenReports = myReports.filter((report) => report.status !== 'closed' && report.status !== 'recovered');
  const matchAlerts = notifications.filter((notification) => notification.type === 'match' && !notification.isRead);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.welcome}>
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text style={styles.eyebrow}>WELCOME, {firstName.toUpperCase()}</Text>
            <Text style={styles.title}>A little help{'\n'}brings things back.</Text>
          </View>
          <HeroIllustration />
        </View>
        <Text style={styles.subtitle}>Report an item or look through what the market community has found.</Text>
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => onNavigate('report')}>
            <Text style={styles.primaryButtonText}>Create a report</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => onNavigate('search')}>
            <Text style={styles.secondaryButtonText}>Search items</Text>
          </Pressable>
        </View>
      </View>

      {matchAlerts.length ? (
        <Pressable style={styles.matchBanner} onPress={() => onNavigate('updates')}>
          <Text style={styles.matchBannerTitle}>
            {matchAlerts.length === 1 ? 'A possible match was found' : `${matchAlerts.length} possible matches found`}
          </Text>
          <Text style={styles.matchBannerText}>Review the details in Updates before arranging a recovery.</Text>
        </Pressable>
      ) : null}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{activeReports.length}</Text>
          <Text style={styles.statLabel}>Active reports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{possibleMatches}</Text>
          <Text style={styles.statLabel}>Possible matches</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{myOpenReports.length}</Text>
          <Text style={styles.statLabel}>My open reports</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>Recent reports</Text>
          <Text style={styles.sectionSubtitle}>Latest from around the market</Text>
        </View>
        <Pressable onPress={() => onNavigate('search')}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      {reports.slice(0, 3).map((report) => <ReportCard key={report.id} report={report} />)}
      {!reports.length ? <Text style={styles.empty}>No community reports yet. Be the first to help.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  welcome: { padding: 20, borderRadius: 10, backgroundColor: '#E9EFE7', marginBottom: 14 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcomeText: { flex: 1, paddingRight: 8 },
  eyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#20251F', fontSize: 26, lineHeight: 31, fontWeight: '800', marginTop: 10 },
  subtitle: { color: '#596258', fontSize: 13, lineHeight: 19, marginTop: 9 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 18 },
  primaryButton: { backgroundColor: '#C64C32', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 7 },
  secondaryButtonText: { color: '#30372E', fontSize: 12, fontWeight: '700' },
  matchBanner: { backgroundColor: '#FBEEE8', borderWidth: 1, borderColor: '#E4C7C0', borderRadius: 8, padding: 14, marginBottom: 14 },
  matchBannerTitle: { color: '#B44732', fontSize: 13, fontWeight: '800' },
  matchBannerText: { color: '#8A5A4E', fontSize: 12, marginTop: 4 },
  stats: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 8, padding: 15, marginBottom: 23 },
  stat: { flex: 1 },
  statNumber: { color: '#252922', fontSize: 21, fontWeight: '800' },
  statLabel: { color: '#777D74', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E8E1', marginHorizontal: 15 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionTitle: { color: '#252922', fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: '#777D74', fontSize: 12, marginTop: 3 },
  link: { color: '#B44732', fontSize: 12, fontWeight: '700' },
  empty: { color: '#777D74', fontSize: 12, paddingVertical: 12 },
});
