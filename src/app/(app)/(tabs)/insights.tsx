import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExecutiveData, type ExecutiveData } from '@/api/staff';
import { useSession } from '@/auth/session';
import { Badge, Card, EmptyState, Screen, ScreenHeader, SectionTitle, Txt, type IconName } from '@/components/ui';
import { Fonts, Radius, Spacing, toneColors, type Tone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RANGES = ['7D', '30D', '90D', 'YTD'] as const;
type Range = (typeof RANGES)[number];

const num = (v: number | string | null | undefined) => (v === null || v === undefined || v === '' ? null : Number(v));

// The executive dashboard on the phone (web: /executive/dashboard). Managers
// own it; Helpdesk and Supervisors see it read-only, as on the web.
export default function InsightsScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const [range, setRange] = useState<Range>('30D');
  const q = useQuery({ queryKey: ['staff', 'executive', range], queryFn: () => getExecutiveData(range), refetchInterval: 5 * 60_000 });
  const d = q.data;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title={user?.role === 'Manager' ? 'Dashboard' : 'Insights'} subtitle={d ? d.curPeriodLabel : 'Support performance'} />
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={theme.primary} colors={[theme.primary]} />}>
          <View style={[styles.segment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {RANGES.map((r) => (
              <Pressable key={r} onPress={() => setRange(r)} style={[styles.segmentItem, r === range && { backgroundColor: theme.primary }]} accessibilityRole="tab" accessibilityState={{ selected: r === range }}>
                <Txt variant="label" style={{ color: r === range ? theme.onPrimary : theme.text }}>{r}</Txt>
              </Pressable>
            ))}
          </View>

          {q.isPending ? (
            <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
          ) : q.error ? (
            <EmptyState icon="cloud-offline-outline" title="Couldn't load insights" message={q.error.message} />
          ) : d ? (
            <Body d={d} />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function Body({ d }: { d: ExecutiveData }) {
  const theme = useTheme();
  const avgHours = num(d.avgResolutionTime);
  const rating = num(d.avgRating);

  return (
    <View style={{ gap: Spacing.four }}>
      <View style={styles.kpis}>
        <Kpi icon="file-tray-full-outline" label="Tickets" value={String(d.totalTickets)} change={d.ticketChange} />
        <Kpi icon="checkmark-done-outline" label="Resolved" value={String(d.resolved)} change={d.resolvedChange} />
        <Kpi icon="speedometer-outline" label="Within SLA" value={`${d.slaPercent}%`} tone={d.slaPercent >= 90 ? 'success' : d.slaPercent >= 75 ? 'warning' : 'danger'} hint={`${d.slaBreach} breached`} />
        <Kpi icon="time-outline" label="Avg resolution" value={avgHours !== null ? `${avgHours.toFixed(1)}h` : '—'} change={d.avgTimeChange} lowerIsBetter />
        <Kpi icon="star-outline" label="Satisfaction" value={rating !== null ? `${rating.toFixed(1)} / 5` : '—'} hint={`${d.totalFeedback} ratings`} />
        <Kpi icon="arrow-up-circle-outline" label="Escalations" value={String(d.escalations)} change={d.escChange} lowerIsBetter />
      </View>

      <SectionTitle>Ticket volume</SectionTitle>
      <Card>
        <VolumeChart days={d.volumeDays} opened={d.volumeOpened} resolved={d.volumeResolved} />
      </Card>

      <SectionTitle>SLA by priority</SectionTitle>
      <Card>
        {Object.entries(d.slaByPriority).map(([priority, pct]) => (
          <Meter key={priority} label={priority} pct={pct ?? 0} empty={pct === null} tone={(pct ?? 100) >= 90 ? 'success' : (pct ?? 0) >= 75 ? 'warning' : 'danger'} />
        ))}
      </Card>

      {d.totalFeedback ? (
        <>
          <SectionTitle>Requester satisfaction</SectionTitle>
          <Card>
            {['5', '4', '3', '2', '1'].map((stars) => (
              <Meter key={stars} label={`${stars} ★`} pct={d.csatBreakdown[stars]?.percent ?? 0} suffix={`${d.csatBreakdown[stars]?.count ?? 0}`} tone={Number(stars) >= 4 ? 'success' : Number(stars) === 3 ? 'warning' : 'danger'} />
            ))}
          </Card>
        </>
      ) : null}

      {d.byCategory.length ? (
        <>
          <SectionTitle>Top categories</SectionTitle>
          <Card>
            {d.byCategory.slice(0, 6).map((c) => (
              <Meter key={c.request_category ?? 'none'} label={c.request_category ?? 'Uncategorized'} pct={(c.total / Math.max(...d.byCategory.map((x) => x.total))) * 100} suffix={String(c.total)} tone="primary" wide />
            ))}
          </Card>
        </>
      ) : null}

      {d.leaderboard.length ? (
        <>
          <SectionTitle>Top resolvers</SectionTitle>
          <Card>
            {d.leaderboard.slice(0, 5).map((p, i) => (
              <View key={p.id} style={styles.leader}>
                <Txt variant="heading" style={{ width: 24, color: i === 0 ? '#F5B301' : theme.textSecondary }}>{i + 1}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>{p.name}</Txt>
                  <Txt variant="caption" color="textSecondary" numberOfLines={1}>{p.position ?? ''}</Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="bodyStrong">{p.resolved_count} resolved</Txt>
                  <Txt variant="caption" color="textSecondary">
                    {num(p.avg_hours) !== null ? `${num(p.avg_hours)!.toFixed(1)}h avg` : ''}
                    {num(p.avg_rating) !== null ? ` · ${num(p.avg_rating)!.toFixed(1)}★` : ''}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {d.openEscalations.length ? (
        <>
          <SectionTitle>{`Open escalations (${d.openEscalations.length})`}</SectionTitle>
          <Card>
            {d.openEscalations.slice(0, 8).map((e) => (
              <View key={e.ticket_number} style={{ gap: 2 }}>
                <View style={styles.leader}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>#{e.ticket_number} · {e.subject}</Txt>
                  {e.sla_breached ? <Badge label="SLA breached" tone="danger" /> : null}
                </View>
                <Txt variant="caption" color="textSecondary">{e.status_label}{e.escalated_by_name ? ` · by ${e.escalated_by_name}` : ''}</Txt>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>IT team now</SectionTitle>
      <Card>
        {d.itTeamStatus.map((m) => (
          <View key={m.id} style={styles.leader}>
            <View style={[styles.dot, { backgroundColor: m.online ? theme.success : theme.border }]} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>{m.name}</Txt>
              <Txt variant="caption" color="textSecondary">{m.role}</Txt>
            </View>
            <Badge label={`${m.active_tickets} active`} tone={m.availability === 'full' ? 'danger' : m.availability === 'busy' ? 'warning' : 'success'} />
          </View>
        ))}
      </Card>
    </View>
  );
}

function Kpi({ icon, label, value, change, lowerIsBetter, tone, hint }: { icon: IconName; label: string; value: string; change?: number | null; lowerIsBetter?: boolean; tone?: Tone; hint?: string }) {
  const theme = useTheme();
  const good = change === null || change === undefined ? null : lowerIsBetter ? change <= 0 : change >= 0;
  const accent = tone ? toneColors(theme, tone).fg : theme.primary;
  return (
    <View style={[styles.kpi, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.kpiTop}>
        <Ionicons name={icon} size={16} color={accent} />
        <Txt variant="caption" color="textSecondary" numberOfLines={1}>{label}</Txt>
      </View>
      <Txt variant="title" style={{ color: tone ? accent : theme.text }}>{value}</Txt>
      {change !== null && change !== undefined ? (
        <Txt variant="caption" style={{ color: good ? theme.success : theme.danger, fontFamily: Fonts.bold }}>
          {change > 0 ? '▲' : change < 0 ? '▼' : '•'} {Math.abs(change)}% vs prev.
        </Txt>
      ) : hint ? (
        <Txt variant="caption" color="textSecondary">{hint}</Txt>
      ) : null}
    </View>
  );
}

function Meter({ label, pct, tone, suffix, empty, wide }: { label: string; pct: number; tone: Tone; suffix?: string; empty?: boolean; wide?: boolean }) {
  const theme = useTheme();
  const { fg } = toneColors(theme, tone);
  return (
    <View style={styles.meterRow}>
      <Txt variant="caption" numberOfLines={1} style={{ width: wide ? 120 : 64 }}>{label}</Txt>
      <View style={[styles.meterTrack, { backgroundColor: theme.neutralSoft }]}>
        <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: fg, height: '100%', borderRadius: 5 }} />
      </View>
      <Txt variant="caption" style={{ width: 40, textAlign: 'right', fontFamily: Fonts.bold }}>{empty ? '—' : suffix ?? `${Math.round(pct)}%`}</Txt>
    </View>
  );
}

// Opened vs resolved per day, as simple paired bars (no chart library).
function VolumeChart({ days, opened, resolved }: { days: string[]; opened: number[]; resolved: number[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...opened, ...resolved);
  const step = Math.ceil(days.length / 6);

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.chart}>
        {days.map((day, i) => (
          <View key={day} style={styles.barGroup} accessibilityLabel={`${day}: ${opened[i]} opened, ${resolved[i]} resolved`}>
            <View style={[styles.bar, { height: `${(opened[i] / max) * 100}%`, backgroundColor: theme.info }]} />
            <View style={[styles.bar, { height: `${(resolved[i] / max) * 100}%`, backgroundColor: theme.success }]} />
          </View>
        ))}
      </View>
      <View style={styles.chartLabels}>
        {days.filter((_, i) => i % step === 0).map((day) => (
          <Txt key={day} variant="caption" color="textMuted" style={{ fontSize: 10 }}>{day}</Txt>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendBox, { backgroundColor: theme.info }]} />
        <Txt variant="caption" color="textSecondary">Opened</Txt>
        <View style={[styles.legendBox, { backgroundColor: theme.success, marginLeft: Spacing.three }]} />
        <Txt variant="caption" color="textSecondary">Resolved</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.seven },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: Radius.md, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.sm },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  kpi: { flexBasis: '48%', flexGrow: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, padding: Spacing.three, gap: 2 },
  kpiTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  meterTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barGroup: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  bar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2, minHeight: 1 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
  leader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
