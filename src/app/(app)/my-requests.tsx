import { MyRequestsScreen } from '@/components/my-requests';

// Staff's own requests (opened from Profile; employees have it as their home tab).
export default function MyRequestsRoute() {
  return <MyRequestsScreen embedded />;
}
