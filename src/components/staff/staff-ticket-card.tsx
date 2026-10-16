import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { StaffTicket } from '@/api/staff-types';
import { Badge, CountBubble, StatusBadge, Txt } from '@/components/ui';
import { priorityTone, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { slaLabel, useNow } from '@/lib/sla';
import { timeAgo } from '@/lib/format';

const AVAILABILITY = { free: { label: 'Available', tone: 'success' }, busy: { label: 'Busy', tone: 'warning' }, full: { label: 'Full', tone: 'danger' } } as const;

// A ticket on a staff queue — status, priority, SLA countdown, requester and
// who has it (with their current capacity, as on the supervisor dashboards).
export function StaffTicketCard({ ticket }: { ticket: StaffTicket }) {
  const theme = useTheme();
  const now = useNow(60_000);
  const sla = ticket.sla && ticket.sla.seconds_remaining !== null ? slaLabel(ticket.sla.due_at, now) : null;
  const slaColor = ticket.sla?.breached || sla?.overdue ? theme.danger : ticket.sla?.at_risk ? theme.warning : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ticket ${ticket.ticket_number}: ${ticket.subject}`}
      onPress={() => router.push({ pathname: '/staff/ticket/[id]', params: { id: ticket.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: ticket.sla?.breached ? theme.danger : theme.border },
        pressed && { opacity: 0.9 },
      ]}>
      <View style={styles.row}>
        <Txt variant="label" color="textSecondary">#{ticket.ticket_number}</Txt>
        <View style={styles.badges}>
          {ticket.escalation_level > 0 ? <Badge label={ticket.escalation_level > 1 ? `Escalated ×${ticket.escalation_level}` : 'Escalated'} tone="danger" icon="arrow-up" /> : null}
          {ticket.priority ? <Badge label={ticket.priority} tone={priorityTone(ticket.priority)} /> : null}
        </View>
      </View>

      <Txt variant="heading" numberOfLines={2}>{ticket.subject}</Txt>
      <StatusBadge status={ticket.status} />

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
          <Txt variant="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {ticket.requester.name ?? 'Requester'}
            {ticket.requester.department ? ` · ${ticket.requester.department}` : ''}
          </Txt>
        </View>
        {ticket.category ? (
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={14} color={theme.textSecondary} />
            <Txt variant="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
              {[ticket.category, ticket.subcategory].filter(Boolean).join(' › ')}
            </Txt>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        {ticket.assignee ? (
          <View style={[styles.metaItem, { flexShrink: 1 }]}>
            <Ionicons name="construct-outline" size={14} color={theme.textSecondary} />
            <Txt variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>{ticket.assignee.name}</Txt>
            {ticket.assignee.availability ? (
              <Badge label={AVAILABILITY[ticket.assignee.availability].label} tone={AVAILABILITY[ticket.assignee.availability].tone} />
            ) : null}
          </View>
        ) : (
          <Txt variant="caption" color="textMuted">Unassigned · {timeAgo(ticket.created_at)}</Txt>
        )}
        <View style={styles.metaItem}>
          {sla ? (
            <>
              <Ionicons name="timer-outline" size={14} color={slaColor} />
              <Txt variant="caption" style={{ color: slaColor, fontFamily: 'Nunito_700Bold' }}>{sla.text}</Txt>
            </>
          ) : ticket.is_on_hold ? (
            <Badge label="On hold" tone="warning" icon="pause" />
          ) : null}
          {ticket.unread_messages ? <CountBubble count={ticket.unread_messages} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.four, gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  badges: { flexDirection: 'row', gap: Spacing.one },
  meta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two, marginTop: Spacing.one },
});
