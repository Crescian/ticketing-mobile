import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authHeaders } from '@/api/client';
import { keys, useMessages, useSendMessage, useTicket, type ChatMessage } from '@/api/queries';
import type { Attachment } from '@/api/types';
import { useSession } from '@/auth/session';
import { ErrorText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, timeAgo } from '@/lib/format';
import { checkFiles, FilePickError, openProtectedFile, pickDocuments, pickPhotos, takePhoto, type PickedFile } from '@/lib/files';

// Chat accepts fewer file types than ticket attachments (server: jpg, png, gif, pdf).
const CHAT_DOCUMENT_TYPES = ['application/pdf'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const ticket = useTicket(id);
  const messages = useMessages(id);
  const send = useSendMessage(id, user);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);

  // Inverted list: newest at the bottom, next to the input.
  const data = useMemo(() => [...(messages.data ?? [])].reverse(), [messages.data]);

  const submit = () => {
    const body = text.trim();
    if (!body && !files.length) return;
    send.mutate({ text: body, files, tempId: `temp-${Date.now()}` });
    setText('');
    setFiles([]);
    setAttachOpen(false);
  };

  const attach = async (pick: () => Promise<PickedFile[]>) => {
    try {
      const picked = await pick();
      if (picked.length) setFiles(checkFiles(files, picked));
      setAttachOpen(false);
    } catch (e) {
      Alert.alert('Attachment', e instanceof FilePickError ? e.message : 'Could not attach that file.');
    }
  };

  // A failed bubble goes back into the input so nothing typed is lost.
  const restoreFailed = (m: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(keys.messages(id), (old = []) => old.filter((x) => x.id !== m.id));
    setText(m.message);
  };

  return (
    <>
      <Stack.Screen options={{ title: ticket.data ? `Chat · #${ticket.data.ticket_number}` : 'Chat' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {messages.isPending ? (
          <ActivityIndicator style={{ flex: 1 }} />
        ) : (
          <FlatList
            inverted
            data={data}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <Bubble message={item} onRetry={() => restoreFailed(item)} />}
            ListEmptyComponent={
              <View style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
                {messages.error ? (
                  <ErrorText message={messages.error.message} />
                ) : (
                  <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    No messages yet. Ask IT a question or add details about your request here.
                  </Text>
                )}
              </View>
            }
          />
        )}

        <SafeAreaView edges={['bottom']} style={[styles.composer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
          {files.length ? (
            <View style={styles.pendingFiles}>
              {files.map((f, i) => (
                <Pressable key={`${f.uri}-${i}`} onPress={() => setFiles(files.filter((_, j) => j !== i))} style={[styles.chip, { borderColor: theme.border }]}>
                  <Text style={{ color: theme.text, maxWidth: 140 }} numberOfLines={1}>{f.name}</Text>
                  <Text style={{ color: theme.danger, fontWeight: '700' }}>✕</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {attachOpen ? (
            <View style={styles.attachRow}>
              <AttachOption label="📷 Camera" onPress={() => attach(takePhoto)} />
              <AttachOption label="🖼 Photos" onPress={() => attach(() => pickPhotos(5 - files.length))} />
              <AttachOption label="📄 PDF" onPress={() => attach(() => pickDocuments(CHAT_DOCUMENT_TYPES))} />
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <Pressable
              accessibilityLabel="Attach a file"
              onPress={() => setAttachOpen((v) => !v)}
              style={[styles.iconButton, { backgroundColor: attachOpen ? theme.backgroundSelected : 'transparent' }]}>
              <Text style={{ color: theme.primary, fontSize: 24, fontWeight: '600' }}>{attachOpen ? '×' : '+'}</Text>
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message IT…"
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={1000}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
            <Pressable
              accessibilityLabel="Send message"
              onPress={submit}
              disabled={!text.trim() && !files.length}
              style={[styles.send, { backgroundColor: theme.primary, opacity: !text.trim() && !files.length ? 0.4 : 1 }]}>
              <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>Send</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

function AttachOption({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.attachOption, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : theme.background }]}>
      <Text style={{ color: theme.text, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

function Bubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  const theme = useTheme();
  const mine = message.is_me;

  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      {!mine ? (
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>{message.sender.initials}</Text>
        </View>
      ) : null}
      <View style={{ maxWidth: '78%', gap: 2, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {!mine ? (
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {message.sender.name}
            {message.sender.role ? ` · ${message.sender.role}` : ''}
          </Text>
        ) : null}
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 4 },
          ]}>
          {message.attachments.map((a) => (
            <ChatAttachment key={a.id} attachment={a} local={!!message.pending || !!message.failed} mine={mine} />
          ))}
          {message.message ? <Text style={{ color: mine ? theme.onPrimary : theme.text, fontSize: 15 }}>{message.message}</Text> : null}
        </View>
        {message.failed ? (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={{ color: theme.danger, fontSize: 12 }}>Not sent — tap to edit and resend</Text>
          </Pressable>
        ) : (
          <Text style={{ color: theme.textSecondary, fontSize: 11 }} accessibilityLabel={formatDateTime(message.created_at)}>
            {message.pending ? 'Sending…' : timeAgo(message.created_at)}
            {mine && !message.pending ? (message.is_read ? ' · Seen' : ' · Sent') : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

// Images preview inline; PDFs open in the share sheet. A just-picked file
// (still sending) points at the local copy, which needs no login header.
function ChatAttachment({ attachment, local, mine }: { attachment: Attachment; local: boolean; mine: boolean }) {
  const theme = useTheme();
  const [opening, setOpening] = useState(false);
  const isImage = attachment.mime_type?.startsWith('image/');

  const open = async () => {
    if (local) return;
    setOpening(true);
    try {
      await openProtectedFile(attachment.url, attachment.name, attachment.mime_type);
    } catch (e) {
      Alert.alert('Could not open file', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Pressable onPress={open} disabled={local}>
      {isImage ? (
        <Image source={local ? { uri: attachment.url } : { uri: attachment.url, headers: authHeaders() }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.fileChip, { borderColor: mine ? theme.onPrimary : theme.border }]}>
          <Text style={{ color: mine ? theme.onPrimary : theme.text, flexShrink: 1 }} numberOfLines={1}>📄 {attachment.name}</Text>
          {opening ? <ActivityIndicator color={mine ? theme.onPrimary : theme.primary} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.three, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', padding: Spacing.four },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: Radius.lg, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two },
  image: { width: 200, height: 150, borderRadius: Radius.sm },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.two, maxWidth: 220 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingTop: Spacing.two, gap: Spacing.two },
  pendingFiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  attachRow: { flexDirection: 'row', gap: Spacing.two },
  attachOption: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.two },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingBottom: Spacing.two },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderRadius: 20, paddingHorizontal: Spacing.three, paddingTop: 10, paddingBottom: 10, fontSize: 15 },
  send: { height: 40, borderRadius: 20, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
});
