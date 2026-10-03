import { Image, StyleSheet, Text, View } from 'react-native';
import { Backpack, Banknote, FileText, Gem, Glasses, IdCard, Key, Package, Shirt, Smartphone, Umbrella, Wallet, Watch } from 'lucide-react-native';
import type { ItemReport } from '../types/report';
import { StatusBadge } from './StatusBadge';

interface ReportCardProps {
  report: ItemReport;
  showStatus?: boolean;
}

const iconMatchers: { icon: typeof Package; keywords: string[] }[] = [
  { icon: Wallet, keywords: ['wallet', 'purse'] },
  { icon: Smartphone, keywords: ['phone', 'gadget', 'electronic'] },
  { icon: Key, keywords: ['key'] },
  { icon: Backpack, keywords: ['bag', 'backpack'] },
  { icon: Banknote, keywords: ['money', 'cash'] },
  { icon: Umbrella, keywords: ['umbrella'] },
  { icon: IdCard, keywords: ['id', 'card', 'license'] },
  { icon: Gem, keywords: ['jewel', 'ring', 'necklace', 'bracelet'] },
  { icon: Watch, keywords: ['watch'] },
  { icon: Glasses, keywords: ['glass', 'eyewear', 'shades'] },
  { icon: Shirt, keywords: ['cloth', 'shirt', 'jacket', 'apparel'] },
  { icon: FileText, keywords: ['document', 'paper'] },
];

function CategoryIcon({ text }: { text: string }) {
  const normalized = text.toLowerCase();
  const match = iconMatchers.find((matcher) => matcher.keywords.some((keyword) => normalized.includes(keyword)));
  const Icon = match?.icon ?? Package;
  return <Icon size={12} color="#596258" strokeWidth={2.2} />;
}

export function ReportCard({ report, showStatus = false }: ReportCardProps) {
  return (
    <View style={styles.card}>
      {report.photoUris[0] ? <Image source={{ uri: report.photoUris[0] }} style={styles.image} /> : null}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.kindBadge, report.kind === 'lost' ? styles.lostBadge : styles.foundBadge]}>
            <Text style={[styles.kind, report.kind === 'lost' ? styles.lost : styles.found]}>
              {report.kind.toUpperCase()}
            </Text>
          </View>
          <View style={styles.categoryChip}>
            <CategoryIcon text={`${report.category} ${report.name}`} />
            <Text style={styles.category}>{report.category}</Text>
          </View>
        </View>
        {showStatus ? <StatusBadge status={report.status} /> : null}
      </View>
      <Text style={styles.name}>{report.name}</Text>
      <Text style={styles.description} numberOfLines={2}>{report.description}</Text>
      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{report.location}</Text>
        <Text style={styles.meta}>{report.occurredDate} {report.occurredTime}</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.code}>{report.code}</Text>
        {report.createdByName ? <Text style={styles.creator}>Reported by {report.createdByName}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', marginBottom: 10 },
  image: { width: '100%', height: 150, borderRadius: 6, marginBottom: 13, resizeMode: 'cover' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  lostBadge: { backgroundColor: '#FBEEE8' },
  foundBadge: { backgroundColor: '#E9EFE7' },
  kind: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  lost: { color: '#B44732' },
  found: { color: '#39765F' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F3EF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  category: { color: '#596258', fontSize: 11, fontWeight: '600' },
  name: { color: '#20251F', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  description: { color: '#656C63', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  meta: { color: '#777D74', fontSize: 11 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 },
  code: { color: '#AAB4A8', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  creator: { color: '#39765F', fontSize: 10, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
