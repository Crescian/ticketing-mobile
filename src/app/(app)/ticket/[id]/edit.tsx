import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { updateTicket, type TicketInput } from '@/api/endpoints';
import { useTicket, useTicketAction } from '@/api/queries';
import { TicketForm } from '@/components/ticket-form';
import { ErrorText } from '@/components/ui';
import type { PickedFile } from '@/lib/files';

// Only reachable while the ticket is still unacknowledged (can_edit); the
// server re-checks and answers 422 if Helpdesk got to it first.
export default function EditRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = useTicket(id);
  const update = useTicketAction(({ input, files }: { input: TicketInput; files: PickedFile[] }) => updateTicket(id, input, files));

  if (!ticket.data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {ticket.error ? <ErrorText message={ticket.error.message} /> : <ActivityIndicator />}
      </View>
    );
  }

  return (
    <TicketForm
      initial={ticket.data}
      existingAttachmentCount={ticket.data.attachments.length}
      showAsset={false}
      submitLabel="Save changes"
      submitting={update.isPending}
      error={update.error}
      onSubmit={(input, files) => update.mutate({ input, files }, { onSuccess: () => router.back() })}
    />
  );
}
