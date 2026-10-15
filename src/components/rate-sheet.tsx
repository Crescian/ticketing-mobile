import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorText, Field } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  submitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (rating: number, comments: string) => void;
};

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// 1–5 star rating with an optional comment, shown once a request is closed.
export function RateSheet({ visible, submitting, error, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.title, { color: theme.text }]}>How did IT do?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
              <Text style={[styles.star, { color: n <= rating ? '#F5B301' : theme.border }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', minHeight: 20 }}>{LABELS[rating]}</Text>
        <Field label="Comments (optional)" value={comments} onChangeText={setComments} maxLength={500} multiline style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.two }} />
        <ErrorText message={error} />
        <Button title="Submit rating" onPress={() => onSubmit(rating, comments.trim())} disabled={!rating} loading={submitting} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { padding: Spacing.four, gap: Spacing.three, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  star: { fontSize: 40 },
});
