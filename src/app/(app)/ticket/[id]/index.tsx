import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { cancelTicket, confirmTicket, rateTicket } from '@/api/endpoints';
import { useTicket, useTicketAction } from '@/api/queries';
import type { TicketDetail } from '@/api/types';
import { AttachmentList } from '@/components/attachments';
import { RateSheet } from '@/components/rate-sheet';
import { StatusLabel } from '@/components/ticket-card';
import { Tracker } from '@/components/tracker';
import { Button, Card, ErrorText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
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
    return (
      <View style={styles.center}>
        {ticket.error ? <ErrorText message={ticket.error.message} /> : <ActivityIndicator />}
      </View>
    );
  }

  const t = ticket.data;

  return (
    <>
      <Stack.Screen options={{ title: `#${t.ticket_number}` }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={ticket.isRefetching} onRefresh={ticket.refetch} />}>
        <Card>
          <View style={styles.row}>
            <Text style={{ color: theme.textSecondary }}>Submitted {formatDateTime(t.created_at)}</Text>
            <StatusLabel ticket={t} />
          </View>
          <Text style={[styles.subject, { color: theme.text }]}>{t.subject}</Text>
          <Tracker ticket={t} />
          {t.is_on_hold && t.hold_reason ? <Notice tone="warning" text={`On hold: ${t.hold_reason}`} /> : null}
          {t.expected_start ? <Text style={{ color: theme.textSecondary }}>⏱ {t.expected_start}</Text> : null}
          {t.assigned_to ? <Text style={{ color: theme.textSecondary }}>👤 Handled by {t.assigned_to}</Text> : null}
        </Card>

        <Button
          title={t.unread_messages ? `💬 Chat with IT (${t.unread_messages} new)` : '💬 Chat with IT'}
          variant={t.unread_messages ? 'primary' : 'secondary'}
          onPress={() => router.push({ pathname: '/ticket/[id]/chat', params: { id: t.id } })}
        />

        <Actions ticket={t} />

        <Section title="Details">
          <Detail label="Problem" value={t.concern} />
          <Detail label="More details" value={t.request_details} />
          <Detail label="Device / asset" value={t.asset} />
          <Detail label="Location" value={t.location} />
          <Detail label="Category" value={[t.category, t.subcategory].filter(Boolean).join(' › ') || null} />
          <Detail label="Priority" value={t.priority} />
        </Section>

        {t.attachments.length ? (
          <Section title="Attachments">
            <AttachmentList attachments={t.attachments} />
          </Section>
        ) : null}

        {t.feedback ? (
          <Section title="Your rating">
            <Text style={{ color: '#F5B301', fontSize: 22 }}>{'★'.repeat(t.feedback.rating)}<Text style={{ color: theme.border }}>{'★'.repeat(5 - t.feedback.rating)}</Text></Text>
            {t.feedback.comments ? <Text style={{ color: theme.text }}>{t.feedback.comments}</Text> : null}
          </Section>
        ) : null}

        <Section title="History">
          {t.history.map((h, i) => (
            <View key={i} style={[styles.historyItem, { borderLeftColor: i === 0 ? theme.primary : theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>{h.status}</Text>
              {h.notes ? <Text style={{ color: theme.text }}>{h.notes}</Text> : null}
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {formatDateTime(h.at)}
                {h.by ? ` · ${h.by}` : ''}
              </Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </>
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
          <Notice tone="primary" text="IT has resolved your request. Please review the service report and confirm the fix." />
          <Button title="Yes, it's fixed — close request" onPress={askConfirm} loading={confirm.isPending} />
        </>
      ) : null}
      {ticket.can_rate ? <Button title="Rate this request" onPress={() => setRating(true)} /> : null}
      {ticket.has_service_report ? <Button title="View service report (PDF)" variant="secondary" onPress={openReport} loading={downloading} /> : null}
      {ticket.can_edit ? (
        <Button title="Edit request" variant="secondary" onPress={() => router.push({ pathname: '/ticket/[id]/edit', params: { id: ticket.id } })} />
      ) : null}
      {ticket.can_cancel ? <Button title="Cancel request" variant="danger" onPress={askCancel} loading={cancel.isPending} /> : null}

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

function Notice({ text, tone }: { text: string; tone: 'primary' | 'warning' }) {
  const theme = useTheme();
  const color = tone === 'warning' ? theme.warning : theme.primary;
  return (
    <View style={[styles.notice, { borderColor: color, backgroundColor: theme.backgroundSelected }]}>
      <Text style={{ color: theme.text }}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
      <Card>{children}</Card>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 15 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  container: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  subject: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  historyItem: { borderLeftWidth: 3, paddingLeft: Spacing.three, paddingVertical: Spacing.one, gap: 2 },
  notice: { borderLeftWidth: 4, borderRadius: 8, padding: Spacing.three },
});
