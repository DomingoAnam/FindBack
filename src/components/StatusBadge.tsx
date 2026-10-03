import { StyleSheet, Text, View } from 'react-native';
import { STATUS_LABELS, type ReportStatus } from '../types/report';

const STATUS_COLORS: Record<ReportStatus, { background: string; text: string }> = {
  reported: { background: '#E9EFE7', text: '#39765F' },
  possible_match: { background: '#FBEEE8', text: '#B44732' },
  under_review: { background: '#F6F0E3', text: '#B47F32' },
  for_recovery: { background: '#F6F0E3', text: '#8A6224' },
  recovered: { background: '#E9EFE7', text: '#2C5C4A' },
  closed: { background: '#EFF1ED', text: '#777D74' },
  rejected: { background: '#EFF1ED', text: '#777D74' },
  cancelled: { background: '#EFF1ED', text: '#777D74' },
  flagged: { background: '#FBEEE8', text: '#B44732' },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
