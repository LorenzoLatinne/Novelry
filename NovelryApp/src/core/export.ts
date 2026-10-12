import type { Book } from './catalog/book';
import type { Shelf } from './shelf';
import type { Review, Storage } from './storage/storage';

/** What the file says it is, so Novelry can tell it from any other JSON. */
export const EXPORT_FORMAT = 'novelry-export';
/** Version of the file layout (not of the database). Raise it when the layout changes in a way old readers cannot handle. */
export const EXPORT_SCHEMA_VERSION = 1;

/**
 * Everything the Reader owns, in one document, to back up or to move to another phone. It holds no
 * device-specific numbers (row ids), so it means the same wherever it is read.
 */
export type ExportFile = {
  format: typeof EXPORT_FORMAT;
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  library: { isbn: string; shelf: Shelf; currentPage: number; addedAt: string }[];
  /** The details of every Book the device knows, so the Library looks the same on the new phone before it is online. */
  books: Book[];
  reviews: Review[];
  /** A session with no end time was still running when the file was made. */
  sessions: { isbn: string; startedAt: string; endedAt: string | null }[];
  finishes: { isbn: string; finishedAt: string }[];
  favorites: string[];
  goals: { yearlyBooks: number | null; dailyMinutes: number | null };
  achievements: { id: string; earnedAt: string; seen: boolean }[];
  dismissedRecommendations: string[];
};

export async function buildExport(storage: Storage, now: Date): Promise<ExportFile> {
  const [entries, books, reviews, sessions, finishes, favorites, yearlyBooks, dailyMinutes, achievements, dismissed] =
    await Promise.all([
      storage.library.list(),
      storage.books.all(),
      storage.reviews.all(),
      storage.sessions.all(),
      storage.library.finishes(),
      storage.library.favoriteIsbns(),
      storage.goals.getYearlyBooks(),
      storage.goals.getDailyMinutes(),
      storage.achievements.all(),
      storage.dismissals.all(),
    ]);

  return {
    format: EXPORT_FORMAT,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    library: entries
      .map(({ isbn, shelf, currentPage, addedAt }) => ({ isbn, shelf, currentPage, addedAt }))
      .sort((a, b) => a.isbn.localeCompare(b.isbn)),
    books,
    reviews: [...reviews].sort((a, b) => a.isbn.localeCompare(b.isbn)),
    sessions: sessions.map(({ isbn, startedAt, endedAt }) => ({ isbn, startedAt, endedAt })),
    finishes,
    favorites,
    goals: { yearlyBooks, dailyMinutes },
    achievements,
    dismissedRecommendations: dismissed,
  };
}

/** The file's text. Indented, so the Reader can open and read it. */
export function serializeExport(file: ExportFile): string {
  return JSON.stringify(file, null, 2);
}

/** E.g. novelry-export-2026-06-01.json. Only the day, nothing about the Reader or the phone. */
export function exportFileName(now: Date): string {
  return `novelry-export-${now.toISOString().slice(0, 10)}.json`;
}
