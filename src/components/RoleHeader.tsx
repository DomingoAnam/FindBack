import { StyleSheet, Text, View } from 'react-native';
import { Logo } from './Logo';

export function RoleHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Logo size={52} />
        <View>
          <Text style={styles.brand}>FINDBACK</Text>
          <Text style={styles.identity}>Dalaguete Public Market · Community Lost & Found</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 13, backgroundColor: '#F7F8F4' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { color: '#C64C32', fontSize: 18, fontWeight: '900', letterSpacing: 1.4 },
  identity: { color: '#767D72', fontSize: 10, marginTop: 2 },
});
