import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { markInboxRead } from '@/api/staff';
import { staffKeys, useInbox } from '@/api/staff-queries';
import type { InboxItem } from '@/api/staff-types';
import { Button, EmptyState, Screen, ScreenHeader, Txt, type IconName } from '@/components/ui';
import { Radius, Spacing, type Tone, toneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';

const LOOK: Record<string, { icon: IconName; tone: Tone }> = {
  action_needed: { icon: 'flash-outline', tone: 'primary' },
  sla_alert: { icon: 'timer-outline', tone: 'danger' },
  new_message: { icon: 'chatbubble-ellipses-outline', tone: 'info' },
  resolved_fyi: { icon: 'checkmark-done-outline', tone: 'success' },
  closed_by_requestor: { icon: 'lock-closed-outline', tone: 'success' },
  concern_new: { icon: 'code-slash-outline', tone: 'warning' },
  concern_acknowledged: { icon: 'code-slash-outline', tone: 'info' },
  concern_closed: { icon: 'code-slash-outline', tone: 'success' },
};

export function openInboxItem(item: Pick<InboxItem, 'type' | 'ticket_id' | 'concern_id'>, isDeveloper = false) {
  if (item.ticket_id) {
    if (item.type === 'new_message') router.push({ pathname: '/ticket/[id]/chat', params: { id: item.ticket_id } });
    else router.push({ pathname: '/staff/ticket/[id]', params: { id: item.ticket_id } });
  } else if (item.concern_id) {
    router.push(isDeveloper ? '/' : '/report-developer');
  }
}

// Staff bell: the mobile copy of their "Action needed" / SLA / FYI emails and
// requester messages. Opening the tab marks everything read.
export function StaffInbox({ isDeveloper = false }: { isDeveloper?: boolean }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const inbox = useInbox();

  useFocusEffect(
    useCallback(() => {
      return () => {
        markInboxRead()
          .then(() => queryClient.invalidateQueries({ queryKey: staffKeys.inbox }))
          .catch(() => undefined);
      };
    }, [queryClient]),
  );

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Inbox" subtitle={inbox.data?.unread ? `${inbox.data.unread} new` : 'Everything that needs you'} />
        <FlatList
          data={inbox.data?.notifications ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={inbox.refetch} tintColor={theme.primary} colors={[theme.primary]} />}
          renderItem={({ item }) => <Row item={item} isDeveloper={isDeveloper} />}
          ListEmptyComponent={
            inbox.isPending ? (
              <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
            ) : inbox.error ? (
              <EmptyState icon="cloud-offline-outline" title="Couldn't load the inbox" message={inbox.error.message} action={<Button title="Try again" variant="secondary" onPress={() => inbox.refetch()} />} />
            ) : (
              <EmptyState icon="notifications-outline" title="All caught up" message="Assignments, SLA alerts and requester messages show up here." />
            )
          }
        />
      </SafeAreaView>
    </Screen>
  );
}

function Row({ item, isDeveloper }: { item: InboxItem; isDeveloper: boolean }) {
  const theme = useTheme();
  const look = LOOK[item.type] ?? { icon: 'notifications-outline' as IconName, tone: 'neutral' as Tone };
  const { fg, bg } = toneColors(theme, look.tone);

  return (
    <Pressable
      onPress={() => openInboxItem(item, isDeveloper)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: item.is_read ? theme.border : theme.primary },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Ionicons name={look.icon} size={18} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowTop}>
          <Txt variant={item.is_read ? 'bodyStrong' : 'heading'} numberOfLines={1} style={{ flexShrink: 1, fontSize: 15 }}>{item.title}</Txt>
          <Txt variant="caption" color="textSecondary">{timeAgo(item.at)}</Txt>
        </View>
        {item.body ? <Txt numberOfLines={3} color="textSecondary">{item.body}</Txt> : null}
      </View>
      {!item.is_read ? <View style={[styles.dot, { backgroundColor: theme.danger }]} /> : null}
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
