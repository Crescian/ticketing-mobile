import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useLookups, useStaffAction } from '@/api/staff-queries';
import type { ActionField, Lookups, ScheduleConflict, StaffAction } from '@/api/staff-types';
import { AttachmentPicker } from '@/components/attachments';
import { SelectField } from '@/components/select-field';
import { Button, ErrorText, Field, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickedFile } from '@/lib/files';

type Values = Record<string, string | boolean | undefined>;

const initialValues = (fields: ActionField[]): Values =>
  Object.fromEntries(fields.filter((f) => f.default !== undefined).map((f) => [f.name, f.default]));

// Asks the overtime question the web shows as its "schedule conflict" modal.
function askScheduleDecision(conflict: ScheduleConflict): Promise<'overtime' | 'next_day' | null> {
  return new Promise((resolve) => {
    const who = conflict.technician_name ?? 'The assignee';
    Alert.alert(
      'Past working hours',
      `${who}'s day ends at ${conflict.day_end ?? '5:00 PM'}; this would finish around ${conflict.proposed_end ?? 'later'}` +
        (conflict.overtime_minutes ? ` (${conflict.overtime_minutes} min overtime).` : '.'),
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Next working day', onPress: () => resolve('next_day') },
        { text: 'Overtime today', onPress: () => resolve('overtime') },
      ],
    );
  });
}

type Props = { ticketId: string; action: StaffAction | null; onClose: () => void };

// Full-screen form for one staff action, built from the server's field list
// (App\Support\Mobile\Field). Actions without fields never open this — the
// detail screen confirms and runs them directly.
export function ActionForm({ ticketId, action, onClose }: Props) {
  const theme = useTheme();
  const run = useStaffAction(ticketId);
  const needsLookups = !!action?.fields.some((f) => f.type === 'lookup');
  const lookups = useLookups(needsLookups);
  const [values, setValues] = useState<Values>({});
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  // Reset when a different action opens.
  if (action && openedFor !== action.key) {
    setOpenedFor(action.key);
    setValues(initialValues(action.fields));
    setFiles([]);
    setError(null);
  }

  const set = (name: string, value: string | boolean | undefined) => setValues((v) => ({ ...v, [name]: value }));
  const missing = action?.fields.filter((f) => f.required && f.type !== 'files' && (values[f.name] === undefined || values[f.name] === '')) ?? [];

  const submit = async (scheduleDecision?: 'overtime' | 'next_day') => {
    if (!action) return;
    setError(null);
    try {
      const payload = scheduleDecision ? { ...values, schedule_decision: scheduleDecision } : values;
      const result = await run.mutateAsync({ action: action.key, values: payload, files });
      onClose();
      Alert.alert('Done', result.message);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'schedule_decision_required') {
        const conflict = e.data.conflict as ScheduleConflict | undefined;
        const decision = await askScheduleDecision(conflict ?? ({} as ScheduleConflict));
        if (decision) await submit(decision);
        return;
      }
      if (e instanceof ApiError && e.status === 409) return; // double tap
      setError(e instanceof ApiError ? e : new ApiError(0, 'Something went wrong. Please try again.'));
    }
  };

  return (
    <Modal visible={!!action} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Txt variant="title" style={styles.flex} numberOfLines={1}>{action?.label}</Txt>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {action?.fields.map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(v) => set(field.name, v)}
                lookups={lookups.data}
                lookupsLoading={lookups.isPending && needsLookups}
                files={files}
                onFiles={setFiles}
                error={error?.fieldError(field.name)}
              />
            ))}
            <ErrorText message={error && !Object.keys(error.errors).length ? error.message : null} />
            <Button
              title={action?.label ?? 'Submit'}
              icon="checkmark"
              variant={action?.tone === 'danger' ? 'danger' : 'primary'}
              onPress={() => submit()}
              loading={run.isPending}
              disabled={missing.length > 0}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

type FieldInputProps = {
  field: ActionField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean | undefined) => void;
  lookups?: Lookups;
  lookupsLoading: boolean;
  files: PickedFile[];
  onFiles: (files: PickedFile[]) => void;
  error?: string;
};

function FieldInput({ field, value, onChange, lookups, lookupsLoading, files, onFiles, error }: FieldInputProps) {
  const theme = useTheme();
  const label = field.required ? `${field.label} *` : field.label;

  switch (field.type) {
    case 'textarea':
      return <Field label={label} value={(value as string) ?? ''} onChangeText={onChange} multiline maxLength={field.max} hint={field.hint} error={error} />;

    case 'number':
      return <Field label={label} value={(value as string) ?? ''} onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" hint={field.hint} error={error} />;

    case 'boolean':
      return (
        <View style={[styles.switchRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.flex}>
            <Txt variant="bodyStrong">{field.label}</Txt>
            {field.hint ? <Txt variant="caption" color="textSecondary">{field.hint}</Txt> : null}
          </View>
          <Switch value={!!value} onValueChange={onChange} trackColor={{ true: theme.primary }} />
        </View>
      );

    case 'radio':
    case 'select': {
      const options = field.options ?? [];
      if (options.length <= 4) {
        return (
          <View style={{ gap: Spacing.one }}>
            <Txt variant="label" color="textSecondary">{label}</Txt>
            <View style={styles.chips}>
              {options.map((o) => {
                const selected = value === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => onChange(selected && !field.required ? undefined : o.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement }]}>
                    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={16} color={selected ? theme.primary : theme.textMuted} />
                    <Txt variant="label">{o.label}</Txt>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Txt variant="caption" color="danger">{error}</Txt> : field.hint ? <Txt variant="caption" color="textSecondary">{field.hint}</Txt> : null}
          </View>
        );
      }
      return (
        <SelectField
          label={label}
          options={options.map((o) => ({ id: o.value, name: o.label }))}
          value={(value as string) ?? null}
          onChange={onChange}
          error={error}
        />
      );
    }

    case 'lookup':
      if (field.source === 'sla_rules' || field.source === 'self_triage_rules') {
        return <RulePicker field={field} label={label} value={value as string | undefined} onChange={onChange} lookups={lookups} loading={lookupsLoading} error={error} />;
      }
      return (
        <SelectField
          label={label}
          placeholder={lookupsLoading ? 'Loading…' : 'Select…'}
          disabled={lookupsLoading}
          options={(field.source === 'assignees' ? lookups?.assignees : lookups?.workload_classes) ?? []}
          value={(value as string) ?? null}
          onChange={onChange}
          error={error}
        />
      );

    case 'files':
      return <AttachmentPicker files={files} onChange={onFiles} />;

    default:
      return null;
  }
}

// Category → sub-category picker for SLA rules (the value sent is the rule id).
function RulePicker({ field, label, value, onChange, lookups, loading, error }: {
  field: ActionField;
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  lookups?: Lookups;
  loading: boolean;
  error?: string;
}) {
  const categories = useMemo(() => (field.source === 'self_triage_rules' ? lookups?.self_triage_rules : lookups?.sla_rules) ?? [], [field.source, lookups]);
  const selectedCategory = categories.find((c) => c.rules.some((r) => r.id === value));
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategory?.id ?? null);
  const rules = categories.find((c) => c.id === categoryId)?.rules ?? [];

  return (
    <View style={{ gap: Spacing.three }}>
      <SelectField
        label={label}
        placeholder={loading ? 'Loading…' : 'Choose a category…'}
        disabled={loading}
        options={categories.map((c) => ({ id: c.id, name: c.name, hint: `${c.rules.length} sub-categor${c.rules.length === 1 ? 'y' : 'ies'}` }))}
        value={categoryId}
        onChange={(id) => {
          setCategoryId(id);
          onChange(undefined);
        }}
      />
      <SelectField
        label="Sub-category"
        placeholder="Choose…"
        disabled={!categoryId}
        options={rules.map((r) => ({ id: r.id, name: r.name, hint: r.hint }))}
        value={value ?? null}
        onChange={onChange}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.seven },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
