import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { keys, useTicketCounts, useTicketList } from '@/api/queries';
import type { TicketPhase } from '@/api/types';
import { useSession } from '@/auth/session';
import { ITTeamStrip } from '@/components/it-team';
import { TicketCard } from '@/components/ticket-card';
import { Button, EmptyState, Screen, ScreenHeader, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Same tabs as the web employee dashboard.
const TABS: { key: TicketPhase; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_requestor', label: 'To Confirm' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_TEXT: Record<TicketPhase, string> = {
  all: 'When you need IT help, tap New to file a request.',
  awaiting_requestor: 'Nothing is waiting for your confirmation.',
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

  const header = (
    <View style={{ gap: Spacing.three }}>
      <ITTeamStrip />

      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search subject or ticket #"
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          style={[Type.body, styles.searchInput, { color: theme.text }]}
        />
        {searchInput ? (
          <Pressable onPress={() => setSearchInput('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map(({ key, label }) => {
          const active = key === tab;
          const count = counts.data?.[key];
          const urgent = key === 'awaiting_requestor' && !!count;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.primary : theme.backgroundElement,
                  borderColor: active ? theme.primary : urgent ? theme.danger : theme.border,
                },
              ]}>
              <Txt variant="label" style={{ color: active ? theme.onPrimary : urgent ? theme.danger : theme.text }}>{label}</Txt>
              {count !== undefined ? (
                <View style={[styles.tabCount, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : urgent ? theme.dangerSoft : theme.neutralSoft }]}>
                  <Txt variant="caption" style={{ fontFamily: Fonts.bold, color: active ? theme.onPrimary : urgent ? theme.danger : theme.textSecondary }}>
                    {count}
                  </Txt>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title="My Requests"
          subtitle={user ? `Hi, ${user.name.split(' ')[0]}` : null}
          right={<Button title="New" icon="add" size="sm" onPress={() => router.push('/ticket/new')} />}
        />
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: Spacing.four }}>
              <TicketCard ticket={item} />
            </View>
          )}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={{ marginBottom: Spacing.one }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
            ) : list.error ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Couldn't load your requests"
                message={list.error.message}
                action={<Button title="Try again" variant="secondary" onPress={refresh} />}
              />
            ) : search ? (
              <EmptyState icon="search-outline" title="No matches" message={`No requests match "${search}".`} />
            ) : (
              <EmptyState
                icon="file-tray-outline"
                title={tab === 'all' ? 'No requests yet' : 'Nothing here'}
                message={EMPTY_TEXT[tab]}
                action={tab === 'all' ? <Button title="New Request" icon="add" onPress={() => router.push('/ticket/new')} /> : undefined}
              />
            )
          }
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={{ margin: Spacing.four }} color={theme.primary} /> : null}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.seven, gap: Spacing.three, flexGrow: 1 },
  search: { marginHorizontal: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 46, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.three },
  searchInput: { flex: 1, paddingVertical: Spacing.two },
  tabs: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, borderWidth: 1, paddingLeft: Spacing.three, paddingRight: Spacing.two, paddingVertical: 7 },
  tabCount: { minWidth: 22, borderRadius: Radius.pill, paddingHorizontal: 6, alignItems: 'center' },
});
