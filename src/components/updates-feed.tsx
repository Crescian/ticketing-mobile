import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMarkUpdatesSeen, useNotificationFeed, useUpdatesSeenAt } from '@/api/queries';
import type { AppNotification } from '@/api/types';
import { Button, EmptyState, Screen, ScreenHeader, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';

// The bell tab: what IT did on your requests in the last 7 days — status
// changes and their messages. Items newer than your last visit are marked.
export function UpdatesFeed() {
  const theme = useTheme();
  const feed = useNotificationFeed();
  const seenAt = useUpdatesSeenAt();
  const markSeen = useMarkUpdatesSeen();

  // Leaving the tab marks everything shown as seen, so the "new" markers
  // stay visible while you're reading them. The ref keeps the latest
  // server_time without re-running the effect on every refresh.
  const serverTime = useRef<string | undefined>(undefined);
  const latestServerTime = feed.data?.server_time;
  useEffect(() => {
    serverTime.current = latestServerTime;
  }, [latestServerTime]);
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (serverTime.current) markSeen(serverTime.current);
      };
    }, [markSeen]),
  );

  const since = seenAt.data ? new Date(seenAt.data).getTime() : 0;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Updates" subtitle="Last 7 days on your requests" />
        <FlatList
          data={feed.data?.notifications ?? []}
          keyExtractor={(n, i) => `${n.type}-${n.ticket_id}-${n.at}-${i}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={feed.refetch} tintColor={theme.primary} colors={[theme.primary]} />}
          renderItem={({ item }) => <UpdateRow item={item} isNew={new Date(item.at).getTime() > since} />}
          ListEmptyComponent={
            feed.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
            ) : feed.error ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Couldn't load updates"
                message={feed.error.message}
                action={<Button title="Try again" variant="secondary" onPress={() => feed.refetch()} />}
              />
            ) : (
              <EmptyState icon="notifications-outline" title="All caught up" message="When IT works on your requests or messages you, it shows up here." />
            )
          }
        />
      </SafeAreaView>
    </Screen>
  );
}

function UpdateRow({ item, isNew }: { item: AppNotification; isNew: boolean }) {
  const theme = useTheme();
  const isMessage = item.type === 'new_message';
  const open = () =>
    isMessage
      ? router.push({ pathname: '/ticket/[id]/chat', params: { id: item.ticket_id } })
      : router.push({ pathname: '/ticket/[id]', params: { id: item.ticket_id } });

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: isNew ? theme.primary : theme.border },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      <View style={[styles.icon, { backgroundColor: isMessage ? theme.infoSoft : theme.backgroundSelected }]}>
        <Ionicons name={isMessage ? 'chatbubble-ellipses' : 'git-commit-outline'} size={18} color={isMessage ? theme.info : theme.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowTop}>
          <Txt variant={isNew ? 'heading' : 'bodyStrong'} numberOfLines={1} style={{ flexShrink: 1, fontSize: 15 }}>{item.title}</Txt>
          <Txt variant="caption" color="textSecondary">{timeAgo(item.at)}</Txt>
        </View>
        {item.body ? <Txt numberOfLines={2}>{item.body}</Txt> : null}
        {item.ticket_number ? <Txt variant="caption" color="textSecondary">#{item.ticket_number}</Txt> : null}
      </View>
      {isNew ? <View style={[styles.dot, { backgroundColor: theme.danger }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.four, gap: Spacing.two, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.three },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
