import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { authHeaders } from '@/api/client';
import type { Attachment } from '@/api/types';
import { Button, Txt, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { checkFiles, FilePickError, MAX_FILES, openProtectedFile, pickDocuments, pickPhotos, takePhoto, type PickedFile } from '@/lib/files';

const isImage = (mime?: string | null) => !!mime && mime.startsWith('image/');

export function fileIcon(name: string, mime?: string | null): IconName {
  if (isImage(mime)) return 'image-outline';
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'document-text-outline';
  if (ext === 'xls' || ext === 'xlsx') return 'grid-outline';
  return 'document-outline';
}

function FileThumb({ uri, name, mime, headers }: { uri: string; name: string; mime?: string | null; headers?: Record<string, string> }) {
  const theme = useTheme();
  return isImage(mime) ? (
    <Image source={headers ? { uri, headers } : { uri }} style={styles.thumb} contentFit="cover" />
  ) : (
    <View style={[styles.thumb, styles.icon, { backgroundColor: theme.backgroundSelected }]}>
      <Ionicons name={fileIcon(name, mime)} size={22} color={theme.primary} />
    </View>
  );
}

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
          accessibilityRole="button"
          accessibilityLabel={`Open ${a.name}`}
          style={({ pressed }) => [styles.file, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : 'transparent' }]}>
          <FileThumb uri={a.url} name={a.name} mime={a.mime_type} headers={authHeaders()} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>{a.name}</Txt>
            <Txt variant="caption" color="textSecondary">{a.size_label}</Txt>
          </View>
          {opening === a.id ? <ActivityIndicator color={theme.primary} /> : <Ionicons name="open-outline" size={18} color={theme.textSecondary} />}
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
      <View style={styles.pickerHeader}>
        <Txt variant="label" color="textSecondary">Attachments</Txt>
        <Txt variant="caption" color="textSecondary">{files.length + existingCount}/{MAX_FILES} · 10 MB each</Txt>
      </View>
      {files.map((f, i) => (
        <View key={`${f.uri}-${i}`} style={[styles.file, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <FileThumb uri={f.uri} name={f.name} mime={f.type} />
          <Txt style={{ flex: 1 }} numberOfLines={1}>{f.name}</Txt>
          <Pressable hitSlop={12} accessibilityLabel={`Remove ${f.name}`} onPress={() => onChange(files.filter((_, j) => j !== i))}>
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </Pressable>
        </View>
      ))}
      {remaining > 0 ? (
        <View style={styles.buttons}>
          <Button title="Camera" icon="camera-outline" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => add(takePhoto)} />
          <Button title="Photos" icon="images-outline" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => add(() => pickPhotos(remaining))} />
          <Button title="Files" icon="attach-outline" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => add(() => pickDocuments())} />
        </View>
      ) : null}
      <Txt variant="caption" color="textMuted">Photos, PDF, Word, Excel or text files.</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  file: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.two },
  thumb: { width: 44, height: 44, borderRadius: Radius.sm },
  icon: { alignItems: 'center', justifyContent: 'center' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.two },
});
