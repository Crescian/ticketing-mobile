import { StyleSheet, View } from 'react-native';

import type { Concern } from '@/api/staff-types';
import { Badge, Card, Txt } from '@/components/ui';
import { Spacing, type Tone } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';

export const URGENCY_TONE: Record<string, Tone> = { High: 'danger', Medium: 'warning', Low: 'neutral' };
export const STATUS_TONE: Record<string, Tone> = { Open: 'info', Acknowledged: 'warning', Closed: 'success' };

export function ConcernCard({ concern, children }: { concern: Concern; children?: React.ReactNode }) {
  return (
    <Card>
      <View style={styles.row}>
        <Txt variant="label" color="textSecondary">{concern.reference}</Txt>
        <View style={styles.badges}>
          <Badge label={concern.urgency} tone={URGENCY_TONE[concern.urgency]} />
          <Badge label={concern.status} tone={STATUS_TONE[concern.status]} />
        </View>
      </View>
      <Txt variant="heading">{concern.subject}</Txt>
      <Txt variant="caption" color="textSecondary">{concern.category}</Txt>
      <Txt>{concern.details}</Txt>
      {concern.closing_note ? <Txt color="textSecondary">Closing note: {concern.closing_note}</Txt> : null}
      <Txt variant="caption" color="textMuted">
        {[concern.submitter ? `${concern.submitter.name}${concern.submitter.role ? ` (${concern.submitter.role})` : ''}` : null, formatDateTime(concern.created_at)].filter(Boolean).join(' · ')}
      </Txt>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  badges: { flexDirection: 'row', gap: Spacing.one },
});
