import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ApiError } from '@/api/client';
import type { TicketInput } from '@/api/endpoints';
import { AttachmentPicker } from '@/components/attachments';
import { Button, Card, ErrorText, Field, Notice } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { PickedFile } from '@/lib/files';

type Props = {
  initial?: Partial<TicketInput>;
  existingAttachmentCount?: number;
  showAsset?: boolean;
  submitLabel: string;
  submitting: boolean;
  error: unknown;
  onSubmit: (input: TicketInput, files: PickedFile[]) => void;
};

// Shared by New Request and Edit Request. Priority, category and requestor
// details aren't asked for — Helpdesk classifies the request and the server
// fills in the employee's department from their profile.
export function TicketForm({ initial = {}, existingAttachmentCount = 0, showAsset = true, submitLabel, submitting, error, onSubmit }: Props) {
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [concern, setConcern] = useState(initial.concern ?? '');
  const [details, setDetails] = useState(initial.request_details ?? '');
  const [asset, setAsset] = useState(initial.asset ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const apiError = error instanceof ApiError ? error : null;

  const submit = () =>
    onSubmit(
      {
        subject: subject.trim(),
        concern: concern.trim(),
        request_details: details.trim() || null,
        ...(showAsset ? { asset: asset.trim() || null } : {}),
        location: location.trim() || null,
      },
      files,
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {showAsset ? (
          <Notice tone="info" icon="information-circle" text="Describe the problem — Helpdesk sets the category and priority, and your department is added automatically." />
        ) : null}
        <Card style={{ gap: Spacing.four }}>
          <Field label="Subject *" value={subject} onChangeText={setSubject} maxLength={255} placeholder="e.g. Printer not working" error={apiError?.fieldError('subject')} />
          <Field
            label="What's the problem? *"
            value={concern}
            onChangeText={setConcern}
            multiline
            placeholder="Describe what happened and what you were doing"
            error={apiError?.fieldError('concern')}
          />
          <Field label="More details" value={details} onChangeText={setDetails} multiline placeholder="Error messages, when it started, steps you tried" />
          {showAsset ? <Field label="Device / asset" value={asset} onChangeText={setAsset} maxLength={255} placeholder="e.g. Laptop LG-0231, 3F printer" /> : null}
          <Field label="Location" value={location} onChangeText={setLocation} maxLength={255} placeholder="e.g. 3F Accounting" error={apiError?.fieldError('location')} />
        </Card>
        <Card>
          <AttachmentPicker files={files} onChange={setFiles} existingCount={existingAttachmentCount} />
        </Card>
        <ErrorText message={apiError ? (Object.keys(apiError.errors).some((k) => k.startsWith('attachments')) ? 'One of the attachments was rejected — check its type and size.' : !Object.keys(apiError.errors).length ? apiError.message : null) : error ? 'Something went wrong. Please try again.' : null} />
        <Button title={submitLabel} icon="send" onPress={submit} loading={submitting} disabled={!subject.trim() || !concern.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.seven },
});
