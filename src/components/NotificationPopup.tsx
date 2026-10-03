import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, X } from 'lucide-react-native';

interface NotificationPopupProps {
  title: string;
  message: string;
  onPress: () => void;
  onClose: () => void;
}

export function NotificationPopup({ title, message, onPress, onClose }: NotificationPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable accessibilityRole="alert" onPress={onPress} style={styles.card}>
        <View style={styles.iconWrap}>
          <BellRing size={18} color="#C64C32" />
        </View>
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text numberOfLines={2} style={styles.message}>{message}</Text>
        </View>
        <Pressable accessibilityLabel="Dismiss notification" hitSlop={10} onPress={onClose}>
          <X size={16} color="#777D74" />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 10, left: 12, right: 12, zIndex: 50, elevation: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E4C7C0',
    shadowColor: '#20251F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FBEEE8', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { color: '#252922', fontSize: 13, fontWeight: '800' },
  message: { color: '#596258', fontSize: 11, lineHeight: 16, marginTop: 2 },
});
