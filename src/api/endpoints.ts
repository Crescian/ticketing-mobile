import { api, toFormData } from '@/api/client';
import type {
  AppNotification,
  ITTeamMember,
  LoginResponse,
  Message,
  OrgTree,
  Paginated,
  Ticket,
  TicketCounts,
  TicketDetail,
  TicketPhase,
  UnreadCounts,
  UploadFile,
  User,
} from '@/api/types';
import { API_CLIENT_NAME } from '@/config';

type Data<T> = { data: T };

// ── Auth & profile ─────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api<LoginResponse>('/login', { method: 'POST', body: { email, password, client: API_CLIENT_NAME } });

export const loginWithMicrosoft = (accessToken: string) =>
  api<LoginResponse>('/auth/microsoft', { method: 'POST', body: { access_token: accessToken, client: API_CLIENT_NAME } });

export const logout = (expoPushToken?: string | null) =>
  api<{ message: string }>('/logout', { method: 'POST', body: expoPushToken ? { expo_push_token: expoPushToken } : {} });

export const getMe = () => api<Data<User>>('/mobile/me').then((r) => r.data);

export const updatePassword = (current_password: string, password: string, password_confirmation: string) =>
  api<Data<User>>('/mobile/profile/password', { method: 'PUT', body: { current_password, password, password_confirmation } }).then((r) => r.data);

export const updateOrgInfo = (department_id: string, position: string | null) =>
  api<Data<User>>('/mobile/profile/org-info', { method: 'PUT', body: { department_id, position } }).then((r) => r.data);

export const getOrgTree = () => api<OrgTree>('/mobile/org/hierarchy');

export const completeOnboarding = () => api<void>('/mobile/onboarding/complete', { method: 'POST' });

export const getITTeam = () => api<ITTeamMember[]>('/mobile/it-team');

// ── Tickets ────────────────────────────────────────────────────────────────
export type TicketFilters = {
  status?: TicketPhase;
  search?: string;
  sort?: 'newest' | 'oldest' | 'priority';
  page?: number;
};

export const getTickets = (filters: TicketFilters = {}) =>
  api<Paginated<Ticket>>('/mobile/tickets', { query: filters });

export const getTicketCounts = () => api<TicketCounts>('/mobile/tickets/counts');

export const getTicket = (id: string) => api<Data<TicketDetail>>(`/mobile/tickets/${id}`).then((r) => r.data);

export type TicketInput = {
  subject: string;
  concern: string;
  request_details?: string | null;
  asset?: string | null;
  location?: string | null;
};

export const createTicket = (input: TicketInput, files: UploadFile[] = []) =>
  api<Data<TicketDetail>>('/mobile/tickets', { method: 'POST', body: toFormData(input, files) }).then((r) => r.data);

export const updateTicket = (id: string, input: TicketInput, files: UploadFile[] = []) =>
  api<Data<TicketDetail>>(`/mobile/tickets/${id}`, { method: 'POST', body: toFormData(input, files) }).then((r) => r.data);

export const cancelTicket = (id: string) =>
  api<Data<TicketDetail>>(`/mobile/tickets/${id}/cancel`, { method: 'PATCH' }).then((r) => r.data);

export const confirmTicket = (id: string) =>
  api<Data<TicketDetail>>(`/mobile/tickets/${id}/confirm`, { method: 'PATCH' }).then((r) => r.data);

export const rateTicket = (id: string, rating: number, comments?: string) =>
  api<Data<TicketDetail>>(`/mobile/tickets/${id}/feedback`, { method: 'POST', body: { rating, comments } }).then((r) => r.data);

// ── Chat ───────────────────────────────────────────────────────────────────
export const getMessages = (ticketId: string) =>
  api<Data<Message[]>>(`/mobile/tickets/${ticketId}/messages`).then((r) => r.data);

export const sendMessage = (ticketId: string, message: string, files: UploadFile[] = []) =>
  api<Data<Message>>(`/mobile/tickets/${ticketId}/messages`, { method: 'POST', body: toFormData({ message }, files) }).then((r) => r.data);

export const getUnread = () => api<UnreadCounts>('/mobile/messages/unread');

// ── Notifications ──────────────────────────────────────────────────────────
export const getNotifications = (since?: string) =>
  api<{ notifications: AppNotification[]; server_time: string }>('/mobile/notifications', { query: { since } });

export const registerDevice = (expo_push_token: string, platform: 'android' | 'ios') =>
  api<{ message: string }>('/mobile/devices', { method: 'POST', body: { expo_push_token, platform } });
