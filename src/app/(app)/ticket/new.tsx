import { router } from 'expo-router';
import { Alert } from 'react-native';

import { createTicket } from '@/api/endpoints';
import { useTicketAction } from '@/api/queries';
import type { TicketInput } from '@/api/endpoints';
import { TicketForm } from '@/components/ticket-form';
import type { PickedFile } from '@/lib/files';

export default function NewRequestScreen() {
  const create = useTicketAction(({ input, files }: { input: TicketInput; files: PickedFile[] }) => createTicket(input, files));

  return (
    <TicketForm
      submitLabel="Submit request"
      submitting={create.isPending}
      error={create.error}
      onSubmit={(input, files) =>
        create.mutate(
          { input, files },
          {
            onSuccess: (ticket) => {
              router.replace({ pathname: '/ticket/[id]', params: { id: ticket.id } });
              Alert.alert('Request submitted', `Your ticket number is #${ticket.ticket_number}. Helpdesk will review it shortly.`);
            },
          },
        )
      }
    />
  );
}
