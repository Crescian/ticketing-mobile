import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMarkUpdatesSeen, useNotificationFeed, useUpdatesSeenAt } from '@/api/queries';
import type { AppNotification } from '@/api/types';
import { Button, ErrorText, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';

// The bell tab: what IT did on your requests in the last 7 days — status
// changes and their messages. Items newer than your last visit are marked.
export default function UpdatesScreen() {
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
        <Text style={[styles.title, { color: theme.text }]}>Updates</Text>
        <FlatList
          data={feed.data?.notifications ?? []}
          keyExtractor={(n, i) => `${n.type}-${n.ticket_id}-${n.at}-${i}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={feed.refetch} />}
          renderItem={({ item }) => <UpdateRow item={item} isNew={new Date(item.at).getTime() > since} />}
          ListEmptyComponent={
            feed.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.five }} />
            ) : feed.error ? (
              <View style={styles.empty}>
                <ErrorText message={feed.error.message} />
                <Button title="Try again" variant="secondary" onPress={() => feed.refetch()} />
              </View>
            ) : (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No updates in the last 7 days. When IT works on your requests or messages you, it shows up here.
              </Text>
            )
          }
        />
      </SafeAreaView>
    </Screen>
  );
}

function UpdateRow({ item, isNew }: { item: AppNotification; isNew: boolean }) {
  const theme = useTheme();
  const open = () =>
    item.type === 'new_message'
      ? router.push({ pathname: '/ticket/[id]/chat', params: { id: item.ticket_id } })
      : router.push({ pathname: '/ticket/[id]', params: { id: item.ticket_id } });

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: isNew ? theme.primary : theme.border },
      ]}>
      <Text style={styles.icon}>{item.type === 'new_message' ? '💬' : '🔔'}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowTop}>
          <Text style={{ color: theme.text, fontWeight: isNew ? '700' : '600', flexShrink: 1 }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{timeAgo(item.at)}</Text>
        </View>
        {item.body ? (
          <Text style={{ color: theme.text }} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        {item.ticket_number ? <Text style={{ color: theme.textSecondary, fontSize: 12 }}>#{item.ticket_number}</Text> : null}
      </View>
      {isNew ? <View style={[styles.dot, { backgroundColor: theme.danger }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  list: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: Spacing.five, paddingHorizontal: Spacing.four, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.three },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  icon: { fontSize: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
