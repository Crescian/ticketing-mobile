import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import { authHeaders } from '@/api/client';
import type { UploadFile } from '@/api/types';

// Same limits the server enforces on ticket attachments.
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const TICKET_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export type PickedFile = UploadFile & { size?: number | null };

export class FilePickError extends Error {}

function fromImageAsset(asset: ImagePicker.ImagePickerAsset, index: number): PickedFile {
  const type = asset.mimeType ?? 'image/jpeg';
  const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}-${index}.${extension}`,
    type,
    size: asset.fileSize,
  };
}

// Phone photos are often 3–8 MB; 0.7 keeps them sharp but well under the limit.
const PHOTO_QUALITY = 0.7;

export async function takePhoto(): Promise<PickedFile[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new FilePickError('Camera access is needed to take a photo. You can allow it in Settings.');

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: PHOTO_QUALITY });
  return result.canceled ? [] : result.assets.map(fromImageAsset);
}

export async function pickPhotos(limit: number): Promise<PickedFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: PHOTO_QUALITY,
  });
  return result.canceled ? [] : result.assets.map(fromImageAsset);
}

export async function pickDocuments(types: string[] = TICKET_FILE_TYPES): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({ type: types, multiple: true, copyToCacheDirectory: true });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/octet-stream',
    size: asset.size,
  }));
}

// Rejects files the server would refuse anyway, with a message the user can act on.
export function checkFiles(existing: PickedFile[], added: PickedFile[]): PickedFile[] {
  const tooBig = added.find((f) => f.size && f.size > MAX_FILE_BYTES);
  if (tooBig) throw new FilePickError(`"${tooBig.name}" is larger than 10 MB.`);
  if (existing.length + added.length > MAX_FILES) throw new FilePickError(`You can attach up to ${MAX_FILES} files.`);
  return [...existing, ...added];
}

// Attachments and service reports need the Bearer token, so they can't be
// opened as plain links: download to the cache, then hand the file to the
// system share sheet ("Open with…", save, send).
export async function openProtectedFile(url: string, fileName: string, mimeType?: string | null) {
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const destination = new File(Paths.cache, safeName);
  if (destination.exists) destination.delete();

  const task = File.createDownloadTask(url, destination, { headers: authHeaders() });
  const file = await task.downloadAsync();
  if (!file) throw new FilePickError('Download failed. Please try again.');

  if (!(await Sharing.isAvailableAsync())) throw new FilePickError('Opening files is not supported on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: mimeType ?? undefined, dialogTitle: fileName });
}
