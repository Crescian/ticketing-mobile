import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';

import { ApiError } from '@/api/client';
import { SessionProvider, useSession } from '@/auth/session';
import { Colors, Fonts } from '@/constants/theme';
import { OfflineBanner } from '@/components/offline-banner';

SplashScreen.preventAutoHideAsync();

// Tell TanStack Query when the app is in the foreground, so polling (chat,
// unread badge) pauses in the background and data refreshes on return.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (Platform.OS !== 'web') handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

// Pause requests while offline and refetch when the connection returns.
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  });
  return () => subscription.remove();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry what retrying can't fix (auth, permission, not found, validation).
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
});

// Navigation chrome (screen background, headers, borders) in the app palette.
function navigationTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundElement,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
    fonts: {
      ...base.fonts,
      regular: { fontFamily: Fonts.regular, fontWeight: '400' as const },
      medium: { fontFamily: Fonts.semibold, fontWeight: '600' as const },
      bold: { fontFamily: Fonts.bold, fontWeight: '700' as const },
      heavy: { fontFamily: Fonts.extrabold, fontWeight: '800' as const },
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={navigationTheme(colorScheme === 'dark' ? 'dark' : 'light')}>
          <RootNavigator />
          <OfflineBanner />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

// Which part of the app is reachable depends on the session: login when
// signed out, the account-setup flow until it's finished, then the app.
function RootNavigator() {
  const { status } = useSession();
  // Nunito, the web's font — held behind the splash screen until loaded (a
  // load error falls back to the system font rather than blocking the app).
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = status !== 'loading' && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'setup'}>
        <Stack.Screen name="setup" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
