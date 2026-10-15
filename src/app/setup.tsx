import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { getMe, getOrgTree, updateOrgInfo, updatePassword } from '@/api/endpoints';
import type { User } from '@/api/types';
import { useSession } from '@/auth/session';
import { SelectField } from '@/components/select-field';
import { Button, Card, ErrorText, Field, Screen } from '@/components/ui';
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

            {step === 1 ? <OrgInfoStep user={user} onDone={setUser} /> : null}
            {step === 2 ? <PasswordStep onDone={setUser} /> : null}
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

function OrgInfoStep({ user, onDone }: { user: User; onDone: (user: User) => void }) {
  const theme = useTheme();
  const tree = useQuery({ queryKey: ['org-tree'], queryFn: getOrgTree });
  const [buId, setBuId] = useState<string | null>(user.business_unit?.id ?? null);
  const [companyId, setCompanyId] = useState<string | null>(user.company?.id ?? null);
  const [departmentId, setDepartmentId] = useState<string | null>(user.department?.id ?? null);
  const [position, setPosition] = useState(user.position ?? '');

  const save = useMutation({
    mutationFn: () => updateOrgInfo(departmentId!, position.trim() || null),
    onSuccess: onDone,
  });
  const error = save.error instanceof ApiError ? save.error : null;

  const businessUnits = tree.data ?? [];
  const companies = businessUnits.find((b) => b.id === buId)?.companies ?? [];
  const departments = companies.find((c) => c.id === companyId)?.departments ?? [];

  return (
    <Card style={{ gap: Spacing.three }}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Where do you work?</Text>
      <Text style={{ color: theme.textSecondary }}>
        IT uses this to route your requests. You can set it once — after that, ask IT to change it.
      </Text>
      <ErrorText message={tree.error?.message} />

      <SelectField
        label="Business unit"
        options={businessUnits}
        value={buId}
        disabled={tree.isPending}
        placeholder={tree.isPending ? 'Loading…' : 'Select…'}
        onChange={(id) => {
          setBuId(id);
          setCompanyId(null);
          setDepartmentId(null);
        }}
      />
      <SelectField
        label="Company"
        options={companies}
        value={companyId}
        disabled={!buId}
        onChange={(id) => {
          setCompanyId(id);
          setDepartmentId(null);
        }}
      />
      <SelectField
        label="Department"
        options={departments}
        value={departmentId}
        disabled={!companyId}
        onChange={setDepartmentId}
        error={error?.fieldError('department_id')}
      />
      <Field label="Position (optional)" value={position} onChangeText={setPosition} placeholder="e.g. Accountant" error={error?.fieldError('position')} />

      <ErrorText message={error && !Object.keys(error.errors).length ? error.message : null} />
      <Button title="Save and continue" onPress={() => save.mutate()} loading={save.isPending} disabled={!departmentId} />
    </Card>
  );
}

function PasswordStep({ onDone }: { onDone: (user: User) => void }) {
  const theme = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = useMutation({
    mutationFn: () => updatePassword(current, next, confirm),
    onSuccess: onDone,
  });
  const error = save.error instanceof ApiError ? save.error : null;
  const mismatch = confirm.length > 0 && next !== confirm;

  return (
    <Card style={{ gap: Spacing.three }}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Set your own password</Text>
      <Text style={{ color: theme.textSecondary }}>Use the temporary password from your welcome email as the current password.</Text>

      <Field label="Current (temporary) password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" error={error?.fieldError('current_password')} />
      <Field label="New password" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" error={error?.fieldError('password')} />
      <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" error={mismatch ? "Passwords don't match." : undefined} />

      <ErrorText message={error && !Object.keys(error.errors).length ? error.message : null} />
      <Button
        title="Save password"
        onPress={() => save.mutate()}
        loading={save.isPending}
        disabled={!current || next.length < 8 || next !== confirm}
      />
    </Card>
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
  cardTitle: { fontSize: 18, fontWeight: '700' },
});
