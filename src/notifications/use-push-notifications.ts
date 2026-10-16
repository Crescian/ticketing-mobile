import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { feedKeys, keys } from '@/api/queries';
import { openInboxItem } from '@/components/staff/staff-inbox';
import { registerForPush, type PushData } from '@/notifications/push';

// Opens what a push is about. Employees: their request (or its chat). Staff:
// the staff ticket screen (or chat), or concerns for developer notifications.
function openFromPush(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as PushData | undefined;
  if (!data) return;

  if (data.audience === 'staff') {
    openInboxItem({ type: data.type ?? '', ticket_id: data.ticket_id ?? null, concern_id: data.concern_id ?? null }, data.type === 'concern_new');
    return;
  }

  if (!data.ticket_id) return;
  if (data.type === 'new_message') {
    router.push({ pathname: '/ticket/[id]/chat', params: { id: data.ticket_id } });
  } else {
    router.push({ pathname: '/ticket/[id]', params: { id: data.ticket_id } });
  }
}

// Mounted once in the signed-in area: registers this phone for pushes, keeps
// the screens fresh when a push arrives, and handles taps — including the tap
// that launched the app from a closed state.
export function usePushNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    registerForPush();

    const launchedFrom = Notifications.getLastNotificationResponse();
    if (launchedFrom) {
      openFromPush(launchedFrom);
      Notifications.clearLastNotificationResponse();
    }

    const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromPush(response);
      Notifications.clearLastNotificationResponse();
    });

    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: keys.tickets });
      queryClient.invalidateQueries({ queryKey: keys.unread });
      queryClient.invalidateQueries({ queryKey: feedKeys.feed });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['developer'] });
    });

    return () => {
      tapped.remove();
      received.remove();
    };
  }, [queryClient]);
}
