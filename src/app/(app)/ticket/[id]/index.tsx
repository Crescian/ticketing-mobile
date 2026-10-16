import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { cancelTicket, confirmTicket, rateTicket } from '@/api/endpoints';
import { useTicket, useTicketAction } from '@/api/queries';
import type { TicketDetail } from '@/api/types';
import { AttachmentList } from '@/components/attachments';
import { RateSheet } from '@/components/rate-sheet';
import { StatusLabel } from '@/components/ticket-card';
import { Tracker } from '@/components/tracker';
import { Badge, Button, Card, CountBubble, EmptyState, InfoRow, Loading, Notice, SectionTitle, Txt } from '@/components/ui';
import { priorityTone, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/format';
import { openProtectedFile } from '@/lib/files';

// Shows the server's message for a refused action (e.g. Helpdesk acknowledged
// it a moment ago); a 409 is a double tap and is ignored.
function reportError(error: unknown) {
  if (error instanceof ApiError && error.status === 409) return;
  Alert.alert('Not done', error instanceof Error ? error.message : 'Please try again.');
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const ticket = useTicket(id);

  if (!ticket.data) {
    return ticket.error ? (
      <EmptyState icon="alert-circle-outline" title="Couldn't load this request" message={ticket.error.message} />
    ) : (
      <Loading />
    );
  }

  const t = ticket.data;

  return (
    <>
      <Stack.Screen options={{ title: `#${t.ticket_number}` }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={ticket.isRefetching} onRefresh={ticket.refetch} tintColor={theme.primary} colors={[theme.primary]} />}>
        <Card>
          <View style={styles.row}>
            <StatusLabel ticket={t} />
            {t.priority ? <Badge label={t.priority} tone={priorityTone(t.priority)} icon="flag-outline" /> : null}
          </View>
          <Txt variant="title">{t.subject}</Txt>
          <Tracker ticket={t} />
          {t.is_on_hold && t.hold_reason ? <Notice tone="warning" icon="pause-circle" text={`On hold: ${t.hold_reason}`} /> : null}
          <View style={{ gap: Spacing.two }}>
            {t.expected_start ? <Meta icon="time-outline" text={t.expected_start} /> : null}
            {t.assigned_to ? <Meta icon="person-outline" text={`Handled by ${t.assigned_to}`} /> : null}
            <Meta icon="calendar-outline" text={`Submitted ${formatDateTime(t.created_at)}`} />
          </View>
        </Card>

        <Button
          title="Chat with IT"
          icon="chatbubbles-outline"
          variant={t.unread_messages ? 'primary' : 'outline'}
          onPress={() => router.push({ pathname: '/ticket/[id]/chat', params: { id: t.id } })}
        />
        {t.unread_messages ? (
          <View style={styles.unreadHint}>
            <CountBubble count={t.unread_messages} />
            <Txt variant="caption" color="danger">new message{t.unread_messages > 1 ? 's' : ''} from IT</Txt>
          </View>
        ) : null}

        <Actions ticket={t} />

        <Section title="Details">
          <InfoRow icon="document-text-outline" label="Problem" value={t.concern} />
          <InfoRow icon="reader-outline" label="More details" value={t.request_details} />
          <InfoRow icon="desktop-outline" label="Device / asset" value={t.asset} />
          <InfoRow icon="location-outline" label="Location" value={t.location} />
          <InfoRow icon="pricetag-outline" label="Category" value={[t.category, t.subcategory].filter(Boolean).join(' › ') || null} />
        </Section>

        {t.attachments.length ? (
          <Section title={`Attachments (${t.attachments.length})`}>
            <AttachmentList attachments={t.attachments} />
          </Section>
        ) : null}

        {t.feedback ? (
          <Section title="Your rating">
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons key={n} name={n <= t.feedback!.rating ? 'star' : 'star-outline'} size={22} color="#F5B301" />
              ))}
            </View>
            {t.feedback.comments ? <Txt>{t.feedback.comments}</Txt> : null}
          </Section>
        ) : null}

        <Section title="History">
          {t.history.map((h, i) => (
            <View key={i} style={styles.historyItem}>
              <View style={styles.timeline}>
                <View style={[styles.timelineDot, { backgroundColor: i === 0 ? theme.primary : theme.border }]} />
                {i < t.history.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: Spacing.three }}>
                <Txt variant="bodyStrong">{h.status}</Txt>
                {h.notes ? <Txt color="textSecondary">{h.notes}</Txt> : null}
                <Txt variant="caption" color="textMuted">
                  {formatDateTime(h.at)}
                  {h.by ? ` · ${h.by}` : ''}
                </Txt>
              </View>
            </View>
          ))}
        </Section>
      </ScrollView>
    </>
  );
}

function Meta({ icon, text }: { icon: 'time-outline' | 'person-outline' | 'calendar-outline'; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <Txt color="textSecondary" style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}

function Actions({ ticket }: { ticket: TicketDetail }) {
  const [rating, setRating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const confirm = useTicketAction(() => confirmTicket(ticket.id));
  const cancel = useTicketAction(() => cancelTicket(ticket.id));
  const rate = useTicketAction(({ stars, comments }: { stars: number; comments: string }) => rateTicket(ticket.id, stars, comments || undefined));

  const askConfirm = () =>
    Alert.alert('Is your problem fixed?', 'Confirming closes this request. If it is not fixed, chat with IT instead.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes, close it', onPress: () => confirm.mutate(undefined, { onSuccess: () => setRating(true), onError: reportError }) },
    ]);

  const askCancel = () =>
    Alert.alert('Cancel this request?', 'Helpdesk will no longer work on it. This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancel.mutate(undefined, { onError: reportError }) },
    ]);

  const openReport = async () => {
    if (!ticket.service_report_url) return;
    setDownloading(true);
    try {
      await openProtectedFile(ticket.service_report_url, `Service-Report-${ticket.ticket_number}.pdf`, 'application/pdf');
    } catch (e) {
      reportError(e);
    } finally {
      setDownloading(false);
    }
  };

  const hasActions = ticket.can_confirm || ticket.can_rate || ticket.can_edit || ticket.can_cancel || ticket.has_service_report;
  if (!hasActions) return null;

  return (
    <View style={{ gap: Spacing.two }}>
      {ticket.can_confirm ? (
        <>
          <Notice tone="success" icon="checkmark-circle" text="IT has resolved your request. Please review the service report and confirm the fix." />
          <Button title="Yes, it's fixed — close request" icon="checkmark-done" onPress={askConfirm} loading={confirm.isPending} />
        </>
      ) : null}
      {ticket.can_rate ? <Button title="Rate this request" icon="star-outline" onPress={() => setRating(true)} /> : null}
      {ticket.has_service_report ? <Button title="View service report (PDF)" icon="document-attach-outline" variant="secondary" onPress={openReport} loading={downloading} /> : null}
      {ticket.can_edit || ticket.can_cancel ? (
        <View style={styles.buttonRow}>
          {ticket.can_edit ? (
            <Button
              title="Edit"
              icon="create-outline"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/ticket/[id]/edit', params: { id: ticket.id } })}
            />
          ) : null}
          {ticket.can_cancel ? <Button title="Cancel request" icon="close-circle-outline" variant="danger" style={{ flex: 1 }} onPress={askCancel} loading={cancel.isPending} /> : null}
        </View>
      ) : null}

      <RateSheet
        visible={rating && ticket.can_rate}
        submitting={rate.isPending}
        error={rate.error?.message}
        onClose={() => setRating(false)}
        onSubmit={(stars, comments) => rate.mutate({ stars, comments }, { onSuccess: () => setRating(false) })}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>{title}</SectionTitle>
      <Card>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.seven },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  unreadHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: -Spacing.two, alignSelf: 'center' },
  buttonRow: { flexDirection: 'row', gap: Spacing.two },
  stars: { flexDirection: 'row', gap: 4 },
  historyItem: { flexDirection: 'row', gap: Spacing.three },
  timeline: { alignItems: 'center', width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { flex: 1, width: 2, marginTop: 2 },
});
