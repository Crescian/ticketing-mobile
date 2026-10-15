import { useMutation } from '@tanstack/react-query';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMe } from '@/api/endpoints';
import type { User } from '@/api/types';
import { useSession } from '@/auth/session';
import { OrgInfoForm, PasswordForm } from '@/components/account-forms';
import { Button, Card, ErrorText, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// First-login account setup, same two steps as the web's account-setup page:
// confirm your department, then replace the temporary password. Each step is
// skipped once done; the server lifts the gate when both are, and the session
// switches to the app automatically.
export default function SetupScreen() {
  const theme = useTheme();
  const { user, setUser, signOut } = useSession();
  if (!user) return null;

  const orgDone = !user.can_update_org_info;
  const passwordDone = !user.must_change_password;
  const step = !orgDone ? 1 : !passwordDone ? 2 : null;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={{ gap: Spacing.one }}>
              <Text style={[styles.title, { color: theme.text }]}>Welcome, {user.name.split(' ')[0]}</Text>
              <Text style={{ color: theme.textSecondary }}>Two quick steps before you can file requests.</Text>
            </View>

            <View style={styles.steps}>
              <StepPill number={1} label="Your department" done={orgDone} active={step === 1} />
              <StepPill number={2} label="New password" done={passwordDone} active={step === 2} />
            </View>

            {step === 1 ? <OrgInfoForm user={user} onDone={setUser} /> : null}
            {step === 2 ? <PasswordForm temporary onDone={setUser} /> : null}
            {step === null ? <StuckNotice onRefreshed={setUser} /> : null}

            <Button title="Sign out" variant="secondary" onPress={signOut} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

function StepPill({ number, label, done, active }: { number: number; label: string; done: boolean; active: boolean }) {
  const theme = useTheme();
  const color = done ? theme.success : active ? theme.primary : theme.textSecondary;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={{ color, fontWeight: '700' }}>{done ? '✓' : number}</Text>
      <Text style={{ color: active || done ? theme.text : theme.textSecondary, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

// Both steps show as done but the server still flags setup — e.g. IT changed
// something meanwhile. Re-check, and point to IT if it persists.
function StuckNotice({ onRefreshed }: { onRefreshed: (user: User) => void }) {
  const theme = useTheme();
  const refresh = useMutation({ mutationFn: getMe, onSuccess: onRefreshed });

  return (
    <Card>
      <Text style={{ color: theme.text }}>Your setup looks complete. If you still see this screen, please contact IT.</Text>
      <ErrorText message={refresh.error?.message} />
      <Button title="Check again" variant="secondary" onPress={() => refresh.mutate()} loading={refresh.isPending} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, fontWeight: '700' },
  steps: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
});
