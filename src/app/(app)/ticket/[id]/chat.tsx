import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authHeaders } from '@/api/client';
import { keys, useMessages, useSendMessage, useTicket, type ChatMessage } from '@/api/queries';
import type { Attachment } from '@/api/types';
import { useSession } from '@/auth/session';
import { isEmployee } from '@/lib/roles';
import { fileIcon } from '@/components/attachments';
import { EmptyState, Txt, type IconName } from '@/components/ui';
import { Fonts, Radius, Spacing, Type } from '@/constants/theme';
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
  const staffView = !isEmployee(user?.role);
  // Employees open their own request; staff may be chatting on anyone's.
  const ticket = useTicket(staffView ? '' : id);
  const messages = useMessages(id);
  const send = useSendMessage(id, user);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);

  // Inverted list: newest at the bottom, next to the input.
  const data = useMemo(() => [...(messages.data ?? [])].reverse(), [messages.data]);
  const canSend = !!text.trim() || files.length > 0;

  const submit = () => {
    const body = text.trim();
    if (!canSend) return;
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
          <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />
        ) : (
          <FlatList
            inverted
            data={data}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <Bubble message={item} onRetry={() => restoreFailed(item)} />}
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }], flex: 1, justifyContent: 'center' }}>
                {messages.error ? (
                  <EmptyState icon="cloud-offline-outline" title="Couldn't load messages" message={messages.error.message} />
                ) : (
                  <EmptyState
                    icon="chatbubbles-outline"
                    title="No messages yet"
                    message={staffView ? 'Ask the requester for details or give them an update.' : 'Ask IT a question or add details about your request here.'}
                  />
                )}
              </View>
            }
          />
        )}

        <SafeAreaView edges={['bottom']} style={[styles.composer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
          {files.length ? (
            <View style={styles.pendingFiles}>
              {files.map((f, i) => (
                <Pressable
                  key={`${f.uri}-${i}`}
                  onPress={() => setFiles(files.filter((_, j) => j !== i))}
                  accessibilityLabel={`Remove ${f.name}`}
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                  <Ionicons name={fileIcon(f.name, f.type)} size={14} color={theme.primary} />
                  <Txt variant="caption" style={{ maxWidth: 140 }} numberOfLines={1}>{f.name}</Txt>
                  <Ionicons name="close" size={14} color={theme.danger} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {attachOpen ? (
            <View style={styles.attachRow}>
              <AttachOption icon="camera-outline" label="Camera" onPress={() => attach(takePhoto)} />
              <AttachOption icon="images-outline" label="Photos" onPress={() => attach(() => pickPhotos(5 - files.length))} />
              <AttachOption icon="document-text-outline" label="PDF" onPress={() => attach(() => pickDocuments(CHAT_DOCUMENT_TYPES))} />
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={attachOpen ? 'Close attachments' : 'Attach a file'}
              onPress={() => setAttachOpen((v) => !v)}
              style={[styles.roundButton, { backgroundColor: attachOpen ? theme.backgroundSelected : 'transparent' }]}>
              <Ionicons name={attachOpen ? 'close' : 'attach'} size={24} color={theme.primary} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={staffView ? 'Message the requester…' : 'Message IT…'}
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={1000}
              style={[Type.body, styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={submit}
              disabled={!canSend}
              style={[styles.roundButton, { backgroundColor: theme.primary, opacity: canSend ? 1 : 0.4 }]}>
              <Ionicons name="send" size={18} color={theme.onPrimary} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

function AttachOption({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.attachOption, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : theme.background }]}>
      <Ionicons name={icon} size={22} color={theme.primary} />
      <Txt variant="label">{label}</Txt>
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
          <Txt variant="label" style={{ fontSize: 12, color: theme.primary }}>{message.sender.initials}</Txt>
        </View>
      ) : null}
      <View style={{ maxWidth: '78%', gap: 3, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {!mine ? (
          <Txt variant="caption" color="textSecondary">
            <Txt variant="caption" style={{ fontFamily: Fonts.bold }}>{message.sender.name}</Txt>
            {message.sender.role ? ` · ${message.sender.role}` : ''}
          </Txt>
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
          {message.message ? <Txt style={{ color: mine ? theme.onPrimary : theme.text }}>{message.message}</Txt> : null}
        </View>
        {message.failed ? (
          <Pressable onPress={onRetry} hitSlop={8} style={styles.status}>
            <Ionicons name="alert-circle" size={13} color={theme.danger} />
            <Txt variant="caption" color="danger">Not sent — tap to edit and resend</Txt>
          </Pressable>
        ) : (
          <View style={styles.status} accessibilityLabel={formatDateTime(message.created_at)}>
            <Txt variant="caption" color="textMuted">{message.pending ? 'Sending…' : timeAgo(message.created_at)}</Txt>
            {mine && !message.pending ? (
              <Ionicons name={message.is_read ? 'checkmark-done' : 'checkmark'} size={14} color={message.is_read ? theme.success : theme.textMuted} />
            ) : null}
          </View>
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
  const fg = mine ? theme.onPrimary : theme.text;

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
    <Pressable onPress={open} disabled={local} accessibilityLabel={`Open ${attachment.name}`}>
      {isImage ? (
        <Image source={local ? { uri: attachment.url } : { uri: attachment.url, headers: authHeaders() }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.fileChip, { borderColor: mine ? 'rgba(255,255,255,0.4)' : theme.border }]}>
          <Ionicons name={fileIcon(attachment.name, attachment.mime_type)} size={18} color={fg} />
          <Txt variant="caption" style={{ color: fg, flexShrink: 1 }} numberOfLines={1}>{attachment.name}</Txt>
          {opening ? <ActivityIndicator color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.four, gap: Spacing.three, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: Radius.lg, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  image: { width: 210, height: 156, borderRadius: Radius.md },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.two, maxWidth: 230 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.two, paddingTop: Spacing.two, gap: Spacing.two },
  pendingFiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingHorizontal: Spacing.one },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: 5 },
  attachRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.one },
  attachOption: { flex: 1, alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.three },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingBottom: Spacing.two },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderWidth: 1, borderRadius: 21, paddingHorizontal: Spacing.four, paddingTop: 10, paddingBottom: 10 },
});
