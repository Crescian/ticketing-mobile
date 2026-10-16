import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorText, Field, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  submitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (rating: number, comments: string) => void;
};

const LABELS = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// 1–5 star rating with an optional comment, shown once a request is closed.
export function RateSheet({ visible, submitting, error, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <Txt variant="title" center>How did IT do?</Txt>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
              <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={40} color={n <= rating ? '#F5B301' : theme.border} />
            </Pressable>
          ))}
        </View>
        <Txt color="textSecondary" center>{LABELS[rating]}</Txt>
        <Field label="Comments (optional)" value={comments} onChangeText={setComments} maxLength={500} multiline />
        <ErrorText message={error} />
        <Button title="Submit rating" icon="send-outline" onPress={() => onSubmit(rating, comments.trim())} disabled={!rating} loading={submitting} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { padding: Spacing.five, paddingTop: Spacing.three, gap: Spacing.four, borderTopLeftRadius: Radius.lg + 8, borderTopRightRadius: Radius.lg + 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
});
