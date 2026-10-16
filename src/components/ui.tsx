import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  Fonts,
  Radius,
  Spacing,
  statusTone,
  toneColors,
  Type,
  type ThemeColor,
  type Tone,
  type TypeVariant,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The app's UI kit. Every screen builds on these so spacing, type and colour
// stay consistent (tokens in constants/theme.ts).

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ── Text ────────────────────────────────────────────────────────────────────
type TxtProps = TextProps & { variant?: TypeVariant; color?: ThemeColor; center?: boolean };

export function Txt({ variant = 'body', color = 'text', center, style, ...props }: TxtProps) {
  const theme = useTheme();
  return <Text style={[Type[variant], { color: theme[color] }, center && { textAlign: 'center' }, style]} {...props} />;
}

// ── Layout ──────────────────────────────────────────────────────────────────
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[{ flex: 1, backgroundColor: theme.background }, style]}>{children}</View>;
}

// Large page title used at the top of tab screens (tabs have no native header).
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string | null; right?: ReactNode }) {
  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="display" numberOfLines={1}>{title}</Txt>
        {subtitle ? <Txt color="textSecondary" numberOfLines={1}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, padded && styles.cardPadding, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Txt variant="overline" color="textSecondary">{children.toUpperCase()}</Txt>
      {right}
    </View>
  );
}

// Tappable row inside a Card (padded={false}): icon, label, optional hint/value, chevron.
type ListRowProps = {
  icon?: IconName;
  label: string;
  hint?: string | null;
  value?: string | null;
  onPress?: () => void;
  last?: boolean;
  tone?: 'default' | 'danger';
};

export function ListRow({ icon, label, hint, value, onPress, last, tone = 'default' }: ListRowProps) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.listRow,
        { borderBottomColor: theme.border, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      {icon ? <Ionicons name={icon} size={20} color={tone === 'danger' ? theme.danger : theme.primary} /> : null}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" style={{ color }}>{label}</Txt>
        {hint ? <Txt variant="caption" color="textSecondary">{hint}</Txt> : null}
      </View>
      {value ? <Txt color="textSecondary" numberOfLines={1} style={{ maxWidth: '50%', textAlign: 'right' }}>{value}</Txt> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

// Label/value pair for detail screens.
export function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon?: IconName }) {
  const theme = useTheme();
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.infoRow}>
      {icon ? <Ionicons name={icon} size={16} color={theme.textSecondary} style={{ marginTop: 2 }} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="caption" color="textSecondary">{label}</Txt>
        {typeof value === 'string' ? <Txt>{value}</Txt> : value}
      </View>
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

// ── Badges ──────────────────────────────────────────────────────────────────
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const { fg, bg } = toneColors(theme, tone);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[Type.label, { color: fg, fontSize: 12 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string | null }) {
  return <Badge label={label ?? status ?? '—'} tone={statusTone(status)} />;
}

// Small round count bubble (unread, queue counts).
export function CountBubble({ count, tone = 'danger' }: { count: number; tone?: Tone }) {
  const theme = useTheme();
  if (!count) return null;
  const { fg } = toneColors(theme, tone);
  return (
    <View style={[styles.bubble, { backgroundColor: fg }]}>
      <Text style={[Type.label, { color: '#ffffff', fontSize: 11 }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────
type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'danger' | 'ghost';
  icon?: IconName;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, size = 'md', style }: ButtonProps) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    accent: { bg: theme.accent, fg: theme.onAccent, border: theme.accent },
    secondary: { bg: theme.backgroundSelected, fg: theme.primary, border: theme.backgroundSelected },
    outline: { bg: 'transparent', fg: theme.primary, border: theme.border },
    danger: { bg: theme.danger, fg: '#ffffff', border: theme.danger },
    ghost: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={palette.fg} /> : null}
          <Text style={[Type.bodyStrong, { fontFamily: Fonts.bold, color: palette.fg, fontSize: size === 'sm' ? 14 : 15 }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color, size = 22 }: { icon: IconName; onPress: () => void; label: string; color?: string; size?: number }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <Ionicons name={icon} size={size} color={color ?? theme.primary} />
    </Pressable>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────────
type FieldProps = TextInputProps & { label: string; error?: string; hint?: string; style?: StyleProp<TextStyle> };

// Text input with a label, hint and error. Password inputs (secureTextEntry)
// get an eye button to show/hide what's typed.
export function Field({ label, error, hint, style, secureTextEntry, multiline, ...props }: FieldProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={{ gap: Spacing.one }}>
      <Txt variant="label" color="textSecondary">{label}</Txt>
      <View>
        <TextInput
          placeholderTextColor={theme.textMuted}
          {...props}
          secureTextEntry={isPassword && !revealed}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            Type.body,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: error ? theme.danger : focused ? theme.primary : theme.border,
            },
            multiline && styles.multiline,
            isPassword && styles.inputWithIcon,
            style,
          ]}
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
      {error ? <Txt variant="caption" color="danger">{error}</Txt> : hint ? <Txt variant="caption" color="textSecondary">{hint}</Txt> : null}
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Txt variant="caption" color="danger" style={{ fontSize: 13 }}>{message}</Txt>;
}

// ── Feedback ────────────────────────────────────────────────────────────────
export function Notice({ text, tone = 'info', icon }: { text: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const { fg, bg } = toneColors(theme, tone);
  return (
    <View style={[styles.notice, { backgroundColor: bg, borderLeftColor: fg }]}>
      <Ionicons name={icon ?? (tone === 'danger' ? 'alert-circle' : tone === 'warning' ? 'warning' : 'information-circle')} size={18} color={fg} />
      <Txt style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message?: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <Txt variant="heading" center>{title}</Txt>
      {message ? <Txt color="textSecondary" center>{message}</Txt> : null}
      {action}
    </View>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.two },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three },
  cardPadding: { padding: Spacing.four },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: 14 },
  infoRow: { flexDirection: 'row', gap: Spacing.two },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  bubble: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  buttonSm: { minHeight: 38, paddingHorizontal: Spacing.three },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.four },
  multiline: { minHeight: 104, paddingTop: Spacing.three, textAlignVertical: 'top' },
  inputWithIcon: { paddingRight: 48 },
  eye: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, borderLeftWidth: 4, borderRadius: Radius.md, padding: Spacing.three },
  empty: { alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.five, paddingVertical: Spacing.six },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.six },
});
