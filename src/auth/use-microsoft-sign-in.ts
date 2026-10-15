import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

import { AZURE_CLIENT_ID, AZURE_TENANT_ID, MICROSOFT_SIGN_IN_ENABLED } from '@/config';

WebBrowser.maybeCompleteAuthSession();

// Graph's User.Read is what the server needs: it validates the resulting
// access token by calling Microsoft Graph /me with it.
const SCOPES = ['openid', 'profile', 'email', 'User.Read'];

export const microsoftRedirectUri = AuthSession.makeRedirectUri({ scheme: 'ictsupport', path: 'auth' });

// Runs the Microsoft login in the system browser (authorization code + PKCE)
// and resolves with a Microsoft Graph access token, which the app then
// exchanges for its own API token at POST /api/auth/microsoft.
export function useMicrosoftSignIn() {
  const discovery = AuthSession.useAutoDiscovery(`https://login.microsoftonline.com/${AZURE_TENANT_ID || 'common'}/v2.0`);
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    { clientId: AZURE_CLIENT_ID, scopes: SCOPES, redirectUri: microsoftRedirectUri },
    discovery,
  );
  const [busy, setBusy] = useState(false);

  // Resolves null when the user closes the browser without signing in.
  const getAccessToken = async (): Promise<string | null> => {
    if (!request || !discovery) return null;
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return null;

      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: AZURE_CLIENT_ID,
          code: result.params.code,
          redirectUri: microsoftRedirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        discovery,
      );
      return tokens.accessToken;
    } finally {
      setBusy(false);
    }
  };

  return {
    enabled: MICROSOFT_SIGN_IN_ENABLED,
    ready: MICROSOFT_SIGN_IN_ENABLED && !!request && !!discovery,
    busy,
    getAccessToken,
  };
}
