import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as staff from '@/api/staff';
import type { StaffTicketDetail } from '@/api/staff-types';
import type { UploadFile } from '@/api/types';

export const staffKeys = {
  all: ['staff'] as const,
  queue: (tab: string | null, search: string, sort: string) => ['staff', 'queue', tab, search, sort] as const,
  ticket: (id: string) => ['staff', 'ticket', id] as const,
  lookups: ['staff', 'lookups'] as const,
  inbox: ['staff', 'inbox'] as const,
};

export function useStaffQueue(tab: string | null, search: string, sort: string) {
  return useInfiniteQuery({
    queryKey: staffKeys.queue(tab, search, sort),
    queryFn: ({ pageParam }) =>
      staff.getQueue({ status: tab ?? undefined, search: search || undefined, sort, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    refetchInterval: 60_000,
  });
}

export function useStaffTicket(id: string) {
  return useQuery({ queryKey: staffKeys.ticket(id), queryFn: () => staff.getStaffTicket(id) });
}

// Pick-lists change rarely (SLA rules, assignees' capacity) — refreshed every few minutes.
export function useLookups(enabled = true) {
  return useQuery({ queryKey: staffKeys.lookups, queryFn: staff.getLookups, staleTime: 3 * 60_000, enabled });
}

// Runs an action; the fresh ticket from the response replaces the cached one
// and the queue lists refetch.
export function useStaffAction(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, values, files }: { action: string; values: staff.ActionValues; files?: UploadFile[] }) =>
      staff.runStaffAction(ticketId, action, values, files),
    onSuccess: ({ ticket }) => {
      queryClient.setQueryData<StaffTicketDetail>(staffKeys.ticket(ticketId), ticket);
      queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] });
      queryClient.invalidateQueries({ queryKey: staffKeys.lookups });
    },
  });
}

export function useInbox() {
  return useQuery({ queryKey: staffKeys.inbox, queryFn: () => staff.getInbox(), refetchInterval: 60_000 });
}
