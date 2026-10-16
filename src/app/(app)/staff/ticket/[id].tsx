import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { useStaffAction, useStaffTicket } from '@/api/staff-queries';
import type { StaffAction, StaffTicketDetail } from '@/api/staff-types';
import { AttachmentList } from '@/components/attachments';
import { ActionForm } from '@/components/staff/action-form';
import { Badge, Button, Card, EmptyState, InfoRow, Loading, Notice, SectionTitle, StatusBadge, Txt, type IconName } from '@/components/ui';
import { priorityTone, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/format';
import { openProtectedFile } from '@/lib/files';
import { slaLabel, useNow } from '@/lib/sla';

export default function StaffTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const ticket = useStaffTicket(id);

  if (!ticket.data) {
    return ticket.error ? <EmptyState icon="alert-circle-outline" title="Couldn't load this ticket" message={ticket.error.message} /> : <Loading />;
  }

  const t = ticket.data;

  return (
    <>
      <Stack.Screen options={{ title: `#${t.ticket_number}` }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={ticket.isRefetching} onRefresh={ticket.refetch} tintColor={theme.primary} colors={[theme.primary]} />}>
        <Summary t={t} />
        <Actions ticket={t} />
        <Notices t={t} />

        <Section title="Request">
          <InfoRow icon="document-text-outline" label="Concern" value={t.concern} />
          <InfoRow icon="reader-outline" label="Details" value={t.request_details} />
          <InfoRow icon="desktop-outline" label="Device / asset" value={t.asset} />
          <InfoRow icon="location-outline" label="Location" value={t.location} />
          <InfoRow icon="call-outline" label="Received" value={[t.received, t.method].filter(Boolean).join(' · ') || null} />
        </Section>

        <Section title="Classification & schedule">
          <InfoRow icon="pricetags-outline" label="Category" value={[t.category, t.subcategory].filter(Boolean).join(' › ') || 'Not classified yet'} />
          <InfoRow icon="layers-outline" label="Workload class" value={t.classification.workload_class} />
          <InfoRow
            icon="timer-outline"
            label="SLA targets"
            value={
              t.classification.response_minutes || t.classification.resolution_minutes
                ? `Response ${t.classification.response_minutes ?? '—'} min · Resolution ${t.classification.resolution_minutes ?? '—'} min`
                : null
            }
          />
          <InfoRow
            icon="calendar-outline"
            label="Scheduled"
            value={t.scheduled_start ? `${formatDateTime(t.scheduled_start)}${t.scheduled_end ? ` – ${formatDateTime(t.scheduled_end)}` : ''}${t.is_overtime ? ' (overtime)' : ''}` : null}
          />
          <InfoRow icon="play-outline" label="Started" value={t.started_at ? formatDateTime(t.started_at) : null} />
          <InfoRow icon="hourglass-outline" label="Time spent" value={t.time_spent} />
        </Section>

        {t.report ? <Report t={t} /> : null}

        {t.escalations.length ? (
          <Section title="Escalations">
            {t.escalations.map((e, i) => (
              <View key={i} style={{ gap: 2 }}>
                <Txt variant="bodyStrong">{e.reason ?? 'Escalated'}</Txt>
                {e.already_tried ? <Txt color="textSecondary">Tried: {e.already_tried}</Txt> : null}
                <Txt variant="caption" color="textMuted">{[e.by, e.at ? formatDateTime(e.at) : null].filter(Boolean).join(' · ')}</Txt>
              </View>
            ))}
          </Section>
        ) : null}

        {t.attachments.length ? (
          <Section title={`Attachments (${t.attachments.length})`}>
            <AttachmentList attachments={t.attachments} />
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

function Summary({ t }: { t: StaffTicketDetail }) {
  const now = useNow(30_000);
  const sla = t.sla && t.sla.seconds_remaining !== null ? slaLabel(t.sla.due_at, now) : null;

  return (
    <Card>
      <View style={styles.row}>
        <StatusBadge status={t.status} />
        {t.priority ? <Badge label={t.priority} tone={priorityTone(t.priority)} icon="flag-outline" /> : null}
        {t.escalation_level > 0 ? <Badge label="Escalated" tone="danger" icon="arrow-up" /> : null}
      </View>
      <Txt variant="title">{t.subject}</Txt>
      {sla ? (
        <Notice
          tone={t.sla?.breached || sla.overdue ? 'danger' : t.sla?.at_risk ? 'warning' : 'success'}
          icon="timer-outline"
          text={`SLA: ${sla.text} (due ${formatDateTime(t.sla!.due_at)})`}
        />
      ) : null}
      <View style={{ gap: Spacing.two }}>
        <Meta icon="person-outline" text={[t.requester.name, t.requester_position, t.requester.department, t.requester_company].filter(Boolean).join(' · ')} />
        <Meta
          icon="construct-outline"
          text={t.assignee ? `${t.assignee.name}${t.assignee.role ? ` (${t.assignee.role})` : ''}${t.assignee.free_time_label ? ` · ${t.assignee.free_time_label}` : ''}` : 'Not assigned yet'}
        />
        {t.assignee && !t.acknowledged_by_assignee && t.status === 'Assigned' ? <Meta icon="hourglass-outline" text="Waiting for the assignee to acknowledge" /> : null}
        <Meta icon="calendar-outline" text={`Submitted ${formatDateTime(t.created_at)}`} />
      </View>
      <Button
        title={t.unread_messages ? `Chat (${t.unread_messages} new)` : 'Chat with requester'}
        icon="chatbubbles-outline"
        variant={t.unread_messages ? 'primary' : 'outline'}
        size="sm"
        onPress={() => router.push({ pathname: '/ticket/[id]/chat', params: { id: t.id } })}
      />
    </Card>
  );
}

function Notices({ t }: { t: StaffTicketDetail }) {
  return (
    <>
      {t.hold_reason ? <Notice tone="warning" icon="pause-circle" text={`On hold: ${t.hold_reason}`} /> : null}
      {t.revision ? <Notice tone="warning" icon="refresh-circle" text={`Revision requested${t.revision.notes ? `: ${t.revision.notes}` : ''}`} /> : null}
      {t.pending_reclassification ? (
        <Card>
          <View style={styles.row}>
            <Ionicons name="swap-horizontal" size={18} color="#a15c00" />
            <Txt variant="heading">Reclassification requested</Txt>
          </View>
          <InfoRow label="From" value={t.pending_reclassification.current || '—'} />
          <InfoRow label="To" value={t.pending_reclassification.proposed || '—'} />
          <InfoRow label="Reason" value={t.pending_reclassification.reason} />
          <InfoRow label="Requested by" value={t.pending_reclassification.requested_by} />
        </Card>
      ) : null}
      {t.cannot_resolve ? <Notice tone="danger" icon="ban" text={`Marked as cannot resolve: ${t.cannot_resolve.findings ?? ''}`} /> : null}
    </>
  );
}

function Report({ t }: { t: StaffTicketDetail }) {
  const [opening, setOpening] = useState(false);
  const r = t.report!;
  const open = async () => {
    if (!t.service_report_url) return;
    setOpening(true);
    try {
      await openProtectedFile(t.service_report_url, `Service-Report-${t.ticket_number}.pdf`, 'application/pdf');
    } catch (e) {
      Alert.alert('Could not open the report', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Section title="Service report">
      <InfoRow icon="navigate-outline" label="Service type" value={r.service_type} />
      <InfoRow icon="build-outline" label="Action taken" value={r.resolution_notes} />
      <InfoRow icon="search-outline" label="Findings" value={r.findings} />
      <InfoRow icon="bulb-outline" label="Recommendation" value={r.recommendation} />
      <InfoRow icon="person-outline" label="Resolved by" value={r.resolved_by} />
      <InfoRow icon="shield-checkmark-outline" label="Validated" value={r.validated_at ? `${formatDateTime(r.validated_at)}${r.validation_notes ? ` — ${r.validation_notes}` : ''}` : null} />
      {t.service_report_url ? <Button title="Open service report (PDF)" icon="document-attach-outline" variant="secondary" size="sm" onPress={open} loading={opening} /> : null}
    </Section>
  );
}

// The role's actions for this ticket now (from the server). Field-less ones
// confirm and run straight away; the rest open their form.
function Actions({ ticket }: { ticket: StaffTicketDetail }) {
  const run = useStaffAction(ticket.id);
  const [formAction, setFormAction] = useState<StaffAction | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  if (!ticket.actions.length) return null;

  const runDirect = (action: StaffAction) => {
    const go = async () => {
      setRunning(action.key);
      try {
        const result = await run.mutateAsync({ action: action.key, values: {} });
        Alert.alert('Done', result.message);
      } catch (e) {
        if (e instanceof ApiError && e.code === 'schedule_decision_required') {
          setFormAction({ ...action, fields: [] }); // let the form ask the overtime question
          return;
        }
        if (!(e instanceof ApiError && e.status === 409)) Alert.alert('Not done', e instanceof Error ? e.message : 'Please try again.');
      } finally {
        setRunning(null);
      }
    };
    Alert.alert(action.label, action.confirm ?? `${action.label} ticket #${ticket.ticket_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.label, style: action.tone === 'danger' ? 'destructive' : 'default', onPress: go },
    ]);
  };

  const primary = ticket.actions.filter((a) => a.tone === 'primary');
  const others = ticket.actions.filter((a) => a.tone !== 'primary');

  return (
    <View style={{ gap: Spacing.two }}>
      <SectionTitle>Actions</SectionTitle>
      {primary.map((a) => (
        <Button key={a.key} title={a.label} icon={a.icon as IconName} onPress={() => (a.fields.length ? setFormAction(a) : runDirect(a))} loading={running === a.key} />
      ))}
      <View style={styles.wrapRow}>
        {others.map((a) => (
          <Button
            key={a.key}
            title={a.label}
            icon={a.icon as IconName}
            size="sm"
            variant={a.tone === 'danger' ? 'outline' : 'secondary'}
            style={styles.halfButton}
            onPress={() => (a.fields.length ? setFormAction(a) : runDirect(a))}
            loading={running === a.key}
          />
        ))}
      </View>
      <ActionForm ticketId={ticket.id} action={formAction} onClose={() => setFormAction(null)} />
    </View>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <Txt color="textSecondary" style={{ flex: 1 }}>{text}</Txt>
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
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  halfButton: { flexGrow: 1, flexBasis: '45%' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  historyItem: { flexDirection: 'row', gap: Spacing.three },
  timeline: { alignItems: 'center', width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { flex: 1, width: 2, marginTop: 2 },
});
