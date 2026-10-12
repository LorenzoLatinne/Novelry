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

/** What exporting needs from the phone: somewhere to put the file, and the system share sheet. */
export type ExportFileOps = {
  /** Writes the text to a new file in the app's cache and returns its location. */
  writeFile(name: string, text: string): string;
  removeFile(uri: string): void;
  /** Removes earlier export files from the cache, apart from the one at `keepUri`. */
  removeOldExports(keepUri: string): void;
  isSharingAvailable(): Promise<boolean>;
  share(uri: string): Promise<void>;
};

const EXPORT_FILE_PATTERN = /novelry-export-[^/]*\.json$/;

export const deviceFileOps: ExportFileOps = {
  writeFile(name, text) {
    const file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(text);
    return file.uri;
  },
  removeFile(uri) {
    new File(uri).delete();
  },
  removeOldExports(keepUri) {
    for (const entry of Paths.cache.list()) {
      if (EXPORT_FILE_PATTERN.test(entry.uri) && entry.uri !== keepUri) {
        entry.delete();
      }
    }
  },
  isSharingAvailable: () => Sharing.isAvailableAsync(),
  share: (uri) =>
    Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export your Novelry data',
    }),
};

/**
 * Writes the Reader's data to a file and opens the system share sheet, so they can save it to Files, a
 * cloud drive or send it to another phone.
 *
 * The data is read in a handful of queries, not one frozen snapshot: if the Reader changes something at the
 * very same moment the file may mix before and after. The file stays in the cache for the receiving app to
 * read, so it is removed at the next export (or at once if this one fails).
 */
export async function exportAndShare(storage: Storage, now = new Date(), ops: ExportFileOps = deviceFileOps): Promise<void> {
  const text = serializeExport(await buildExport(storage, now));

  const uri = ops.writeFile(exportFileName(now), text);
  try {
    ops.removeOldExports(uri);
    if (!(await ops.isSharingAvailable())) {
      throw new SharingUnavailableError();
    }
    await ops.share(uri);
  } catch (error) {
    try {
      ops.removeFile(uri); // never leave a copy of the Reader's history behind after a failure
    } catch {
      // nothing more we can do
    }
    throw error;
  }
}
