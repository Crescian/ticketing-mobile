import { API_URL } from '@/config';
import type { UploadFile } from '@/api/types';

// Error from the API. `message` is always user-presentable (the server sends
// one on every error); `errors` holds per-field validation messages on 422,
// `code` is set for special cases like 'account_setup_required'.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
    public code?: string,
  ) {
    super(message);
  }

  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(value: string | null) {
  token = value;
}

export function getApiToken() {
  return token;
}

// Called once by the session provider: any 401 means the token was revoked
// or logged out elsewhere, so the app drops back to the login screen.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Body = Record<string, unknown> | FormData;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Body;
  query?: Record<string, string | number | undefined | null>;
};

export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const url = new URL(API_URL + path);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const isForm = body instanceof FormData;
  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No connection. Check your internet and try again.');
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();

    throw new ApiError(
      response.status,
      data.message ?? `Request failed (${response.status}).`,
      data.errors ?? {},
      data.code,
    );
  }

  return data as T;
}

// Builds multipart form data — React Native's FormData accepts { uri, name, type }
// file objects. Array values become `key[]` entries (attachments[]).
export function toFormData(fields: Record<string, string | null | undefined>, files: UploadFile[] = [], fileKey = 'attachments') {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  files.forEach((file) => form.append(`${fileKey}[]`, file as unknown as Blob));
  return form;
}
