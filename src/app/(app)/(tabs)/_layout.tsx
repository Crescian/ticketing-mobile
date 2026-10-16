import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useNewUpdatesCount, useUnread } from '@/api/queries';
import { useInbox } from '@/api/staff-queries';
import { useSession } from '@/auth/session';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hasCalendar, hasInsights, isDeveloper, isEmployee, isTicketStaff } from '@/lib/roles';

const badge = (n: number) => (n > 99 ? '99+' : String(n));

// Tabs depend on the role (fixed for the session, so hiding tabs never
// remounts a live navigator). Android allows at most 5:
//   Employee   — My Requests · Updates · Profile
//   Staff      — Queue · [Calendar] · [Insights] · Inbox · Profile
//   Developer  — Concerns · Inbox · Profile
export default function AppTabs() {
  const theme = useTheme();
  const { user } = useSession();
  const role = user?.role;
  const employee = isEmployee(role);

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      iconColor={{ default: theme.textMuted, selected: theme.primary }}
      labelStyle={{
        default: { fontFamily: Fonts.semibold, color: theme.textMuted },
        selected: { fontFamily: Fonts.bold, color: theme.primary },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{isTicketStaff(role) ? 'Queue' : isDeveloper(role) ? 'Concerns' : 'My Requests'}</NativeTabs.Trigger.Label>
        {employee ? <EmployeeRequestsBadge /> : null}
        <NativeTabs.Trigger.Icon
          src={
            isTicketStaff(role)
              ? require('@/assets/images/tabIcons/queue.png')
              : isDeveloper(role)
                ? require('@/assets/images/tabIcons/code.png')
                : require('@/assets/images/tabIcons/home.png')
          }
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar" hidden={!hasCalendar(role)}>
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/calendar.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="insights" hidden={!hasInsights(role)}>
        <NativeTabs.Trigger.Label>{role === 'Manager' ? 'Dashboard' : 'Insights'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/chart.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="updates">
        <NativeTabs.Trigger.Label>{employee ? 'Updates' : 'Inbox'}</NativeTabs.Trigger.Label>
        {employee ? <EmployeeUpdatesBadge /> : <InboxBadge />}
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/bell.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/person.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Badges live in small components so each role only polls what it uses.
function EmployeeRequestsBadge() {
  const unread = useUnread().data?.total ?? 0;
  return unread > 0 ? <NativeTabs.Trigger.Badge>{badge(unread)}</NativeTabs.Trigger.Badge> : null;
}

function EmployeeUpdatesBadge() {
  const count = useNewUpdatesCount();
  return count > 0 ? <NativeTabs.Trigger.Badge>{badge(count)}</NativeTabs.Trigger.Badge> : null;
}

function InboxBadge() {
  const unread = useInbox().data?.unread ?? 0;
  return unread > 0 ? <NativeTabs.Trigger.Badge>{badge(unread)}</NativeTabs.Trigger.Badge> : null;
}
