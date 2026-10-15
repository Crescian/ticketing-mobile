import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, setApiToken, setUnauthorizedHandler } from '@/api/client';
import * as endpoints from '@/api/endpoints';
import type { User } from '@/api/types';
import { takeStoredPushToken } from '@/notifications/push';

const TOKEN_KEY = 'auth_token';

// 'loading'  — reading the stored token / fetching the user on launch
// 'signedOut' — show the login screen
// 'setup'    — signed in, but must finish account setup (org info + password)
// 'signedIn' — full app
export type SessionStatus = 'loading' | 'signedOut' | 'setup' | 'signedIn';

type Session = {
  status: SessionStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    setStatus(next.needs_account_setup ? 'setup' : 'signedIn');
  }, []);

  // Local sign-out only — clears the token and every cached screen.
  const clearSession = useCallback(async () => {
    setApiToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    queryClient.clear();
    setUserState(null);
    setStatus('signedOut');
  }, [queryClient]);

  const startSession = useCallback(
    async (token: string) => {
      setApiToken(token);
      try {
        setUser(await endpoints.getMe());
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } catch (error) {
        // A network failure keeps the stored token so the next launch can
        // resume; anything else (revoked token, deactivated account) drops it.
        if (!(error instanceof ApiError && error.status === 0)) await clearSession();
        else setApiToken(null);
        throw error;
      }
    },
    [clearSession, setUser],
  );

  // On launch: resume the stored session if the token is still valid.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());

    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) return setStatus('signedOut');

      try {
        await startSession(stored);
      } catch {
        setStatus('signedOut');
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, [clearSession, startSession]);

  const value = useMemo<Session>(
    () => ({
      status,
      user,
      setUser,
      signIn: async (email, password) => {
        const { access_token } = await endpoints.login(email, password);
        await startSession(access_token);
      },
      signInWithMicrosoft: async (accessToken) => {
        const { access_token } = await endpoints.loginWithMicrosoft(accessToken);
        await startSession(access_token);
      },
      signOut: async () => {
        // Best effort — the local sign-out happens even if the server is
        // unreachable. Sending the push token stops pushes to this phone.
        const pushToken = await takeStoredPushToken();
        await endpoints.logout(pushToken).catch(() => undefined);
        await clearSession();
      },
    }),
    [status, user, setUser, startSession, clearSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
