import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Account setup (department + password) — built in Phase 2. Until then this
// tells the user what's pending and lets them sign out.
export default function SetupScreen() {
  const theme = useTheme();
  const { user, signOut } = useSession();

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: theme.text }]}>Finish setting up your account</Text>
          <Text style={{ color: theme.textSecondary }}>
            Hi {user?.name}. Please set your department and a new password on the ICT Support website first.
          </Text>
        </Card>
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 20, fontWeight: '700' },
});
