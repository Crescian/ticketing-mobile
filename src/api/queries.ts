import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';

import * as endpoints from '@/api/endpoints';
import type { Message, TicketDetail, TicketPhase, UploadFile, User } from '@/api/types';

// Query keys — every ticket mutation refreshes the list, the tab counts and
// the ticket itself, so the screens never disagree.
export const keys = {
  tickets: ['tickets'] as const,
  ticketList: (status: TicketPhase, search: string) => ['tickets', 'list', status, search] as const,
  counts: ['tickets', 'counts'] as const,
  ticket: (id: string) => ['tickets', 'detail', id] as const,
  unread: ['messages', 'unread'] as const,
  messages: (ticketId: string) => ['messages', ticketId] as const,
};

// While a chat is open it checks for IT's replies this often (paused when the
// app is in the background — see the focusManager setup in app/_layout.tsx).
const CHAT_POLL_MS = 10_000;
const UNREAD_POLL_MS = 60_000;

export function useTicketCounts() {
  return useQuery({ queryKey: keys.counts, queryFn: endpoints.getTicketCounts });
}

export function useTicketList(status: TicketPhase, search: string) {
  return useInfiniteQuery({
    queryKey: keys.ticketList(status, search),
    queryFn: ({ pageParam }) => endpoints.getTickets({ status, search: search || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: keys.ticket(id), queryFn: () => endpoints.getTicket(id) });
}

// Wraps a ticket action: on success the returned ticket replaces the cached
// detail and every list/count is refetched.
export function useTicketAction<Args>(action: (args: Args) => Promise<TicketDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (ticket) => {
      queryClient.setQueryData(keys.ticket(ticket.id), ticket);
      queryClient.invalidateQueries({ queryKey: keys.tickets });
    },
  });
}

export function useUnread() {
  return useQuery({ queryKey: keys.unread, queryFn: endpoints.getUnread, refetchInterval: UNREAD_POLL_MS });
}

// Fetching the messages also marks IT's messages as read on the server, so
// the unread badges are refreshed after each fetch.
export function useMessages(ticketId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: keys.messages(ticketId),
    queryFn: async () => {
      const previous = queryClient.getQueryData<ChatMessage[]>(keys.messages(ticketId));
      const messages = await endpoints.getMessages(ticketId);
      // Only when something new arrived (or on first open) — not every poll.
      if (!previous || previous.length !== messages.length) {
        queryClient.invalidateQueries({ queryKey: keys.unread });
        queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
      }
      return messages as ChatMessage[];
    },
    refetchInterval: CHAT_POLL_MS,
  });
}

export type ChatMessage = Message & { pending?: boolean; failed?: boolean };

// Sending shows the message straight away (marked pending) and swaps in the
// server's copy when it arrives; on failure the bubble is marked failed.
export function useSendMessage(ticketId: string, me: User | null) {
  const queryClient = useQueryClient();
  const key = keys.messages(ticketId);

  return useMutation({
    mutationFn: ({ text, files }: { text: string; files: UploadFile[]; tempId: string }) =>
      endpoints.sendMessage(ticketId, text, files),
    onMutate: async ({ text, files, tempId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const optimistic: ChatMessage = {
        id: tempId,
        message: text,
        sender: { id: me?.id ?? '', name: me?.name ?? 'You', role: me?.role ?? null, initials: '' },
        is_me: true,
        is_read: false,
        attachments: files.map((f, i) => ({ id: `${tempId}-${i}`, name: f.name, mime_type: f.type, size: null, size_label: '', url: f.uri })),
        created_at: new Date().toISOString(),
        pending: true,
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old = []) => [...old, optimistic]);
    },
    onSuccess: (saved, { tempId }) => {
      queryClient.setQueryData<ChatMessage[]>(key, (old = []) => old.map((m) => (m.id === tempId ? saved : m)));
    },
    onError: (_error, { tempId }) => {
      queryClient.setQueryData<ChatMessage[]>(key, (old = []) => old.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
    },
  });
}

// ── Updates feed (bell tab) ─────────────────────────────────────────────────
// The feed is the last 7 days of IT activity on the employee's requests.
// "New" means newer than the last time the Updates tab was opened, a
// timestamp kept on the phone.
const UPDATES_SEEN_KEY = 'updates_seen_at';
const FEED_POLL_MS = 60_000;

export const feedKeys = { feed: ['notifications'] as const, seen: ['notifications', 'seen'] as const };

export function useNotificationFeed() {
  return useQuery({ queryKey: feedKeys.feed, queryFn: () => endpoints.getNotifications(), refetchInterval: FEED_POLL_MS });
}

export function useUpdatesSeenAt() {
  return useQuery({ queryKey: feedKeys.seen, queryFn: () => SecureStore.getItemAsync(UPDATES_SEEN_KEY), staleTime: Infinity });
}

export function useMarkUpdatesSeen() {
  const queryClient = useQueryClient();
  return useCallback(
    async (serverTime: string) => {
      await SecureStore.setItemAsync(UPDATES_SEEN_KEY, serverTime);
      queryClient.setQueryData(feedKeys.seen, serverTime);
    },
    [queryClient],
  );
}

export function useNewUpdatesCount() {
  const feed = useNotificationFeed();
  const seenAt = useUpdatesSeenAt();
  if (!feed.data || seenAt.isPending) return 0;
  const since = seenAt.data ? new Date(seenAt.data).getTime() : 0;
  return feed.data.notifications.filter((n) => new Date(n.at).getTime() > since).length;
}

// "Available IT" — who on the IT team was active on the web in the last 5 minutes.
export function useITTeam() {
  return useQuery({ queryKey: ['it-team'], queryFn: endpoints.getITTeam, refetchInterval: 120_000 });
}
