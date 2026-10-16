import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session';
import { useMicrosoftSignIn } from '@/auth/use-microsoft-sign-in';
import { Button, Card, ErrorText, Field, Screen, Txt } from '@/components/ui';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Same message as the web login's hero panel.
const HEADLINE: [string, string][] = [
  ['SUBMIT YOUR ', 'ISSUE.'],
  ['WATCH IT ', 'MOVE.'],
  ['GET IT ', 'RESOLVED.'],
];

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
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.hero}>
            <SafeAreaView edges={['top']} style={styles.heroInner}>
              <View style={styles.logoTile}>
                <Image source={require('@/assets/images/lgict-logo.png')} style={styles.logo} contentFit="contain" accessibilityLabel="LGICT" />
              </View>
              <View style={styles.eyebrow}>
                <View style={styles.dot} />
                <Text style={styles.eyebrowText}>IT SUPPORT PORTAL</Text>
              </View>
              {HEADLINE.map(([plain, emphasis]) => (
                <Text key={plain} style={styles.headline}>
                  {plain}
                  <Text style={{ color: Brand.accent }}>{emphasis}</Text>
                </Text>
              ))}
            </SafeAreaView>
          </View>

          <View style={styles.formArea}>
            <Card style={{ gap: Spacing.four }}>
              <View style={{ gap: 2 }}>
                <Txt variant="title">Sign in</Txt>
                <Txt color="textSecondary">Use your company email to continue.</Txt>
              </View>

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
              <Button title="Sign in" icon="log-in-outline" onPress={submit} loading={submitting} disabled={!email || !password} />

              {microsoft.enabled ? (
                <>
                  <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <Txt variant="caption" color="textSecondary">or</Txt>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                  </View>
                  <Button
                    title="Sign in with Microsoft"
                    icon="logo-microsoft"
                    variant="outline"
                    onPress={submitMicrosoft}
                    loading={microsoft.busy}
                    disabled={!microsoft.ready || submitting}
                  />
                </>
              ) : null}
            </Card>

            <View style={styles.footer}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.textSecondary} />
              <Txt variant="caption" color="textSecondary">Leonio Group · LGICT Support</Txt>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Brand.dark, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInner: { paddingHorizontal: Spacing.five, paddingBottom: Spacing.six, paddingTop: Spacing.five, gap: Spacing.one },
  logoTile: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginBottom: Spacing.four },
  logo: { width: 112, height: 56 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.accent },
  eyebrowText: { color: Brand.accentSoft, fontFamily: Fonts.extrabold, fontSize: 12, letterSpacing: 1.2 },
  headline: { color: '#ffffff', fontFamily: Fonts.black, fontSize: 30, lineHeight: 34 },
  formArea: { flex: 1, padding: Spacing.four, marginTop: -Spacing.five, gap: Spacing.four },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, paddingBottom: Spacing.four },
});
