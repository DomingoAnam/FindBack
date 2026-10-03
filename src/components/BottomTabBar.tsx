import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, House, Plus, Search, User } from 'lucide-react-native';

export type AppTab = 'home' | 'search' | 'report' | 'updates' | 'profile';

const tabs: { key: AppTab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'search', label: 'Search' },
  { key: 'report', label: 'Report' },
  { key: 'updates', label: 'Updates' },
  { key: 'profile', label: 'Profile' },
];

interface BottomTabBarProps {
  activeTab: AppTab;
  onSelect: (tab: AppTab) => void;
  badges?: Partial<Record<AppTab, number>>;
}

export function BottomTabBar({ activeTab, onSelect, badges }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const badge = badges?.[tab.key] ?? 0;
        const Icon = { home: House, search: Search, report: Plus, updates: Bell, profile: User }[tab.key];
        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, tab.key === 'report' && styles.reportButton]}>
              <Icon size={19} color={tab.key === 'report' ? '#FFFFFF' : isActive ? '#C64C32' : '#72796F'} strokeWidth={2} />
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E8E1',
    backgroundColor: '#FFFFFF',
  },
  tab: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 30, height: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  badge: { position: 'absolute', top: -4, right: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#B44732', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  label: { color: '#72796F', fontSize: 11, fontWeight: '600' },
  activeLabel: { color: '#C64C32' },
  reportButton: { borderRadius: 7, backgroundColor: '#C64C32' },
});
