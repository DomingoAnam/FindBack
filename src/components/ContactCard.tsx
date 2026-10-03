import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Globe, MapPin, Phone } from 'lucide-react-native';
import type { ContactSettings } from '../types/report';

interface ContactCardProps {
  settings: ContactSettings;
  title?: string;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function ContactCard({ settings, title = 'WHERE CAN I PICK UP THE ITEM?' }: ContactCardProps) {
  const phoneLink = `tel:${settings.phoneNumber.replace(/[^+\d]/g, '')}`;
  const facebookLink = normalizeUrl(settings.facebookPageUrl);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>

      <View style={styles.row}>
        <MapPin size={15} color="#39765F" />
        <View style={styles.rowText}>
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={styles.value}>{settings.pickupLocation}</Text>
          {settings.officeHours ? <Text style={styles.muted}>Open: {settings.officeHours}</Text> : null}
        </View>
      </View>

      <View style={styles.row}>
        <Phone size={15} color="#39765F" />
        <View style={styles.rowText}>
          <Text style={styles.label}>Contact Us</Text>
          <Text style={styles.value}>{settings.phoneNumber}</Text>
          <Text style={styles.muted}>{settings.facebookPageName}</Text>
        </View>
      </View>

      {settings.additionalInstructions ? (
        <Text style={styles.instructions}>{settings.additionalInstructions}</Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => { void Linking.openURL(phoneLink); }} style={[styles.button, styles.callButton]}>
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.callText}>Call Us</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => { void Linking.openURL(facebookLink); }} style={[styles.button, styles.facebookButton]}>
          <Globe size={14} color="#39765F" />
          <Text style={styles.facebookText}>Visit Facebook Page</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#E9EFE7', borderRadius: 10, padding: 16, gap: 12, marginBottom: 16 },
  heading: { color: '#39765F', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  rowText: { flex: 1 },
  label: { color: '#777D74', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#252922', fontSize: 13, fontWeight: '700', marginTop: 2 },
  muted: { color: '#596258', fontSize: 11, marginTop: 2 },
  instructions: { color: '#596258', fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 7, paddingVertical: 11 },
  callButton: { backgroundColor: '#39765F' },
  callText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  facebookButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9D4C6' },
  facebookText: { color: '#39765F', fontSize: 12, fontWeight: '700' },
});
