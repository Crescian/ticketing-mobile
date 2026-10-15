import * as Application from 'expo-application';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useSession();
  if (!user) return null;

  const rows: [string, string | null | undefined][] = [
    ['Email', user.email],
    ['Position', user.position],
    ['Department', user.department?.name],
    ['Company', user.company?.name],
    ['Business unit', user.business_unit?.name],
  ];

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will stop receiving notifications on this phone until you sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={{ color: theme.onPrimary, fontSize: 24, fontWeight: '700' }}>
                {user.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{user.name}</Text>
              <Text style={{ color: theme.textSecondary }}>{user.signs_in_with_microsoft ? 'Signed in with Microsoft' : 'Employee'}</Text>
            </View>
          </View>

          <Card>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={{ color: theme.textSecondary }}>{label}</Text>
                <Text style={[styles.value, { color: theme.text }]}>{value || '—'}</Text>
              </View>
            ))}
          </Card>

          <Card style={{ padding: 0, gap: 0 }}>
            {user.can_update_org_info ? (
              <MenuRow label="Update department / position" hint="You can do this once" onPress={() => router.push('/profile/department')} />
            ) : null}
            {/* Microsoft accounts have no password here — it's managed by Microsoft. */}
            {!user.signs_in_with_microsoft ? <MenuRow label="Change password" onPress={() => router.push('/profile/password')} /> : null}
            <MenuRow label="Show welcome tour again" onPress={() => router.push('/welcome')} last />
          </Card>

          <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
          <Text style={[styles.version, { color: theme.textSecondary }]}>
            ICT Support {Application.nativeApplicationVersion ?? ''} ({Application.nativeBuildVersion ?? 'dev'})
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function MenuRow({ label, hint, onPress, last }: { label: string; hint?: string; onPress: () => void; last?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: pressed ? theme.backgroundSelected : 'transparent', borderBottomColor: theme.border, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 16 }}>{label}</Text>
        {hint ? <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{hint}</Text> : null}
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three, paddingVertical: Spacing.one },
  value: { flexShrink: 1, textAlign: 'right', fontWeight: '500' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 14, gap: Spacing.two },
  version: { textAlign: 'center', fontSize: 12 },
});
