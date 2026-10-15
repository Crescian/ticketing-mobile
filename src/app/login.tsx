import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { useMicrosoftSignIn } from '@/auth/use-microsoft-sign-in';
import { Button, Card, ErrorText, Field, Screen } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, signInWithMicrosoft } = useSession();
  const microsoft = useMicrosoftSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'Something went wrong. Please try again.'));
      setSubmitting(false);
    }
  };

  const submitMicrosoft = async () => {
    setError(null);
    try {
      const accessToken = await microsoft.getAccessToken();
      if (!accessToken) return; // closed the browser — nothing to report
      setSubmitting(true);
      await signInWithMicrosoft(accessToken);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, 'Microsoft sign-in failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: Brand.dark }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>ICT Support</Text>
              <Text style={styles.subtitle}>Leonio Group — request IT help and track it here.</Text>
            </View>

            <Card style={{ gap: Spacing.three }}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                placeholder="you@leoniogroup.com"
                error={error?.fieldError('email')}
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={error?.fieldError('password')}
              />
              {/* Field errors show under their field; anything else (deactivated, offline) shows here. */}
              <ErrorText message={error && !Object.keys(error.errors).length ? error.message : null} />
              <Button title="Sign in" onPress={submit} loading={submitting} disabled={!email || !password} />

              {microsoft.enabled ? (
                <>
                  <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <Text style={{ color: theme.textSecondary }}>or</Text>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                  </View>
                  <Button
                    title="Sign in with Microsoft"
                    variant="secondary"
                    onPress={submitMicrosoft}
                    loading={microsoft.busy}
                    disabled={!microsoft.ready || submitting}
                  />
                </>
              ) : null}
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.four },
  header: { gap: Spacing.two },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  subtitle: { color: Brand.accentSoft, fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
