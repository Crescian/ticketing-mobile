import * as Application from 'expo-application';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Card, InfoRow, ListRow, Screen, ScreenHeader, SectionTitle, Txt } from '@/components/ui';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { canReportToDeveloper, isDeveloper as isDeveloperRole, isEmployee } from '@/lib/roles';

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  if (!user) return null;

  const initials = user.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will stop receiving notifications on this phone until you sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader title="Profile" />

          <View style={styles.body}>
            <Card style={styles.identity}>
              <View style={[styles.avatar, { backgroundColor: Brand.dark }]}>
                <Txt style={styles.initials}>{initials}</Txt>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="title" numberOfLines={1}>{user.name}</Txt>
                <Txt color="textSecondary">{user.role ?? 'Employee'}</Txt>
                <Txt variant="caption" color="textSecondary">{user.signs_in_with_microsoft ? 'Signs in with Microsoft' : 'Signs in with password'}</Txt>
              </View>
            </Card>

            <SectionTitle>Account</SectionTitle>
            <Card>
              <InfoRow icon="mail-outline" label="Email" value={user.email} />
              <InfoRow icon="briefcase-outline" label="Position" value={user.position || '—'} />
              <InfoRow icon="people-outline" label="Department" value={user.department?.name || '—'} />
              <InfoRow icon="business-outline" label="Company" value={[user.company?.name, user.business_unit?.name].filter(Boolean).join(' · ') || '—'} />
            </Card>

            {!isEmployee(user.role) && !isDeveloperRole(user.role) ? (
              <>
                <SectionTitle>Work</SectionTitle>
                <Card padded={false}>
                  <ListRow icon="document-text-outline" label="My Requests" hint="IT requests you filed yourself" onPress={() => router.push('/my-requests')} />
                  {canReportToDeveloper(user.role) ? (
                    <ListRow icon="code-slash-outline" label="Report to Developer" hint="System issues, data changes, requests" onPress={() => router.push('/report-developer')} last />
                  ) : null}
                </Card>
              </>
            ) : isDeveloperRole(user.role) ? (
              <Card padded={false}>
                <ListRow icon="document-text-outline" label="My Requests" hint="IT requests you filed yourself" onPress={() => router.push('/my-requests')} last />
              </Card>
            ) : null}

            <SectionTitle>Settings</SectionTitle>
            <Card padded={false}>
              {user.can_update_org_info ? (
                <ListRow icon="create-outline" label="Update department / position" hint="You can do this once" onPress={() => router.push('/profile/department')} />
              ) : null}
              {/* Microsoft accounts have no password here — it's managed by Microsoft. */}
              {!user.signs_in_with_microsoft ? <ListRow icon="key-outline" label="Change password" onPress={() => router.push('/profile/password')} /> : null}
              {isEmployee(user.role) ? <ListRow icon="sparkles-outline" label="Show welcome tour again" onPress={() => router.push('/welcome')} /> : null}
              <ListRow icon="log-out-outline" label="Sign out" tone="danger" onPress={confirmSignOut} last />
            </Card>

            <Txt variant="caption" color="textMuted" center>
              LGICT Support {Application.nativeApplicationVersion ?? ''} ({Application.nativeBuildVersion ?? 'dev'})
            </Txt>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: Spacing.seven },
  body: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  initials: { color: Brand.accent, fontFamily: Fonts.black, fontSize: 22 },
});
