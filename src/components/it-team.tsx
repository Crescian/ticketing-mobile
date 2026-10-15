import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useITTeam } from '@/api/queries';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Compact "Available IT" line for the home screen (same data as the web
// dashboard panel); tap to see who's online.
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
        <View style={[styles.dot, { backgroundColor: online.length ? theme.success : theme.textSecondary }]} />
        <Text style={{ color: theme.text, flex: 1 }}>
          {online.length ? `${online.length} of ${team.data.length} IT staff online now` : 'IT staff are offline right now'}
        </Text>
        <Text style={{ color: theme.textSecondary }}>{open ? '▴' : '▾'}</Text>
      </View>
      {open
        ? team.data.map((m) => (
            <View key={m.id} style={styles.member}>
              <View style={[styles.dot, { backgroundColor: m.online ? theme.success : theme.border }]} />
              <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>{m.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{m.role}</Text>
            </View>
          ))
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: Spacing.three, marginTop: Spacing.three, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  member: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingLeft: Spacing.one },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
