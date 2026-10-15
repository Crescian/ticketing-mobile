import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { useSession } from '@/auth/session';
import { PasswordForm } from '@/components/account-forms';
import { Spacing } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { setUser } = useSession();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: Spacing.four }} keyboardShouldPersistTaps="handled">
        <PasswordForm
          onDone={(user) => {
            setUser(user);
            router.back();
            Alert.alert('Password changed', 'Use your new password next time you sign in.');
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
