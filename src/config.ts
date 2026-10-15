// Base URL of the ticketing system's JSON API. Override per environment with
// EXPO_PUBLIC_API_URL (e.g. in .env.local) — defaults to production.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://ictsupportrequest.leoniogroup.com/api';

// Sanctum token name — logging in again from the app replaces only this
// token, never the user's sessions in other systems.
export const API_CLIENT_NAME = 'mobile';

// Microsoft sign-in (Azure AD). Set both in .env.local; the "Sign in with
// Microsoft" button only appears once they are. Neither is a secret — the
// mobile app registration is a public client (PKCE, no client secret).
export const AZURE_TENANT_ID = process.env.EXPO_PUBLIC_AZURE_TENANT_ID ?? '';
export const AZURE_CLIENT_ID = process.env.EXPO_PUBLIC_AZURE_CLIENT_ID ?? '';
export const MICROSOFT_SIGN_IN_ENABLED = Boolean(AZURE_TENANT_ID && AZURE_CLIENT_ID);
