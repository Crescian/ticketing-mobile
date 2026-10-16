import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useITTeam } from '@/api/queries';
import { Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Compact "Available IT" line (same data as the web dashboard panel); tap to
// see who's online.
export function ITTeamStrip() {
  const theme = useTheme();
  const team = useITTeam();
  const [open, setOpen] = useState(false);

  if (!team.data?.length) return null;
  const online = team.data.filter((m) => m.online);

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.summary}>
        <View style={[styles.iconWrap, { backgroundColor: online.length ? theme.successSoft : theme.neutralSoft }]}>
          <Ionicons name="headset" size={16} color={online.length ? theme.success : theme.textSecondary} />
        </View>
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {online.length ? `${online.length} of ${team.data.length} IT staff online` : 'IT staff are offline right now'}
        </Txt>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
      </View>
      {open
        ? team.data.map((m) => (
            <View key={m.id} style={styles.member}>
              <View style={[styles.dot, { backgroundColor: m.online ? theme.success : theme.border }]} />
              <Txt style={{ flex: 1 }} numberOfLines={1}>{m.name}</Txt>
              <Txt variant="caption" color="textSecondary">{m.role}</Txt>
            </View>
          ))
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: Spacing.four, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingLeft: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
