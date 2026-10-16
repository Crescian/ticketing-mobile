import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCalendar } from '@/api/staff';
import type { CalendarResponse } from '@/api/staff-types';
import { SelectField } from '@/components/select-field';
import { Badge, Card, EmptyState, IconButton, Screen, ScreenHeader, Txt } from '@/components/ui';
import { Fonts, priorityTone, Radius, Spacing, toneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/sla';

type View_ = 'day' | 'week' | 'month';
const VIEWS: { key: View_; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const time = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : '');
const dayLabel = (ymd: string) => new Date(`${ymd}T00:00:00+08:00`).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' });

// The web's work-hours calendar: your own schedule (specialists/IT admins) or
// your team's (supervisors).
export default function CalendarScreen() {
  const theme = useTheme();
  const [view, setView] = useState<View_>('day');
  const [date, setDate] = useState<string | undefined>(undefined);
  const [person, setPerson] = useState<string | null>(null);
  const cal = useQuery({
    queryKey: ['staff', 'calendar', view, date, person],
    queryFn: () => getCalendar({ view, date, technician_id: person ?? undefined }),
  });
  const data = cal.data;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Calendar" subtitle={data ? (data.is_own ? 'My schedule' : `Team · ${data.people_label}`) : null} />
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={cal.isRefetching} onRefresh={cal.refetch} tintColor={theme.primary} colors={[theme.primary]} />}>
          <View style={[styles.segment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {VIEWS.map((v) => (
              <Pressable key={v.key} onPress={() => setView(v.key)} style={[styles.segmentItem, v.key === view && { backgroundColor: theme.primary }]} accessibilityRole="tab" accessibilityState={{ selected: v.key === view }}>
                <Txt variant="label" style={{ color: v.key === view ? theme.onPrimary : theme.text }}>{v.label}</Txt>
              </Pressable>
            ))}
          </View>

          {data ? (
            <View style={styles.nav}>
              <IconButton icon="chevron-back" label="Previous" onPress={() => setDate(data.nav.prev)} />
              <Pressable onPress={() => setDate(data.nav.today)} style={{ flex: 1 }} accessibilityRole="button" accessibilityHint="Go to today">
                <Txt variant="heading" center>{view === 'day' ? dayLabel(data.date) : view === 'week' ? `Week of ${dayLabel(data.columns?.[0] ?? data.date)}` : new Date(`${data.date}T00:00:00+08:00`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</Txt>
                <Txt variant="caption" color="primary" center>Today</Txt>
              </Pressable>
              <IconButton icon="chevron-forward" label="Next" onPress={() => setDate(data.nav.next)} />
            </View>
          ) : null}

          {data && !data.is_own && data.people.length > 1 ? (
            <SelectField
              label={data.people_label}
              placeholder={`All ${data.people_label.toLowerCase()}`}
              options={[{ id: '__all', name: `All ${data.people_label.toLowerCase()}` }, ...data.people]}
              value={person ?? '__all'}
              onChange={(id) => setPerson(id === '__all' ? null : id)}
            />
          ) : null}

          {cal.isPending ? (
            <ActivityIndicator style={{ marginTop: Spacing.six }} color={theme.primary} />
          ) : cal.error ? (
            <EmptyState icon="cloud-offline-outline" title="Couldn't load the calendar" message={cal.error.message} />
          ) : data && view === 'day' ? (
            <DayView data={data} />
          ) : data ? (
            <Heatmap data={data} />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function DayView({ data }: { data: CalendarResponse }) {
  const theme = useTheme();
  if (!data.rows.length) return <EmptyState icon="calendar-outline" title="No one to show" />;

  return (
    <View style={{ gap: Spacing.three }}>
      {data.rows.map((row) => (
        <Card key={row.technician.id}>
          <View style={styles.rowHead}>
            <Txt variant="heading" style={{ flex: 1 }} numberOfLines={1}>{row.technician.name}</Txt>
            {row.on_leave ? <Badge label="On leave" tone="neutral" /> : <Badge label={`${row.stats?.workload_pct ?? 0}% booked`} tone={(row.stats?.workload_pct ?? 0) >= 100 ? 'danger' : (row.stats?.workload_pct ?? 0) >= 60 ? 'warning' : 'success'} />}
          </View>

          <View style={[styles.track, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {row.lunch ? <View style={[styles.lunch, { left: `${row.lunch.left_pct}%`, width: `${row.lunch.width_pct}%`, backgroundColor: theme.neutralSoft }]} /> : null}
            {(row.blocks ?? []).map((b) => (
              <View
                key={b.ticket.id}
                style={[styles.block, { left: `${b.left_pct}%`, width: `${b.width_pct}%`, backgroundColor: b.is_overtime ? theme.danger : theme.primary }]}
              />
            ))}
          </View>
          <View style={styles.axis}>
            <Txt variant="caption" color="textMuted">{time(row.axis_start)}</Txt>
            <Txt variant="caption" color="textMuted">{time(row.axis_end)}</Txt>
          </View>

          {row.stats ? (
            <Txt variant="caption" color="textSecondary">
              {row.stats.ticket_count} ticket{row.stats.ticket_count === 1 ? '' : 's'} · {formatDuration(row.stats.allocated_minutes)} booked · {formatDuration(row.stats.remaining_minutes)} free
              {row.stats.overtime_minutes ? ` · ${formatDuration(row.stats.overtime_minutes)} overtime` : ''}
            </Txt>
          ) : null}

          {(row.blocks ?? []).map((b) => (
            <Pressable
              key={`l-${b.ticket.id}`}
              onPress={() => router.push({ pathname: '/staff/ticket/[id]', params: { id: b.ticket.id } })}
              style={({ pressed }) => [styles.slot, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : 'transparent' }]}
              accessibilityRole="button">
              <View style={[styles.slotBar, { backgroundColor: b.is_overtime ? theme.danger : theme.primary }]} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>#{b.ticket.ticket_number} · {b.ticket.subject}</Txt>
                <Txt variant="caption" color="textSecondary">
                  {time(b.ticket.scheduled_start)} – {time(b.ticket.scheduled_end)} · {b.ticket.status}
                </Txt>
              </View>
              {b.ticket.priority ? <Badge label={b.ticket.priority} tone={priorityTone(b.ticket.priority)} /> : null}
            </Pressable>
          ))}
        </Card>
      ))}
    </View>
  );
}

function Heatmap({ data }: { data: CalendarResponse }) {
  const theme = useTheme();
  const columns = data.columns ?? [];
  const color = (level: string | null) =>
    level === 'red' ? toneColors(theme, 'danger').bg : level === 'yellow' ? toneColors(theme, 'warning').bg : level === 'leave' ? theme.neutralSoft : toneColors(theme, 'success').bg;
  const fg = (level: string | null) =>
    level === 'red' ? theme.danger : level === 'yellow' ? theme.warning : level === 'leave' ? theme.textMuted : theme.success;

  return (
    <Card padded={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ padding: Spacing.three, gap: 4 }}>
          <View style={styles.hmRow}>
            <View style={styles.hmName} />
            {columns.map((c) => (
              <View key={c} style={styles.hmCell}>
                <Txt variant="caption" color="textSecondary" center style={{ fontSize: 10 }}>
                  {new Date(`${c}T00:00:00+08:00`).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'narrow', day: 'numeric' })}
                </Txt>
              </View>
            ))}
          </View>
          {data.rows.map((row) => (
            <View key={row.technician.id} style={styles.hmRow}>
              <Txt variant="caption" numberOfLines={1} style={[styles.hmName, { fontFamily: Fonts.bold }]}>{row.technician.name.split(' ')[0]}</Txt>
              {(row.cells ?? []).map((cell, i) => (
                <View key={i} style={[styles.hmCell, styles.hmBox, { backgroundColor: color(cell.level) }]} accessibilityLabel={`${cell.date}: ${cell.on_leave ? 'on leave' : `${cell.ticket_count} tickets, ${cell.workload_pct}% booked`}`}>
                  {cell.on_leave ? (
                    <Ionicons name="airplane-outline" size={12} color={fg(cell.level)} />
                  ) : (
                    <Txt variant="caption" style={{ fontSize: 10, color: fg(cell.level), fontFamily: Fonts.bold }}>{cell.ticket_count || ''}</Txt>
                  )}
                </View>
              ))}
            </View>
          ))}
          <View style={styles.legend}>
            {[['green', 'Light'], ['yellow', 'Busy (60%+)'], ['red', 'Full / overtime'], ['leave', 'Leave']].map(([level, label]) => (
              <View key={level} style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: color(level) }]} />
                <Txt variant="caption" color="textSecondary">{label}</Txt>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.seven },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: Radius.md, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.sm },
  nav: { flexDirection: 'row', alignItems: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  track: { height: 22, borderRadius: Radius.sm, borderWidth: 1, overflow: 'hidden' },
  lunch: { position: 'absolute', top: 0, bottom: 0 },
  block: { position: 'absolute', top: 3, bottom: 3, borderRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.two },
  slot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.two },
  slotBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  hmRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hmName: { width: 64 },
  hmCell: { width: 26, alignItems: 'center' },
  hmBox: { height: 26, borderRadius: 5, justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
});
