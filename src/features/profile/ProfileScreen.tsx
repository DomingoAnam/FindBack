import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { FormField } from '../../components/FormField';
import { acceptAdminInvitation, adminSetupAvailable, promoteToAdminWithSecret, updatePassword, updateProfile } from '../../services/auth';
import type { UserProfile } from '../../types/report';

interface ProfileScreenProps {
  profile: UserProfile;
  onSignOut: () => void;
  onProfileChanged: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  const message = (error as { message?: string } | null)?.message;
  return message ?? fallback;
}

export function ProfileScreen({ profile, onSignOut, onProfileChanged }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber);
  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl);
  const [newPassword, setNewPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.role !== 'admin') {
      void adminSetupAvailable().then(setSetupAvailable);
    }
  }, [profile.role]);

  async function saveProfile() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Enter your full name.');
      return;
    }
    setBusy(true);
    try {
      await updateProfile(profile.id, fullName, mobileNumber, facebookUrl);
      onProfileChanged();
      setEditing(false);
      Alert.alert('Profile updated', 'Your information was saved.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      Alert.alert('Password changed', 'Your password was updated.');
    } catch (error) {
      Alert.alert('Could not change password', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function redeemInvite() {
    if (!inviteToken.trim()) return;
    setBusy(true);
    try {
      await acceptAdminInvitation(inviteToken);
      setInviteToken('');
      Alert.alert('Welcome, Admin', 'Your administrator access is now active.');
      onProfileChanged();
    } catch (error) {
      Alert.alert('Invitation not accepted', errorMessage(error, 'Please check the code and try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function claimInitialAdmin() {
    if (!setupSecret.trim()) return;
    setBusy(true);
    try {
      await promoteToAdminWithSecret(setupSecret);
      setSetupSecret('');
      Alert.alert('Admin setup complete', 'You are now the FindBack administrator.');
      onProfileChanged();
    } catch (error) {
      Alert.alert('Setup failed', errorMessage(error, 'Please check the setup secret.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <UserRound size={26} color="#39765F" />
        </View>
        <Text style={styles.name}>{profile.fullName || 'FindBack user'}</Text>
        <Text style={styles.meta}>{profile.email}</Text>
        {profile.mobileNumber ? <Text style={styles.meta}>{profile.mobileNumber}</Text> : null}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile.role === 'admin' ? 'Administrator' : 'Community member'}</Text>
        </View>
      </View>

      <Pressable onPress={() => setEditing((value) => !value)} style={styles.sectionToggle}>
        <Text style={styles.sectionToggleText}>{editing ? 'Hide account settings' : 'Edit profile & password'}</Text>
      </Pressable>

      {editing ? (
        <View style={styles.editCard}>
          <FormField label="Full Name" onChangeText={setFullName} value={fullName} autoCapitalize="words" />
          <FormField label="Mobile Number" onChangeText={setMobileNumber} value={mobileNumber} keyboardType="phone-pad" optional />
          <FormField label="Facebook URL" onChangeText={setFacebookUrl} value={facebookUrl} autoCapitalize="none" keyboardType="url" placeholder="https://facebook.com/your.profile" optional />
          <Pressable disabled={busy} onPress={saveProfile} style={[styles.actionButton, busy && styles.actionDisabled]}>
            <Text style={styles.actionText}>Save profile</Text>
          </Pressable>
          <View style={styles.divider} />
          <FormField label="New password" onChangeText={setNewPassword} value={newPassword} autoCapitalize="none" secureTextEntry placeholder="At least 6 characters" />
          <Pressable disabled={busy} onPress={changePassword} style={[styles.actionButton, styles.secondaryAction, busy && styles.actionDisabled]}>
            <KeyRound size={13} color="#30372E" />
            <Text style={styles.secondaryActionText}>Change password</Text>
          </Pressable>
        </View>
      ) : null}

      {profile.role !== 'admin' && setupAvailable ? (
        <View style={styles.setupCard}>
          <View style={styles.setupHeader}>
            <ShieldCheck size={16} color="#39765F" />
            <Text style={styles.setupTitle}>Initial Admin Setup</Text>
          </View>
          <Text style={styles.setupText}>No administrator exists yet. Enter the setup secret provided by the project owner to become the first Admin.</Text>
          <FormField label="Setup secret" onChangeText={setSetupSecret} value={setupSecret} autoCapitalize="none" placeholder="Provided offline" />
          <Pressable disabled={busy} onPress={claimInitialAdmin} style={[styles.actionButton, busy && styles.actionDisabled]}>
            <Text style={styles.actionText}>Activate Admin</Text>
          </Pressable>
        </View>
      ) : null}

      {profile.role !== 'admin' && !setupAvailable ? (
        <View style={styles.setupCard}>
          <View style={styles.setupHeader}>
            <ShieldCheck size={16} color="#39765F" />
            <Text style={styles.setupTitle}>Have an Admin invitation?</Text>
          </View>
          <Text style={styles.setupText}>Enter the single-use invitation code shared by an administrator.</Text>
          <FormField label="Invitation code" onChangeText={setInviteToken} value={inviteToken} autoCapitalize="none" placeholder="Paste code here" />
          <Pressable disabled={busy} onPress={redeemInvite} style={[styles.actionButton, busy && styles.actionDisabled]}>
            <Text style={styles.actionText}>Accept Invitation</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable onPress={onSignOut} style={styles.signOutButton}>
        <LogOut size={14} color="#B44732" />
        <Text style={styles.signOutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 28 },
  profileCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E9EFE7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { color: '#20251F', fontSize: 18, fontWeight: '800' },
  meta: { color: '#777D74', fontSize: 12, marginTop: 3 },
  roleBadge: { backgroundColor: '#E9EFE7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  roleText: { color: '#39765F', fontSize: 11, fontWeight: '700' },
  sectionToggle: { alignItems: 'center', paddingVertical: 10 },
  sectionToggleText: { color: '#39765F', fontSize: 12, fontWeight: '700' },
  editCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAE4', borderRadius: 10, padding: 16, marginBottom: 14 },
  divider: { height: 1, backgroundColor: '#E8EAE4', marginVertical: 14 },
  setupCard: { backgroundColor: '#E9EFE7', borderRadius: 10, padding: 16, marginBottom: 14 },
  setupHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  setupTitle: { color: '#252922', fontSize: 14, fontWeight: '800' },
  setupText: { color: '#596258', fontSize: 11, lineHeight: 16, marginBottom: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#30372E', borderRadius: 7, paddingVertical: 12 },
  actionDisabled: { opacity: 0.55 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryAction: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE1D9' },
  secondaryActionText: { color: '#30372E', fontSize: 12, fontWeight: '700' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#E4C7C0', backgroundColor: '#FFFFFF', borderRadius: 7, paddingVertical: 13, marginTop: 16 },
  signOutText: { color: '#B44732', fontSize: 13, fontWeight: '700' },
});
