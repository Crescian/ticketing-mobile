// Response shapes of the employee mobile API — mirrors
// TicketingSystemVersion2/docs/api/employee-mobile-api.md.

export type Named = { id: string; name: string };

export type User = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  role: string | null;
  department: Named | null;
  company: Named | null;
  business_unit: Named | null;
  signs_in_with_microsoft: boolean;
  needs_account_setup: boolean;
  must_change_password: boolean;
  can_update_org_info: boolean;
  onboarded: boolean;
};

export type LoginResponse = {
  message: string;
  access_token: string;
  token_type: 'Bearer';
};

export type TicketPhase =
  | 'all'
  | 'submitted'
  | 'scheduled'
  | 'in_progress'
  | 'awaiting_requestor'
  | 'closed'
  | 'cancelled';

export type TicketCounts = Record<TicketPhase, number>;

export type Attachment = {
  id: string;
  name: string;
  mime_type: string | null;
  size: number | null;
  size_label: string;
  url: string;
};

export type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  step: 1 | 2 | 3 | 4 | 5 | null;
  step_label: string | null;
  is_on_hold: boolean;
  priority: string | null;
  category: string | null;
  subcategory: string | null;
  assigned_to: string | null;
  expected_start: string | null;
  unread_messages?: number;
  can_edit: boolean;
  can_cancel: boolean;
  can_confirm: boolean;
  can_rate: boolean;
  has_service_report: boolean;
  created_at: string;
  updated_at: string;
};

export type TicketDetail = Ticket & {
  concern: string;
  request_details: string | null;
  asset: string | null;
  location: string | null;
  hold_reason: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  service_report_url: string | null;
  attachments: Attachment[];
  history: { status: string; notes: string | null; by: string | null; at: string | null }[];
  feedback: { rating: number; comments: string | null } | null;
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number; per_page: number };
};

export type Message = {
  id: string;
  message: string;
  sender: { id: string; name: string; role: string | null; initials: string };
  is_me: boolean;
  is_read: boolean;
  attachments: Attachment[];
  created_at: string;
};

export type UnreadCounts = { total: number; by_ticket: Record<string, number> };

export type AppNotification = {
  type: 'status_change' | 'new_message';
  ticket_id: string;
  ticket_number: string | null;
  title: string;
  body: string | null;
  is_read?: boolean;
  at: string;
};

export type OrgTree = (Named & { companies: (Named & { departments: Named[] })[] })[];

export type ITTeamMember = { id: string; name: string; role: string | null; online: boolean };

// A file picked from the camera, gallery or file system, ready for multipart upload.
export type UploadFile = { uri: string; name: string; type: string };
