// Staff-side response shapes (TicketingSystemVersion2: Api/Mobile/Staff/*,
// App\Support\Mobile\StaffActions / Field).

import type { Attachment } from '@/api/types';

export type Role =
  | 'Employee'
  | 'Helpdesk'
  | 'IT Support Specialist'
  | 'IT Admin'
  | 'Supervisor - Support Specialist'
  | 'Supervisor - IT Admin'
  | 'Manager'
  | 'Developer';

export type QueueTab = { key: string; label: string; count: number };

export type StaffTicket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  pending_role: string | null;
  priority: string | null;
  category: string | null;
  subcategory: string | null;
  escalation_level: number;
  requester: { id: string | null; name: string | null; department: string | null };
  assignee: { id: string; name: string; role?: string; availability?: 'free' | 'busy' | 'full'; free_time_label?: string } | null;
  acknowledged_by_assignee: boolean;
  is_on_hold: boolean;
  sla: { due_at: string; seconds_remaining: number | null; breached: boolean; at_risk: boolean } | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  is_overtime: boolean;
  unread_messages?: number;
  created_at: string;
  updated_at: string;
};

export type FieldOption = { value: string; label: string };

export type ActionField = {
  name: string;
  label: string;
  type: 'textarea' | 'select' | 'radio' | 'lookup' | 'number' | 'boolean' | 'files';
  required: boolean;
  options?: FieldOption[];
  source?: 'sla_rules' | 'self_triage_rules' | 'assignees' | 'workload_classes';
  default?: string;
  hint?: string;
  max?: number;
};

export type StaffAction = {
  key: string;
  label: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'danger';
  confirm: string | null;
  fields: ActionField[];
  multipart: boolean;
};

export type StaffTicketDetail = StaffTicket & {
  concern: string | null;
  request_details: string | null;
  request_category: string | null;
  asset: string | null;
  location: string | null;
  method: string | null;
  received: string | null;
  requester_position: string | null;
  requester_company: string | null;
  classification: { workload_class: string | null; response_minutes: number | null; resolution_minutes: number | null };
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  time_spent: string | null;
  hold_reason: string | null;
  revision: { requested_at: string; notes: string | null } | null;
  report: {
    service_type: string | null;
    resolution_notes: string | null;
    findings: string | null;
    recommendation: string | null;
    resolved_by: string | null;
    validated_at: string | null;
    validation_notes: string | null;
  } | null;
  cannot_resolve: { findings: string | null; recommendation: string | null } | null;
  escalations: { level: number | null; reason: string | null; already_tried: string | null; by: string | null; at: string | null }[];
  pending_reclassification: { requested_by: string | null; reason: string | null; current: string; proposed: string; requested_at: string | null } | null;
  service_report_url: string | null;
  attachments: Attachment[];
  history: { status: string; from: string | null; notes: string | null; by: string | null; at: string | null }[];
  actions: StaffAction[];
};

export type QueueResponse = {
  tab: string;
  tabs: QueueTab[];
  data: StaffTicket[];
  meta: { current_page: number; last_page: number; total: number };
  self_triage: StaffTicket[];
};

export type LookupItem = { id: string; name: string; hint?: string; availability?: 'free' | 'busy' | 'full' | null };
export type RuleCategory = { id: string; name: string; rules: (LookupItem & { priority: string | null })[] };

export type Lookups = {
  sla_rules: RuleCategory[];
  self_triage_rules: RuleCategory[];
  workload_classes: LookupItem[];
  assignees: LookupItem[];
};

export type ScheduleConflict = {
  ticket_number: string | null;
  technician_name: string | null;
  proposed_end: string | null;
  day_end: string | null;
  overtime_minutes: number | null;
};

export type InboxItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  ticket_id: string | null;
  concern_id: string | null;
  is_read: boolean;
  at: string;
};

export type CalendarBlock = {
  left_pct: number;
  width_pct: number;
  is_overtime: boolean;
  ticket: { id: string; ticket_number: string; subject: string; status: string; priority: string | null; scheduled_start: string | null; scheduled_end: string | null };
};

export type CalendarResponse = {
  view: 'day' | 'week' | 'month';
  date: string;
  nav: { prev: string; next: string; today: string };
  is_own: boolean;
  people_label: string;
  people: { id: string; name: string }[];
  rows: {
    technician: { id: string; name: string };
    on_leave?: boolean;
    axis_start?: string;
    axis_end?: string;
    lunch?: { left_pct: number; width_pct: number };
    stats?: { working_minutes: number; allocated_minutes: number; remaining_minutes: number; ticket_count: number; overtime_minutes: number; workload_pct: number };
    blocks?: CalendarBlock[];
    cells?: { date: string | null; on_leave: boolean; allocated_minutes: number; ticket_count: number; has_overtime: boolean; workload_pct: number; level: 'leave' | 'red' | 'yellow' | 'green' | null }[];
  }[];
  columns?: string[];
};

export type Concern = {
  id: string;
  reference: string;
  subject: string;
  details: string;
  category: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Acknowledged' | 'Closed';
  submitter: { name: string; role: string | null } | null;
  closing_note: string | null;
  acknowledged_at: string | null;
  closed_at: string | null;
  created_at: string;
};
