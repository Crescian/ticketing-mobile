import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useSession();

  const rows: [string, string | null | undefined][] = [
    ['Email', user?.email],
    ['Position', user?.position],
    ['Department', user?.department?.name],
    ['Company', user?.company?.name],
    ['Business unit', user?.business_unit?.name],
  ];

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>{user?.name}</Text>
          <Card>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={{ color: theme.textSecondary }}>{label}</Text>
                <Text style={[styles.value, { color: theme.text }]}>{value || '—'}</Text>
              </View>
            ))}
          </Card>
          <Button title="Sign out" variant="secondary" onPress={signOut} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three, paddingVertical: Spacing.one },
  value: { flexShrink: 1, textAlign: 'right', fontWeight: '500' },
});
