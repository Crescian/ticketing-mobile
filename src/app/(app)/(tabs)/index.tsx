import { useSession } from '@/auth/session';
import { MyRequestsScreen } from '@/components/my-requests';
import { DeveloperConcernsScreen } from '@/components/staff/developer-concerns';
import { StaffQueueScreen } from '@/components/staff/staff-queue';
import { isDeveloper, isTicketStaff } from '@/lib/roles';

// The first tab is each role's main work: requests for employees, the work
// queue for ticket staff, concerns for the Developer.
export default function HomeTab() {
  const { user } = useSession();

  if (isTicketStaff(user?.role)) return <StaffQueueScreen />;
  if (isDeveloper(user?.role)) return <DeveloperConcernsScreen />;
  return <MyRequestsScreen />;
}
