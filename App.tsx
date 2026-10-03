import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './src/components/Logo';
import { AdminDashboard } from './src/features/admin/AdminDashboard';
import { AuthScreen } from './src/features/auth/AuthScreen';
import { UserDashboard } from './src/features/users/UserDashboard';
import { ensureProfile, loadProfile, signOut } from './src/services/auth';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import type { UserProfile } from './src/types/report';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
      setProfileError('');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      let nextProfile: UserProfile | null = null;
      try {
        nextProfile = await loadProfile(userId);
      } catch {
        nextProfile = null;
      }
      if (!nextProfile) {
        try {
          await ensureProfile();
          nextProfile = await loadProfile(userId);
        } catch {
          nextProfile = null;
        }
      }
      setProfile(nextProfile);
      setProfileError(nextProfile ? '' : 'Your profile is missing. Please sign out and register again.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    void fetchProfile(session.user.id);
  }, [session?.user.id, fetchProfile]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // Session is cleared locally regardless.
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {!isSupabaseConfigured ? (
          <View style={styles.loading}>
            <Text style={styles.errorTitle}>Connect FindBack</Text>
            <Text style={styles.errorText}>Add your Supabase project URL and publishable key to .env, then restart Expo. Run supabase/schema.sql in your Supabase SQL Editor to create the tables.</Text>
          </View>
        ) : authLoading || (session && profileLoading) ? (
          <View style={styles.loading}>
            <Logo size={96} />
            <Text style={styles.brand}>FINDBACK</Text>
            <Text style={styles.market}>Dalaguete Public Market</Text>
            <ActivityIndicator color="#C64C32" style={styles.spinner} />
            <Text style={styles.loadingText}>Connecting to FindBack...</Text>
          </View>
        ) : !session ? (
          <AuthScreen />
        ) : profileError || !profile ? (
          <View style={styles.loading}>
            <Text style={styles.errorTitle}>Could not load your account</Text>
            <Text style={styles.errorText}>{profileError || 'Your profile is missing.'}</Text>
            <Pressable onPress={handleSignOut} style={styles.signOutButton}><Text style={styles.signOutText}>Sign out</Text></Pressable>
          </View>
        ) : profile.status === 'suspended' ? (
          <View style={styles.loading}>
            <Text style={styles.errorTitle}>Account suspended</Text>
            <Text style={styles.errorText}>Your account was suspended by an administrator. Contact the FindBack office for assistance.</Text>
            <Pressable onPress={handleSignOut} style={styles.signOutButton}><Text style={styles.signOutText}>Sign out</Text></Pressable>
          </View>
        ) : profile.role === 'admin' ? (
          <AdminDashboard profile={profile} onSignOut={handleSignOut} />
        ) : (
          <UserDashboard profile={profile} onSignOut={handleSignOut} onProfileChanged={() => { void fetchProfile(profile.id); }} />
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F4',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  brand: { color: '#C64C32', fontSize: 26, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  market: { color: '#767D72', fontSize: 13 },
  spinner: { marginTop: 14 },
  loadingText: { color: '#697067', fontSize: 12 },
  errorTitle: { color: '#252922', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  errorText: { color: '#697067', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  signOutButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 7, backgroundColor: '#30372E', marginTop: 4 },
  signOutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
