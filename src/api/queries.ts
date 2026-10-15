import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as endpoints from '@/api/endpoints';
import type { TicketDetail, TicketPhase } from '@/api/types';

// Query keys — every ticket mutation refreshes the list, the tab counts and
// the ticket itself, so the screens never disagree.
export const keys = {
  tickets: ['tickets'] as const,
  ticketList: (status: TicketPhase, search: string) => ['tickets', 'list', status, search] as const,
  counts: ['tickets', 'counts'] as const,
  ticket: (id: string) => ['tickets', 'detail', id] as const,
  unread: ['messages', 'unread'] as const,
};

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
