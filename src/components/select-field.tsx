import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Named } from '@/api/types';
import { Txt } from '@/components/ui';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption = Named & { hint?: string | null };

type Props = {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  error?: string;
};

// A form field that opens a searchable full-screen list (pickers for
// business unit / company / department, SLA rules, technicians…).
export function SelectField({ label, placeholder = 'Select…', options, value, onChange, disabled, error }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.id === value);
  const filtered = query ? options.filter((o) => `${o.name} ${o.hint ?? ''}`.toLowerCase().includes(query.toLowerCase())) : options;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ gap: Spacing.one }}>
      <Txt variant="label" color="textSecondary">{label}</Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? placeholder}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border, opacity: disabled ? 0.5 : 1 },
        ]}>
        <View style={{ flex: 1 }}>
          <Txt numberOfLines={1} color={selected ? 'text' : 'textMuted'}>{selected?.name ?? placeholder}</Txt>
          {selected?.hint ? <Txt variant="caption" color="textSecondary" numberOfLines={1}>{selected.hint}</Txt> : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>
      {error ? <Txt variant="caption" color="danger">{error}</Txt> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Txt variant="title" style={{ flex: 1 }} numberOfLines={1}>{label}</Txt>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>
          {options.length > 8 ? (
            <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={theme.textMuted}
                autoFocus
                style={[Type.body, { flex: 1, color: theme.text, paddingVertical: Spacing.two }]}
              />
            </View>
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Spacing.six }}
            ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: Spacing.four }} />}
            ListEmptyComponent={<Txt color="textSecondary" style={{ padding: Spacing.four }}>No matches.</Txt>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.id);
                  close();
                }}
                style={({ pressed }) => [styles.option, { backgroundColor: pressed || item.id === value ? theme.backgroundSelected : 'transparent' }]}>
                <View style={{ flex: 1 }}>
                  <Txt variant={item.id === value ? 'bodyStrong' : 'body'}>{item.name}</Txt>
                  {item.hint ? <Txt variant="caption" color="textSecondary">{item.hint}</Txt> : null}
                </View>
                {item.id === value ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  search: { marginHorizontal: Spacing.four, marginBottom: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 46, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.three },
  option: { paddingHorizontal: Spacing.four, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
