import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMe } from '@/api/endpoints';
import type { User } from '@/api/types';
import { useSession } from '@/auth/session';
import { OrgInfoForm, PasswordForm } from '@/components/account-forms';
import { Button, Card, ErrorText, Screen, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// First-login account setup, same two steps as the web's account-setup page:
// confirm your department, then replace the temporary password. Each step is
// skipped once done; the server lifts the gate when both are, and the session
// switches to the app automatically.
export default function SetupScreen() {
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
              <Txt variant="display">Welcome, {user.name.split(' ')[0]}</Txt>
              <Txt color="textSecondary">Two quick steps before you can file requests.</Txt>
            </View>

            <View style={styles.steps}>
              <StepPill number={1} label="Your department" done={orgDone} active={step === 1} />
              <StepPill number={2} label="New password" done={passwordDone} active={step === 2} />
            </View>

            {step === 1 ? <OrgInfoForm user={user} onDone={setUser} /> : null}
            {step === 2 ? <PasswordForm temporary onDone={setUser} /> : null}
            {step === null ? <StuckNotice onRefreshed={setUser} /> : null}

            <Button title="Sign out" icon="log-out-outline" variant="ghost" onPress={signOut} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

function StepPill({ number, label, done, active }: { number: number; label: string; done: boolean; active: boolean }) {
  const theme = useTheme();
  const color = done ? theme.success : active ? theme.primary : theme.textMuted;
  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement }]}>
      <View style={[styles.pillNumber, { backgroundColor: color }]}>
        {done ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : <Txt variant="label" style={{ color: '#ffffff' }}>{number}</Txt>}
      </View>
      <Txt variant="label" color={active || done ? 'text' : 'textSecondary'}>{label}</Txt>
    </View>
  );
}

// Both steps show as done but the server still flags setup — e.g. IT changed
// something meanwhile. Re-check, and point to IT if it persists.
function StuckNotice({ onRefreshed }: { onRefreshed: (user: User) => void }) {
  const refresh = useMutation({ mutationFn: getMe, onSuccess: onRefreshed });

  return (
    <Card>
      <Txt>Your setup looks complete. If you still see this screen, please contact IT.</Txt>
      <ErrorText message={refresh.error?.message} />
      <Button title="Check again" icon="refresh" variant="secondary" onPress={() => refresh.mutate()} loading={refresh.isPending} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.four, gap: Spacing.four },
  steps: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', borderWidth: 1, borderRadius: Radius.pill, paddingLeft: 4, paddingRight: Spacing.three, paddingVertical: 4 },
  pillNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
