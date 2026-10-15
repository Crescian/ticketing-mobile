import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/auth/session';
import { useTheme } from '@/hooks/use-theme';
import { usePushNotifications } from '@/notifications/use-push-notifications';

// Signed-in area: the tab bar, with ticket screens pushed on top of it.
export default function AppLayout() {
  const theme = useTheme();
  usePushNotifications();
  const { user } = useSession();
  const needsTour = user ? !user.onboarded : false;

  // First sign-in: show the welcome tour over the app once.
  useEffect(() => {
    if (needsTour) router.push('/welcome');
  }, [needsTour]);

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
      <Stack.Screen name="profile/password" options={{ title: 'Change Password', presentation: 'modal' }} />
      <Stack.Screen name="profile/department" options={{ title: 'Department', presentation: 'modal' }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
  );
}
