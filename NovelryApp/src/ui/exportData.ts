import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildExport, exportFileName, serializeExport } from '../core/export';
import type { Storage } from '../core/storage/storage';

/** Sharing is not possible on this phone (for instance, no app can take a file). */
export class SharingUnavailableError extends Error {
  constructor() {
    super('This phone cannot share files right now.');
    this.name = 'SharingUnavailableError';
  }
}

/**
 * Writes the Reader's data to a file and opens the system share sheet, so they can save it to Files, a
 * cloud drive or send it to another phone. The file sits in the app's cache; the system may clear it later.
 */
export async function exportAndShare(storage: Storage, now = new Date()): Promise<void> {
  const text = serializeExport(await buildExport(storage, now));

  const file = new File(Paths.cache, exportFileName(now));
  file.create({ overwrite: true });
  file.write(text);

  if (!(await Sharing.isAvailableAsync())) {
    throw new SharingUnavailableError();
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Export your Novelry data',
  });
}
