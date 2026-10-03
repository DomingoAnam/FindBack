import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Globe, Phone, UserRound } from 'lucide-react-native';
import type { ReportContact, ReportKind } from '../types/report';

interface OwnerContactCardProps {
  contact: ReportContact;
  kind: ReportKind;
  heading?: string;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function OwnerContactCard({ contact, kind, heading }: OwnerContactCardProps) {
  const phoneLink = `tel:${contact.mobileNumber.replace(/[^+\d]/g, '')}`;
  const facebookLink = normalizeUrl(contact.facebookUrl);
  const hasPhone = Boolean(contact.mobileNumber.trim());
  const hasFacebook = Boolean(facebookLink);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{heading ?? (kind === 'found' ? 'CONTACT THE PERSON WHO FOUND IT' : 'CONTACT THE OWNER')}</Text>

      <View style={styles.row}>
        <UserRound size={15} color="#39765F" />
        <View style={styles.rowText}>
          <Text style={styles.label}>Contact Us</Text>
          <Text style={styles.value}>FindBack – {contact.fullName || 'Community member'}</Text>
          {hasPhone ? <Text style={styles.muted}>{contact.mobileNumber}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={!hasPhone}
          onPress={() => { void Linking.openURL(phoneLink); }}
          style={[styles.button, styles.callButton, !hasPhone && styles.buttonDisabled]}
        >
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.callText}>Call Us</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!hasFacebook}
          onPress={() => { void Linking.openURL(facebookLink); }}
          style={[styles.button, styles.facebookButton, !hasFacebook && styles.buttonDisabled]}
        >
          <Globe size={14} color={hasFacebook ? '#39765F' : '#9AA096'} />
          <Text style={[styles.facebookText, !hasFacebook && styles.facebookTextDisabled]}>Visit Facebook Page</Text>
        </Pressable>
      </View>
      {!hasPhone && !hasFacebook ? (
        <Text style={styles.emptyNote}>This user has not shared contact details yet. Use the official recovery contact below.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FDF8F6', borderWidth: 1, borderColor: '#E4C7C0', borderRadius: 10, padding: 16, gap: 12, marginBottom: 14 },
  heading: { color: '#B44732', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  rowText: { flex: 1 },
  label: { color: '#777D74', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#252922', fontSize: 13, fontWeight: '700', marginTop: 2 },
  muted: { color: '#596258', fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 7, paddingVertical: 11 },
  callButton: { backgroundColor: '#39765F' },
  callText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  facebookButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9D4C6' },
  facebookText: { color: '#39765F', fontSize: 12, fontWeight: '700' },
  facebookTextDisabled: { color: '#9AA096' },
  buttonDisabled: { opacity: 0.5 },
  emptyNote: { color: '#8A5A4E', fontSize: 11, lineHeight: 16 },
});
