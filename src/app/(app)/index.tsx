import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTicketCounts } from '@/api/endpoints';
import type { TicketPhase } from '@/api/types';
import { useSession } from '@/auth/session';
import { Card, ErrorText, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PHASES: { key: TicketPhase; label: string }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'awaiting_requestor', label: 'Awaiting You' },
  { key: 'closed', label: 'Closed' },
];

// My Requests — Phase 1 shows the live tab counts to prove the API wiring;
// the full list, filters and ticket cards come in Phase 3.
export default function MyRequestsScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const counts = useQuery({ queryKey: ['ticket-counts'], queryFn: getTicketCounts });

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={counts.isRefetching} onRefresh={counts.refetch} />}>
          <Text style={[styles.title, { color: theme.text }]}>Hi, {user?.name?.split(' ')[0]}</Text>
          <Text style={{ color: theme.textSecondary }}>
            {counts.data ? `You have ${counts.data.all} request${counts.data.all === 1 ? '' : 's'}.` : 'Loading your requests…'}
          </Text>
          <ErrorText message={counts.error?.message} />

          <View style={styles.grid}>
            {PHASES.map(({ key, label }) => (
              <Card key={key} style={styles.tile}>
                <Text style={[styles.count, { color: theme.primary }]}>{counts.data?.[key] ?? '–'}</Text>
                <Text style={{ color: theme.textSecondary }}>{label}</Text>
              </Card>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: { width: '47%' },
  count: { fontSize: 28, fontWeight: '700' },
});
