import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ticket } from '@/api/types';
import { Tracker } from '@/components/tracker';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';

export function StatusLabel({ ticket }: { ticket: Pick<Ticket, 'step_label' | 'is_on_hold' | 'step'> }) {
  const theme = useTheme();
  const label = ticket.step === null ? 'Cancelled' : ticket.is_on_hold ? 'On Hold' : ticket.step_label;
  const color = ticket.step === null ? theme.textSecondary : ticket.is_on_hold ? theme.warning : ticket.step === 4 ? theme.danger : theme.primary;
  return <Text style={[styles.status, { color, borderColor: color }]}>{label}</Text>;
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const theme = useTheme();
  const needsYou = ticket.can_confirm || ticket.can_rate;

  return (
    <Link href={{ pathname: '/ticket/[id]', params: { id: ticket.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: needsYou ? theme.primary : theme.border, opacity: pressed ? 0.85 : 1 },
        ]}>
        <View style={styles.top}>
          <Text style={[styles.number, { color: theme.textSecondary }]}>#{ticket.ticket_number}</Text>
          <StatusLabel ticket={ticket} />
        </View>
        <Text style={[styles.subject, { color: theme.text }]} numberOfLines={2}>
          {ticket.subject}
        </Text>
        <Tracker ticket={ticket} compact />
        <View style={styles.bottom}>
          <Text style={{ color: theme.textSecondary, flexShrink: 1 }} numberOfLines={1}>
            {ticket.can_confirm
              ? 'Please confirm the fix'
              : ticket.can_rate
                ? 'Rate this request'
                : ticket.expected_start ?? (ticket.assigned_to ? `With ${ticket.assigned_to}` : timeAgo(ticket.updated_at))}
          </Text>
          {ticket.unread_messages ? (
            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
              <Text style={styles.badgeText}>💬 {ticket.unread_messages}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontSize: 13, fontWeight: '600' },
  subject: { fontSize: 16, fontWeight: '600' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  status: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 2, overflow: 'hidden' },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
