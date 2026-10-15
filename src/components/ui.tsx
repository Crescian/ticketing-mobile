import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Small shared building blocks so every screen looks the same.

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[{ flex: 1, backgroundColor: theme.background }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  const background = { primary: theme.primary, secondary: theme.backgroundSelected, danger: theme.danger }[variant];
  const color = variant === 'secondary' ? theme.text : variant === 'danger' ? '#FFFFFF' : theme.onPrimary;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, { backgroundColor: background, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 }]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonText, { color }]}>{title}</Text>}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string };

// Text input with a label and error line. Password inputs (secureTextEntry)
// get an eye button to show/hide what's typed.
export function Field({ label, error, style, secureTextEntry, ...props }: FieldProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={{ gap: Spacing.one }}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !revealed}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border },
            isPassword && styles.inputWithIcon,
            style,
          ]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.eye}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return <Text style={[styles.error, { color: theme.danger }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  button: { minHeight: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  buttonText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500' },
  input: { minHeight: 48, borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: Spacing.three, fontSize: 16 },
  inputWithIcon: { paddingRight: 48 },
  eye: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13 },
});
