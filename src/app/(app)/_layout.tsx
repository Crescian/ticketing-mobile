import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/auth/session';
import { isEmployee } from '@/lib/roles';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePushNotifications } from '@/notifications/use-push-notifications';

// Signed-in area: the tab bar, with ticket screens pushed on top of it.
export default function AppLayout() {
  const theme = useTheme();
  usePushNotifications();
  const { user } = useSession();
  // The tour explains filing requests — Employees only (web: same).
  const needsTour = user ? isEmployee(user.role) && !user.onboarded : false;

  // First sign-in: show the welcome tour over the app once.
  useEffect(() => {
    if (needsTour) router.push('/welcome');
  }, [needsTour]);

  return (
    <Stack
      screenOptions={{
        // Dark green header like the web's navbar.
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: theme.onHeader,
        headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ticket/new" options={{ title: 'New Request', presentation: 'modal' }} />
      <Stack.Screen name="ticket/[id]/index" options={{ title: 'Request' }} />
      <Stack.Screen name="ticket/[id]/edit" options={{ title: 'Edit Request', presentation: 'modal' }} />
      <Stack.Screen name="ticket/[id]/chat" options={{ title: 'Chat' }} />
      <Stack.Screen name="staff/ticket/[id]" options={{ title: 'Ticket' }} />
      <Stack.Screen name="my-requests" options={{ title: 'My Requests' }} />
      <Stack.Screen name="report-developer" options={{ title: 'Report to Developer' }} />
      <Stack.Screen name="profile/password" options={{ title: 'Change Password', presentation: 'modal' }} />
      <Stack.Screen name="profile/department" options={{ title: 'Department', presentation: 'modal' }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
  );
}
