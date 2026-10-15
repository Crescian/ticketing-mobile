import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ApiError } from '@/api/client';
import { getOrgTree, updateOrgInfo, updatePassword } from '@/api/endpoints';
import type { User } from '@/api/types';
import { SelectField } from '@/components/select-field';
import { Button, Card, ErrorText, Field } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Department (one-time) and password forms — used by the first-login setup
// screen and by Profile.
export function OrgInfoForm({ user, onDone }: { user: User; onDone: (user: User) => void }) {
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

export function PasswordForm({ onDone, temporary = false }: { onDone: (user: User) => void; temporary?: boolean }) {
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
      <Text style={[styles.cardTitle, { color: theme.text }]}>{temporary ? 'Set your own password' : 'Change password'}</Text>
      {temporary ? (
        <Text style={{ color: theme.textSecondary }}>Use the temporary password from your welcome email as the current password.</Text>
      ) : null}

      <Field label={temporary ? 'Current (temporary) password' : 'Current password'} value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" error={error?.fieldError('current_password')} />
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

const styles = StyleSheet.create({
  cardTitle: { fontSize: 18, fontWeight: '700' },
});
