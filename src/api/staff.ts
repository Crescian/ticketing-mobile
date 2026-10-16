import { api } from '@/api/client';
import type {
  CalendarResponse,
  Concern,
  InboxItem,
  Lookups,
  QueueResponse,
  StaffTicketDetail,
} from '@/api/staff-types';
import type { UploadFile } from '@/api/types';

type Data<T> = { data: T };

// ── Staff tickets ──────────────────────────────────────────────────────────
export const getQueue = (params: { status?: string; search?: string; sort?: string; page?: number }) =>
  api<QueueResponse>('/mobile/staff/queue', { query: params });

export const getLookups = () => api<Lookups>('/mobile/staff/lookups');

export const getStaffTicket = (id: string) =>
  api<Data<StaffTicketDetail>>(`/mobile/staff/tickets/${id}`).then((r) => r.data);

export type ActionValues = Record<string, string | boolean | number | null | undefined>;

// Runs a staff action. Multipart when files are attached; booleans go as 1/0
// (Laravel's boolean rule). Resolves with the server message and fresh ticket.
export function runStaffAction(ticketId: string, action: string, values: ActionValues, files: UploadFile[] = []) {
  const entries = Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const path = `/mobile/staff/tickets/${ticketId}/actions/${action}`;

  if (files.length) {
    const form = new FormData();
    entries.forEach(([k, v]) => form.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v)));
    files.forEach((f) => form.append('attachments[]', f as unknown as Blob));
    return api<{ message: string; ticket: StaffTicketDetail }>(path, { method: 'POST', body: form });
  }

  const body = Object.fromEntries(entries.map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 1 : 0) : v]));
  return api<{ message: string; ticket: StaffTicketDetail }>(path, { method: 'POST', body });
}

// ── Calendar & insights ────────────────────────────────────────────────────
export const getCalendar = (params: { view: 'day' | 'week' | 'month'; date?: string; technician_id?: string }) =>
  api<CalendarResponse>('/mobile/staff/calendar', { query: params });

// The web executive dashboard's JSON (ExecutiveDashboardController::buildDashboardData).
// Several numbers arrive as strings (Postgres numeric) — convert with Number().
export type ExecutiveData = {
  totalTickets: number;
  resolved: number;
  escalations: number;
  avgResolutionTime: number | string | null;
  slaPercent: number;
  avgRating: number | string | null;
  slaBreach: number;
  ticketChange: number | null;
  resolvedChange: number | null;
  avgTimeChange: number | null;
  escChange: number | null;
  resolutionRate: number | null;
  rangeLabel: string;
  curPeriodLabel: string;
  volumeDays: string[];
  volumeOpened: number[];
  volumeResolved: number[];
  slaByPriority: Record<string, number | null>;
  byCategory: { request_category: string | null; total: number }[];
  leaderboard: { id: string; name: string; position: string | null; resolved_count: number; avg_hours: number | string | null; avg_rating: number | string | null }[];
  openEscalations: { ticket_number: string; subject: string; status_label: string; escalation_level: number; escalated_by_name: string | null; needs_action: boolean; sla_breached: boolean }[];
  itTeamStatus: { id: string; name: string; role: string | null; online: boolean; availability: string | null; active_tickets: number }[];
  csatBreakdown: Record<string, { count: number; percent: number }>;
  totalFeedback: number;
};

export const getExecutiveData = (range: '7D' | '30D' | '90D' | 'YTD') =>
  api<ExecutiveData>('/mobile/staff/executive/data', { query: { range } });

// ── Inbox ──────────────────────────────────────────────────────────────────
export const getInbox = (since?: string) =>
  api<{ notifications: InboxItem[]; unread: number; server_time: string }>('/mobile/inbox', { query: { since } });

export const markInboxRead = (ids?: string[]) => api<void>('/mobile/inbox/read', { method: 'POST', body: ids ? { ids } : {} });

// ── Report to Developer ────────────────────────────────────────────────────
export type ConcernCategories = { group: string; items: { name: string; hint: string }[] }[];

export const getMyConcerns = () =>
  api<{ data: Concern[]; categories: ConcernCategories; urgencies: string[] }>('/mobile/staff/developer-concerns');

export const createConcern = (input: { subject: string; details: string; category: string; urgency: string }) =>
  api<{ message: string; concern: Concern }>('/mobile/staff/developer-concerns', { method: 'POST', body: input });

export const getDeveloperQueue = (tab: 'open' | 'acknowledged' | 'closed') =>
  api<{ tab: string; counts: Record<string, number>; data: Concern[] }>('/mobile/developer/concerns', { query: { tab } });

export const acknowledgeConcern = (id: string) =>
  api<{ message: string; concern: Concern }>(`/mobile/developer/concerns/${id}/acknowledge`, { method: 'PATCH' });

export const closeConcern = (id: string, closing_note: string) =>
  api<{ message: string; concern: Concern }>(`/mobile/developer/concerns/${id}/close`, { method: 'PATCH', body: { closing_note } });
