import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/api/endpoints';
import { useSession } from '@/auth/session';
import { Button, type IconName } from '@/components/ui';
import { Brand, Fonts, Spacing } from '@/constants/theme';

const PAGES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'create-outline',
    title: 'Ask IT for help',
    body: 'Tap "New", describe the problem and add a photo. Helpdesk reviews it and assigns a specialist.',
  },
  {
    icon: 'git-network-outline',
    title: 'Track every step',
    body: 'Each request shows where it is — Submitted, Scheduled, In Progress, Confirm, Closed — and roughly when work will start.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Chat with IT',
    body: 'Message the IT team on any request and send photos. You get a notification when they reply or your request moves.',
  },
  {
    icon: 'checkmark-done-circle-outline',
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
        {!last ? (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={56} color={Brand.dark} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((p, i) => (
          <View key={p.title} style={[styles.dot, { backgroundColor: i === page ? Brand.accent : 'rgba(255,255,255,0.3)', width: i === page ? 22 : 8 }]} />
        ))}
      </View>

      <Button
        title={last ? 'Get started' : 'Next'}
        icon={last ? 'rocket-outline' : 'arrow-forward'}
        variant="accent"
        onPress={() => (last ? finish() : setPage(page + 1))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.five, gap: Spacing.five },
  skipRow: { alignItems: 'flex-end', minHeight: 24 },
  skip: { color: Brand.accentSoft, fontFamily: Fonts.bold, fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.four },
  iconCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { color: '#FFFFFF', fontFamily: Fonts.black, fontSize: 28, textAlign: 'center' },
  body: { color: Brand.accentSoft, fontFamily: Fonts.regular, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  dot: { height: 8, borderRadius: 4 },
});
