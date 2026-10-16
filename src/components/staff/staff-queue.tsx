import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStaffQueue } from '@/api/staff-queries';
import type { QueueTab } from '@/api/staff-types';
import { useSession } from '@/auth/session';
import { StaffTicketCard } from '@/components/staff/staff-ticket-card';
import { Button, EmptyState, Notice, Screen, ScreenHeader, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'priority', label: 'Priority' },
] as const;

// A staff member's work queue — their role's web dashboard on the phone:
// same tabs, counts and filters (from GET /mobile/staff/queue).
export function StaffQueueScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const [tab, setTab] = useState<string | null>(null); // null = the role's default tab
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queue = useStaffQueue(tab, search, sort);
  const first = queue.data?.pages[0];
  const tabs: QueueTab[] = first?.tabs ?? [];
  const activeTab = tab ?? first?.tab ?? null;
  const tickets = queue.data?.pages.flatMap((p) => p.data) ?? [];
  const selfTriage = first?.self_triage ?? [];

  // Fresh counts when coming back from a ticket (not on first focus).
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) queue.refetch();
      focusedBefore.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const header = (
    <View style={{ gap: Spacing.three }}>
      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search ticket #, subject, requester"
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          style={[Type.body, { flex: 1, color: theme.text, paddingVertical: Spacing.two }]}
        />
        {searchInput ? (
          <Pressable onPress={() => setSearchInput('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, { backgroundColor: active ? theme.primary : theme.backgroundElement, borderColor: active ? theme.primary : theme.border }]}>
              <Txt variant="label" style={{ color: active ? theme.onPrimary : theme.text }}>{t.label}</Txt>
              <View style={[styles.tabCount, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : t.count ? theme.backgroundSelected : theme.neutralSoft }]}>
                <Txt variant="caption" style={{ fontFamily: Fonts.bold, color: active ? theme.onPrimary : t.count ? theme.primary : theme.textMuted }}>{t.count}</Txt>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sortRow}>
        <Txt variant="caption" color="textSecondary">{first ? `${first.meta.total} ticket${first.meta.total === 1 ? '' : 's'}` : ' '}</Txt>
        <View style={styles.sorts}>
          {SORTS.map((s) => (
            <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={6} accessibilityRole="button" accessibilityState={{ selected: sort === s.key }}>
              <Txt variant="caption" style={{ fontFamily: sort === s.key ? Fonts.extrabold : Fonts.semibold, color: sort === s.key ? theme.primary : theme.textSecondary }}>
                {s.label}
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>

      {selfTriage.length ? (
        <View style={{ paddingHorizontal: Spacing.four, gap: Spacing.two }}>
          <Notice tone="warning" icon="people-outline" text={`Helpdesk is away — ${selfTriage.length} new ticket${selfTriage.length > 1 ? 's' : ''} you can take.`} />
          {selfTriage.map((t) => (
            <StaffTicketCard key={`st-${t.id}`} ticket={t} />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Queue" subtitle={user?.role ?? null} />
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: Spacing.four }}>
              <StaffTicketCard ticket={item} />
            </View>
          )}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={queue.isRefetching && !queue.isFetchingNextPage} onRefresh={queue.refetch} tintColor={theme.primary} colors={[theme.primary]} />}
          onEndReached={() => queue.hasNextPage && !queue.isFetchingNextPage && queue.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            queue.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
            ) : queue.error ? (
              <EmptyState icon="cloud-offline-outline" title="Couldn't load the queue" message={queue.error.message} action={<Button title="Try again" variant="secondary" onPress={() => queue.refetch()} />} />
            ) : (
              <EmptyState icon="checkmark-done-outline" title={search ? 'No matches' : 'All clear'} message={search ? `Nothing matches "${search}".` : 'No tickets in this tab right now.'} />
            )
          }
          ListFooterComponent={queue.isFetchingNextPage ? <ActivityIndicator style={{ margin: Spacing.four }} color={theme.primary} /> : null}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.seven, gap: Spacing.three, flexGrow: 1 },
  search: { marginHorizontal: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 46, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.three },
  tabs: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, borderWidth: 1, paddingLeft: Spacing.three, paddingRight: Spacing.two, paddingVertical: 7 },
  tabCount: { minWidth: 22, borderRadius: Radius.pill, paddingHorizontal: 6, alignItems: 'center' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four },
  sorts: { flexDirection: 'row', gap: Spacing.three },
});
