import { useSession } from '@/auth/session';
import { StaffInbox } from '@/components/staff/staff-inbox';
import { UpdatesFeed } from '@/components/updates-feed';
import { isDeveloper, isEmployee } from '@/lib/roles';

// Employees: activity on their requests. Staff: their notification inbox.
export default function UpdatesTab() {
  const { user } = useSession();

  return isEmployee(user?.role) ? <UpdatesFeed /> : <StaffInbox isDeveloper={isDeveloper(user?.role)} />;
}
