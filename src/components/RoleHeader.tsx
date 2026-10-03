import { Image, StyleSheet, Text, View } from 'react-native';

export function RoleHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: { width: 40, height: 40, borderRadius: 12 },
  brand: { color: '#252922', fontSize: 14, fontWeight: '900', letterSpacing: 1.1 },
  identity: { color: '#767D72', fontSize: 10, marginTop: 2 },
});
