import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Named } from '@/api/types';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  placeholder?: string;
  options: Named[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  error?: string;
};

// A form field that opens a searchable full-screen list — used for the
// business unit / company / department pickers.
export function SelectField({ label, placeholder = 'Select…', options, value, onChange, disabled, error }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.id === value);
  const filtered = query ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())) : options;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ gap: Spacing.one }}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? placeholder}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border, opacity: disabled ? 0.5 : 1 },
        ]}>
        <Text style={{ color: selected ? theme.text : theme.textSecondary, fontSize: 16 }} numberOfLines={1}>
          {selected?.name ?? placeholder}
        </Text>
        <Text style={{ color: theme.textSecondary }}>▾</Text>
      </Pressable>
      {error ? <Text style={{ color: theme.danger, fontSize: 13 }}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{label}</Text>
            <Pressable onPress={close} hitSlop={12}>
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
          {options.length > 8 ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />}
            ListEmptyComponent={<Text style={{ color: theme.textSecondary, padding: Spacing.three }}>No matches.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.id);
                  close();
                }}
                style={({ pressed }) => [styles.option, { backgroundColor: pressed || item.id === value ? theme.backgroundSelected : 'transparent' }]}>
                <Text style={{ color: theme.text, fontSize: 16 }}>{item.name}</Text>
                {item.id === value ? <Text style={{ color: theme.primary }}>✓</Text> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    minHeight: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  search: { marginHorizontal: Spacing.three, marginBottom: Spacing.two, minHeight: 44, borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: Spacing.three, fontSize: 16 },
  option: { paddingHorizontal: Spacing.three, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
});
