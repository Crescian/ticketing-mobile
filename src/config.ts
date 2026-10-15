// Base URL of the ticketing system's JSON API. Override per environment with
// EXPO_PUBLIC_API_URL (e.g. in .env.local) — defaults to production.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://ictsupportrequest.leoniogroup.com/api';

// Sanctum token name — logging in again from the app replaces only this
// token, never the user's sessions in other systems.
export const API_CLIENT_NAME = 'mobile';
