import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { feedKeys, keys } from '@/api/queries';
import { registerForPush, type PushData } from '@/notifications/push';

// Opens what a push is about: the chat for a new message, otherwise the ticket.
function openFromPush(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as PushData | undefined;
  if (!data?.ticket_id) return;

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
    });

    return () => {
      tapped.remove();
      received.remove();
    };
  }, [queryClient]);
}
