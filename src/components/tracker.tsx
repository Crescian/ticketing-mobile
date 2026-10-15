import { StyleSheet, Text, View } from 'react-native';

import type { Ticket } from '@/api/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = ['Submitted', 'Scheduled', 'In Progress', 'Confirm', 'Closed'];

// The same 5-phase tracker as the web employee dashboard (server-computed
// `step`). Cancelled tickets have no step and show a notice instead.
export function Tracker({ ticket, compact }: { ticket: Pick<Ticket, 'step' | 'is_on_hold'>; compact?: boolean }) {
  const theme = useTheme();

  if (ticket.step === null) {
    return <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>This request was cancelled.</Text>;
  }

  return (
    <View style={{ gap: Spacing.one }}>
      <View style={styles.row}>
        {STEPS.map((label, i) => {
          const reached = i + 1 <= ticket.step!;
          const current = i + 1 === ticket.step;
          const color = current && ticket.is_on_hold ? theme.warning : reached ? theme.primary : theme.border;
          return <View key={label} style={[styles.segment, { backgroundColor: color }]} />;
        })}
      </View>
      {!compact ? (
        <View style={styles.row}>
          {STEPS.map((label, i) => (
            <Text
              key={label}
              style={[styles.label, { color: i + 1 === ticket.step ? theme.text : theme.textSecondary, fontWeight: i + 1 === ticket.step ? '700' : '400' }]}
              numberOfLines={1}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.one },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  label: { flex: 1, fontSize: 11, textAlign: 'center' },
});
