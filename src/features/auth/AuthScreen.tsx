import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormField } from '../../components/FormField';
import { Logo } from '../../components/Logo';
import { signIn, signUp } from '../../services/auth';

type AuthMode = 'sign_in' | 'sign_up';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage('');
    setNotice('');
  }

  async function submit() {
    setBusy(true);
    setErrorMessage('');
    setNotice('');

    try {
      if (mode === 'sign_up') {
        if (!fullName.trim()) {
          setErrorMessage('Enter your full name.');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          return;
        }
        const signedIn = await signUp(fullName, email, mobileNumber, password);
        if (!signedIn) {
          setNotice('Account created! Check your email to verify it, then sign in.');
          changeMode('sign_in');
          setNotice('Account created! Check your email to verify it, then sign in.');
        }
        return;
      }

      await signIn(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to continue. Please try again.';
      if (message.includes('disabled')) {
        Alert.alert('Account Disabled', 'Your account is disabled by the Admin. Contact the FindBack office for assistance.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setBusy(false);
    }
  }

  const submitDisabled = busy || !email.trim() || !password || (mode === 'sign_up' && (!confirmPassword || !fullName.trim()));

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brandRow}>
        <Logo size={92} />
        <Text style={styles.brand}>FINDBACK</Text>
        <Text style={styles.market}>Dalaguete Public Market</Text>
      </View>

      <Text style={styles.eyebrow}>LOST & FOUND</Text>
      <Text style={styles.title}>{mode === 'sign_up' ? 'Create your account.' : 'Welcome back.'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'sign_up'
          ? 'Join the market community to report and recover lost items.'
          : 'Sign in to report items, search reports, and track recoveries.'}
      </Text>

      <View style={styles.modeSwitch}>
        <Pressable onPress={() => changeMode('sign_in')} style={[styles.modeButton, mode === 'sign_in' && styles.modeSelected]}>
          <Text style={[styles.modeText, mode === 'sign_in' && styles.modeTextSelected]}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => changeMode('sign_up')} style={[styles.modeButton, mode === 'sign_up' && styles.modeSelected]}>
          <Text style={[styles.modeText, mode === 'sign_up' && styles.modeTextSelected]}>Create account</Text>
        </Pressable>
      </View>

      {mode === 'sign_up' ? (
        <>
          <FormField label="Full Name" onChangeText={setFullName} placeholder="Juan Dela Cruz" value={fullName} autoCapitalize="words" />
          <FormField label="Mobile Number" onChangeText={setMobileNumber} placeholder="09XX XXX XXXX" value={mobileNumber} keyboardType="phone-pad" optional />
        </>
      ) : null}

      <FormField label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} autoCapitalize="none" keyboardType="email-address" />

      <FormField label="Password" onChangeText={setPassword} placeholder="Enter your password" value={password} autoCapitalize="none" secureTextEntry />

      {mode === 'sign_up' ? (
        <FormField label="Confirm Password" onChangeText={setConfirmPassword} placeholder="Re-enter your password" value={confirmPassword} autoCapitalize="none" secureTextEntry />
      ) : null}

      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable disabled={submitDisabled} onPress={submit} style={[styles.submitButton, submitDisabled && styles.disabledButton]}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : (
          <Text style={styles.submitText}>
            {mode === 'sign_up' ? 'Create account' : 'Sign in'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36, backgroundColor: '#F7F8F4' },
  brandRow: { alignItems: 'center', gap: 12, marginBottom: 34 },
  brand: { color: '#C64C32', fontSize: 28, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  market: { color: '#767D72', fontSize: 14, textAlign: 'center' },
  eyebrow: { color: '#39765F', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#20251F', fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#697067', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 22 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#E9ECE6', padding: 4, borderRadius: 8, marginBottom: 19 },
  modeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6 },
  modeSelected: { backgroundColor: '#FFFFFF' },
  modeText: { color: '#687066', fontSize: 12, fontWeight: '600' },
  modeTextSelected: { color: '#30372E' },
  submitButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C64C32', borderRadius: 7, marginTop: 5 },
  disabledButton: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  error: { color: '#B44732', fontSize: 12, marginBottom: 10 },
  notice: { color: '#39765F', fontSize: 12, marginBottom: 10 },
  linkButton: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#39765F', fontSize: 12, fontWeight: '700' },
});
