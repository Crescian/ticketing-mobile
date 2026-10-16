import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Ticket } from '@/api/types';
import { Tracker } from '@/components/tracker';
import { Badge, CountBubble, Txt } from '@/components/ui';
import { Radius, Spacing, type Tone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';

// The employee-facing status label: tracker step, or On Hold / Cancelled.
export function StatusLabel({ ticket }: { ticket: Pick<Ticket, 'step_label' | 'is_on_hold' | 'step'> }) {
  const label = ticket.step === null ? 'Cancelled' : ticket.is_on_hold ? 'On Hold' : ticket.step_label ?? '—';
  const tone: Tone = ticket.step === null ? 'neutral' : ticket.is_on_hold ? 'warning' : ticket.step === 4 ? 'danger' : ticket.step === 5 ? 'success' : 'primary';
  return <Badge label={label} tone={tone} />;
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const theme = useTheme();
  const needsYou = ticket.can_confirm || ticket.can_rate;
  const footer = ticket.can_confirm
    ? { icon: 'alert-circle' as const, text: 'Please confirm the fix', color: theme.danger }
    : ticket.can_rate
      ? { icon: 'star-outline' as const, text: 'Rate this request', color: theme.primary }
      : ticket.expected_start
        ? { icon: 'time-outline' as const, text: ticket.expected_start, color: theme.textSecondary }
        : ticket.assigned_to
          ? { icon: 'person-outline' as const, text: `With ${ticket.assigned_to}`, color: theme.textSecondary }
          : { icon: 'time-outline' as const, text: `Updated ${timeAgo(ticket.updated_at)}`, color: theme.textSecondary };

  return (
    <Link href={{ pathname: '/ticket/[id]', params: { id: ticket.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Request ${ticket.ticket_number}: ${ticket.subject}`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: needsYou ? theme.primary : theme.border },
          needsYou && styles.cardHighlight,
          pressed && { opacity: 0.9 },
        ]}>
        <View style={styles.top}>
          <Txt variant="label" color="textSecondary">#{ticket.ticket_number}</Txt>
          <StatusLabel ticket={ticket} />
        </View>
        <Txt variant="heading" numberOfLines={2}>{ticket.subject}</Txt>
        <Tracker ticket={ticket} compact />
        <View style={styles.bottom}>
          <View style={styles.footerText}>
            <Ionicons name={footer.icon} size={15} color={footer.color} />
            <Txt variant="caption" numberOfLines={1} style={{ color: footer.color, fontSize: 13, flexShrink: 1 }}>{footer.text}</Txt>
          </View>
          {ticket.unread_messages ? (
            <View style={styles.unread}>
              <Ionicons name="chatbubble-ellipses" size={15} color={theme.danger} />
              <CountBubble count={ticket.unread_messages} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.four, gap: Spacing.three },
  cardHighlight: { borderWidth: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  footerText: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexShrink: 1 },
  unread: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
