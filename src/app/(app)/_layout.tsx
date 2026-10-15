import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { usePushNotifications } from '@/notifications/use-push-notifications';

// Signed-in area: the tab bar, with ticket screens pushed on top of it.
export default function AppLayout() {
  const theme = useTheme();
  usePushNotifications();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundElement },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ticket/new" options={{ title: 'New Request', presentation: 'modal' }} />
      <Stack.Screen name="ticket/[id]/index" options={{ title: 'Request' }} />
      <Stack.Screen name="ticket/[id]/edit" options={{ title: 'Edit Request', presentation: 'modal' }} />
      <Stack.Screen name="ticket/[id]/chat" options={{ title: 'Chat' }} />
    </Stack>
  );
}
