import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/api/endpoints';
import { useSession } from '@/auth/session';
import { Button } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';

const PAGES = [
  {
    icon: '📝',
    title: 'Ask IT for help',
    body: 'Tap "New Request", describe the problem and add a photo. Helpdesk reviews it and assigns a specialist.',
  },
  {
    icon: '📍',
    title: 'Track every step',
    body: 'Each request shows where it is: Submitted, Scheduled, In Progress, Confirm, Closed — and roughly when work will start.',
  },
  {
    icon: '💬',
    title: 'Chat with IT',
    body: 'Message the IT team on any request and send photos. You get a notification when they reply or your request moves.',
  },
  {
    icon: '✅',
    title: 'Confirm the fix',
    body: 'When IT finishes, check the service report and confirm it is fixed. Then rate how they did.',
  },
];

// First-run tour (same one-time flag as the web's welcome modal). Also
// reachable again from Profile.
export default function WelcomeScreen() {
  const { user, setUser } = useSession();
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const { icon, title, body } = PAGES[page];

  const finish = () => {
    if (user && !user.onboarded) {
      setUser({ ...user, onboarded: true });
      completeOnboarding().catch(() => undefined); // shows again next launch if this fails — harmless
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Brand.dark }]}>
      <View style={styles.skipRow}>
        {!last ? <Text style={styles.skip} onPress={finish}>Skip</Text> : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((p, i) => (
          <View key={p.title} style={[styles.dot, { backgroundColor: i === page ? Brand.accent : 'rgba(255,255,255,0.3)', width: i === page ? 20 : 8 }]} />
        ))}
      </View>

      <Button title={last ? 'Get started' : 'Next'} onPress={() => (last ? finish() : setPage(page + 1))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  skipRow: { alignItems: 'flex-end', minHeight: 24 },
  skip: { color: Brand.accentSoft, fontSize: 16, padding: Spacing.one },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  icon: { fontSize: 72 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body: { color: Brand.accentSoft, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  dot: { height: 8, borderRadius: 4 },
});
