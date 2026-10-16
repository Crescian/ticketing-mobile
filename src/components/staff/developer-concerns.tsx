import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { acknowledgeConcern, closeConcern, getDeveloperQueue } from '@/api/staff';
import type { Concern } from '@/api/staff-types';
import { ConcernCard } from '@/components/staff/concern-card';
import { Button, EmptyState, Field, Screen, ScreenHeader, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'closed', label: 'Closed' },
] as const;
type Tab = (typeof TABS)[number]['key'];

// The Developer's home: concerns ICT staff sent, by status, most urgent first.
export function DeveloperConcernsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('open');
  const queue = useQuery({ queryKey: ['developer', 'concerns', tab], queryFn: () => getDeveloperQueue(tab), refetchInterval: 60_000 });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['developer', 'concerns'] });

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Concerns" subtitle="Sent to you by ICT staff" />
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = queue.data?.counts?.[t.key];
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.tab, { backgroundColor: active ? theme.primary : theme.backgroundElement, borderColor: active ? theme.primary : theme.border }]}>
                <Txt variant="label" style={{ color: active ? theme.onPrimary : theme.text }}>{t.label}</Txt>
                {count !== undefined ? <Txt variant="caption" style={{ fontFamily: Fonts.bold, color: active ? theme.onPrimary : theme.textSecondary }}>{count}</Txt> : null}
              </Pressable>
            );
          })}
        </View>
        <FlatList
          data={queue.data?.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={queue.isRefetching} onRefresh={queue.refetch} tintColor={theme.primary} colors={[theme.primary]} />}
          renderItem={({ item }) => <ConcernItem concern={item} onChanged={refresh} />}
          ListEmptyComponent={
            queue.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
            ) : queue.error ? (
              <EmptyState icon="cloud-offline-outline" title="Couldn't load concerns" message={queue.error.message} />
            ) : (
              <EmptyState icon="code-slash-outline" title="Nothing here" message="No concerns in this tab." />
            )
          }
        />
      </SafeAreaView>
    </Screen>
  );
}

function ConcernItem({ concern, onChanged }: { concern: Concern; onChanged: () => void }) {
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState('');
  const ack = useMutation({ mutationFn: () => acknowledgeConcern(concern.id), onSuccess: onChanged, onError: (e) => Alert.alert('Not done', e.message) });
  const close = useMutation({
    mutationFn: () => closeConcern(concern.id, note.trim()),
    onSuccess: () => {
      setClosing(false);
      onChanged();
    },
    onError: (e) => Alert.alert('Not done', e.message),
  });

  return (
    <ConcernCard concern={concern}>
      {concern.status !== 'Closed' ? (
        closing ? (
          <View style={{ gap: Spacing.two }}>
            <Field label="Closing note *" value={note} onChangeText={setNote} multiline placeholder="What was done / why it's closed" />
            <View style={styles.buttons}>
              <Button title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setClosing(false)} />
              <Button title="Close concern" icon="checkmark-done" size="sm" style={{ flex: 1 }} onPress={() => close.mutate()} loading={close.isPending} disabled={!note.trim()} />
            </View>
          </View>
        ) : (
          <View style={styles.buttons}>
            {concern.status === 'Open' ? <Button title="Acknowledge" icon="eye-outline" size="sm" style={{ flex: 1 }} onPress={() => ack.mutate()} loading={ack.isPending} /> : null}
            <Button title="Close" icon="checkmark-done-outline" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setClosing(true)} />
          </View>
        )
      ) : null}
    </ConcernCard>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: 7 },
  list: { padding: Spacing.four, gap: Spacing.three, flexGrow: 1 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
});
