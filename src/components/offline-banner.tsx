import { useNetworkState } from 'expo-network';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

// Shown over the top of every screen while the phone has no internet. Data
// already loaded stays visible; requests resume on their own when the
// connection returns (TanStack onlineManager, set up in app/_layout.tsx).
export function OfflineBanner() {
  const theme = useTheme();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  if (!offline) return null;

  return (
    <SafeAreaView edges={['top']} pointerEvents="none" style={[styles.banner, { backgroundColor: theme.warning }]}>
      <Text style={styles.text}>{"You're offline — showing saved data"}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 6 },
  text: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
