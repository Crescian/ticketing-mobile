import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { authHeaders } from '@/api/client';
import type { Attachment } from '@/api/types';
import { Button } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { checkFiles, FilePickError, MAX_FILES, openProtectedFile, pickDocuments, pickPhotos, takePhoto, type PickedFile } from '@/lib/files';

const isImage = (mime?: string | null) => !!mime && mime.startsWith('image/');

// Files already on the server. Images show a thumbnail; tapping any file
// downloads it (with the login token) and opens the system share sheet.
export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const theme = useTheme();
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (a: Attachment) => {
    setOpening(a.id);
    try {
      await openProtectedFile(a.url, a.name, a.mime_type);
    } catch (e) {
      Alert.alert('Could not open file', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setOpening(null);
    }
  };

  if (!attachments.length) return null;

  return (
    <View style={{ gap: Spacing.two }}>
      {attachments.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => open(a)}
          style={({ pressed }) => [styles.file, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : 'transparent' }]}>
          {isImage(a.mime_type) ? (
            <Image source={{ uri: a.url, headers: authHeaders() }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.icon, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{a.name.split('.').pop()?.toUpperCase().slice(0, 4)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text }} numberOfLines={1}>{a.name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{a.size_label}</Text>
          </View>
          {opening === a.id ? <ActivityIndicator /> : null}
        </Pressable>
      ))}
    </View>
  );
}

type PickerProps = { files: PickedFile[]; onChange: (files: PickedFile[]) => void; existingCount?: number };

// New files to upload with a request: camera, photo library or documents,
// up to 5 in total (counting files already on the ticket when editing).
export function AttachmentPicker({ files, onChange, existingCount = 0 }: PickerProps) {
  const theme = useTheme();
  const remaining = MAX_FILES - existingCount - files.length;

  const add = async (pick: () => Promise<PickedFile[]>) => {
    try {
      const picked = await pick();
      if (picked.length) onChange(checkFiles(files, picked).slice(0, MAX_FILES - existingCount));
    } catch (e) {
      Alert.alert('Attachment', e instanceof FilePickError ? e.message : 'Could not attach that file.');
    }
  };

  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>
        Attachments ({files.length + existingCount}/{MAX_FILES}) — photos, PDF, Word, Excel or text, 10 MB each
      </Text>
      {files.map((f, i) => (
        <View key={`${f.uri}-${i}`} style={[styles.file, { borderColor: theme.border }]}>
          {isImage(f.type) ? (
            <Image source={{ uri: f.uri }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.icon, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{f.name.split('.').pop()?.toUpperCase().slice(0, 4)}</Text>
            </View>
          )}
          <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>{f.name}</Text>
          <Pressable hitSlop={12} accessibilityLabel={`Remove ${f.name}`} onPress={() => onChange(files.filter((_, j) => j !== i))}>
            <Text style={{ color: theme.danger, fontWeight: '700' }}>Remove</Text>
          </Pressable>
        </View>
      ))}
      {remaining > 0 ? (
        <View style={styles.buttons}>
          <View style={{ flex: 1 }}><Button title="Camera" variant="secondary" onPress={() => add(takePhoto)} /></View>
          <View style={{ flex: 1 }}><Button title="Photos" variant="secondary" onPress={() => add(() => pickPhotos(remaining))} /></View>
          <View style={{ flex: 1 }}><Button title="Files" variant="secondary" onPress={() => add(() => pickDocuments())} /></View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  file: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.two },
  thumb: { width: 44, height: 44, borderRadius: Radius.sm },
  icon: { alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.two },
});
