import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { createConcern, getMyConcerns } from '@/api/staff';
import { SelectField } from '@/components/select-field';
import { ConcernCard, URGENCY_TONE } from '@/components/staff/concern-card';
import { Button, Card, ErrorText, Field, Loading, SectionTitle, Txt } from '@/components/ui';
import { Radius, Spacing, toneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// "Report to Developer" — same form and categories as the web page.
export default function ReportDeveloperScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: ['concerns', 'mine'], queryFn: getMyConcerns });
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [urgency, setUrgency] = useState('Medium');
  const [details, setDetails] = useState('');

  const options = useMemo(
    () => (mine.data?.categories ?? []).flatMap((g) => g.items.map((i) => ({ id: i.name, name: i.name, hint: g.group }))),
    [mine.data],
  );
  const hint = mine.data?.categories.flatMap((g) => g.items).find((i) => i.name === category)?.hint;

  const send = useMutation({
    mutationFn: () => createConcern({ subject: subject.trim(), details: details.trim(), category: category!, urgency }),
    onSuccess: (r) => {
      setSubject('');
      setDetails('');
      setCategory(null);
      queryClient.invalidateQueries({ queryKey: ['concerns', 'mine'] });
      Alert.alert('Sent', r.message);
    },
  });
  const error = send.error instanceof ApiError ? send.error : null;

  if (mine.isPending) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: Spacing.four }}>
          <Txt color="textSecondary">Send system issues, data/database changes, connectivity problems or requests straight to the Developer.</Txt>
          <Field label="Subject *" value={subject} onChangeText={setSubject} maxLength={255} error={error?.fieldError('subject')} />
          <SelectField label="Category *" options={options} value={category} onChange={setCategory} error={error?.fieldError('category')} />
          {hint ? <Txt variant="caption" color="textSecondary">Include: {hint}</Txt> : null}
          <View style={{ gap: Spacing.one }}>
            <Txt variant="label" color="textSecondary">Urgency *</Txt>
            <View style={styles.chips}>
              {(mine.data?.urgencies ?? ['Low', 'Medium', 'High']).map((u) => {
                const selected = u === urgency;
                const { fg, bg } = toneColors(theme, URGENCY_TONE[u] ?? 'neutral');
                return (
                  <Pressable key={u} onPress={() => setUrgency(u)} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[styles.chip, { borderColor: selected ? fg : theme.border, backgroundColor: selected ? bg : theme.backgroundElement }]}>
                    <Txt variant="label" style={{ color: selected ? fg : theme.text }}>{u}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field label="Details *" value={details} onChangeText={setDetails} multiline maxLength={5000} placeholder="What happened, where (page / ticket # / PC / location), and steps to reproduce." error={error?.fieldError('details')} />
          <ErrorText message={error && !Object.keys(error.errors).length ? error.message : null} />
          <Button title="Send to Developer" icon="send" onPress={() => send.mutate()} loading={send.isPending} disabled={!subject.trim() || !details.trim() || !category} />
        </Card>

        {mine.data?.data.length ? (
          <>
            <SectionTitle>My concerns</SectionTitle>
            {mine.data.data.map((c) => (
              <ConcernCard key={c.id} concern={c} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.seven },
  chips: { flexDirection: 'row', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
});
