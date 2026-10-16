import type { Role } from '@/api/staff-types';

// What each role sees in the app — mirrors the backend's route role groups
// (routes/api.php) and the web's navigation.
export const TICKET_ROLES: Role[] = [
  'Helpdesk',
  'IT Support Specialist',
  'IT Admin',
  'Supervisor - Support Specialist',
  'Supervisor - IT Admin',
  'Manager',
];

const CALENDAR_ROLES: Role[] = ['IT Support Specialist', 'IT Admin', 'Supervisor - Support Specialist', 'Supervisor - IT Admin'];
const INSIGHTS_ROLES: Role[] = ['Manager', 'Helpdesk', 'Supervisor - Support Specialist', 'Supervisor - IT Admin'];
// Same list as DeveloperConcern::SENDER_ROLES.
const CONCERN_SENDER_ROLES: Role[] = TICKET_ROLES;

const has = (list: Role[], role: string | null | undefined) => !!role && list.includes(role as Role);

export const isEmployee = (role?: string | null) => !role || role === 'Employee';
export const isDeveloper = (role?: string | null) => role === 'Developer';
export const isTicketStaff = (role?: string | null) => has(TICKET_ROLES, role);
export const hasCalendar = (role?: string | null) => has(CALENDAR_ROLES, role);
export const hasInsights = (role?: string | null) => has(INSIGHTS_ROLES, role);
export const canReportToDeveloper = (role?: string | null) => has(CONCERN_SENDER_ROLES, role);
