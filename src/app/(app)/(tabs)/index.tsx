import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { keys, useTicketCounts, useTicketList } from '@/api/queries';
import type { TicketPhase } from '@/api/types';
import { useSession } from '@/auth/session';
import { ITTeamStrip } from '@/components/it-team';
import { TicketCard } from '@/components/ticket-card';
import { Button, ErrorText, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Same tabs as the web employee dashboard.
const TABS: { key: TicketPhase; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_requestor', label: 'Confirm' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_TEXT: Record<TicketPhase, string> = {
  all: "You haven't filed any requests yet. Tap New Request when you need IT help.",
  awaiting_requestor: 'Nothing waiting for your confirmation.',
  submitted: 'No requests waiting for Helpdesk.',
  scheduled: 'No scheduled requests.',
  in_progress: 'No requests in progress.',
  closed: 'No closed requests yet.',
  cancelled: 'No cancelled requests.',
};

export default function MyRequestsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [tab, setTab] = useState<TicketPhase>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce typing so every keystroke isn't a request.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const counts = useTicketCounts();
  const list = useTicketList(tab, search);
  const tickets = list.data?.pages.flatMap((p) => p.data) ?? [];

  // Coming back from a ticket screen shows fresh statuses (skipped on the
  // first focus, when the queries are already loading).
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) queryClient.invalidateQueries({ queryKey: keys.tickets });
      focusedBefore.current = true;
    }, [queryClient]),
  );

  const refresh = () => {
    counts.refetch();
    list.refetch();
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>My Requests</Text>
            <Text style={{ color: theme.textSecondary }}>Hi, {user?.name?.split(' ')[0]}</Text>
          </View>
          <View style={{ width: 150 }}>
            <Button title="+ New Request" onPress={() => router.push('/ticket/new')} />
          </View>
        </View>

        <ITTeamStrip />

        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by subject or ticket #"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        />

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {TABS.map(({ key, label }) => {
              const active = key === tab;
              const count = counts.data?.[key];
              const highlight = key === 'awaiting_requestor' && !!count;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={[
                    styles.tab,
                    { backgroundColor: active ? theme.primary : theme.backgroundElement, borderColor: highlight && !active ? theme.danger : theme.border },
                  ]}>
                  <Text style={{ color: active ? theme.onPrimary : highlight ? theme.danger : theme.text, fontWeight: '600' }}>
                    {label}
                    {count !== undefined ? ` ${count}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={refresh} />}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.five }} />
            ) : list.error ? (
              <View style={styles.empty}>
                <ErrorText message={list.error.message} />
                <Button title="Try again" variant="secondary" onPress={refresh} />
              </View>
            ) : (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                {search ? `No requests match "${search}".` : EMPTY_TEXT[tab]}
              </Text>
            )
          }
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={{ margin: Spacing.three }} /> : null}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  title: { fontSize: 26, fontWeight: '700' },
  search: { marginHorizontal: Spacing.three, marginTop: Spacing.three, minHeight: 44, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.three, fontSize: 16 },
  tabs: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  tab: { borderRadius: 999, borderWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: Spacing.five, paddingHorizontal: Spacing.four, gap: Spacing.three },
});
