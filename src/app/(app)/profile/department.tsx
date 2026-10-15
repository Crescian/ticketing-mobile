import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { useSession } from '@/auth/session';
import { OrgInfoForm } from '@/components/account-forms';
import { Spacing } from '@/constants/theme';

// One lifetime self-update of department/position — after that, IT changes it.
export default function DepartmentScreen() {
  const { user, setUser } = useSession();
  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.four }} keyboardShouldPersistTaps="handled">
      <OrgInfoForm
        user={user}
        onDone={(updated) => {
          setUser(updated);
          router.back();
        }}
      />
    </ScrollView>
  );
}
