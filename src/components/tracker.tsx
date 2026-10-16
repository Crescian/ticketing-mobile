import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { Ticket } from '@/api/types';
import { Txt } from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = ['Submitted', 'Scheduled', 'In Progress', 'Confirm', 'Closed'];

// The same 5-phase tracker as the web employee dashboard (server-computed
// `step`): connected step dots, the current one highlighted (amber while on
// hold). Cancelled tickets have no step and show a notice instead.
export function Tracker({ ticket, compact }: { ticket: Pick<Ticket, 'step' | 'is_on_hold'>; compact?: boolean }) {
  const theme = useTheme();

  if (ticket.step === null) {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle-outline" size={16} color={theme.textSecondary} />
        <Txt variant="caption" color="textSecondary">This request was cancelled.</Txt>
      </View>
    );
  }

  const step = ticket.step;
  const size = compact ? 14 : 22;

  return (
    <View style={{ gap: Spacing.one }}>
      <View style={styles.row}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step || (n === step && n === STEPS.length);
          const current = n === step && !done;
          const color = current && ticket.is_on_hold ? theme.warning : n <= step ? theme.primary : theme.border;
          return (
            <View key={label} style={[styles.stepCell, i === 0 && { flex: 0 }]}>
              {i > 0 ? <View style={[styles.connector, { backgroundColor: n <= step ? theme.primary : theme.border }]} /> : null}
              <View
                style={[
                  styles.dot,
                  { width: size, height: size, borderRadius: size / 2, borderColor: color },
                  (done || current) && { backgroundColor: color },
                ]}>
                {!compact && done ? <Ionicons name="checkmark" size={14} color={theme.onPrimary} /> : null}
                {!compact && current ? <View style={[styles.innerDot, { backgroundColor: theme.onPrimary }]} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      {!compact ? (
        <View style={styles.labels}>
          {STEPS.map((label, i) => (
            <Txt
              key={label}
              variant="caption"
              color={i + 1 === step ? 'text' : 'textSecondary'}
              numberOfLines={1}
              style={[
                styles.label,
                i === 0 && { textAlign: 'left' },
                i === STEPS.length - 1 && { textAlign: 'right' },
                i + 1 === step && { fontFamily: Fonts.extrabold },
              ]}>
              {label}
            </Txt>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stepCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  connector: { flex: 1, height: 3, borderRadius: 2, marginHorizontal: 2 },
  dot: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  innerDot: { width: 7, height: 7, borderRadius: 4 },
  // Dots sit at 0/25/50/75/100%; fixed-width labels spread the same way.
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { width: 62, textAlign: 'center', fontSize: 11 },
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
