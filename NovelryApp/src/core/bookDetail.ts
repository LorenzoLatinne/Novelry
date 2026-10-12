import type { Book } from './catalog/book';
import type { BookCatalog } from './catalog/openLibraryCatalog';
import type { LibraryEntry, ReadingSession, Review, Storage } from './storage/storage';

export type BookDetail = {
  book: Book;
  /** The Reader's Library Entry for this Book, or null if it is not in their Library. */
  entry: LibraryEntry | null;
  /** The reading session that is running right now, for any Book, or null. */
  runningSession: ReadingSession | null;
  /** This Book's reading sessions, newest first. */
  sessions: ReadingSession[];
  /** The Reader's own Review of this Book, or null. */
  review: Review | null;
};

/**
 * Loads a Book for its detail screen. A Book the device already knows is shown
 * from the device (works offline); otherwise it is fetched from the catalog.
 */
export async function loadBookDetail(
  deps: { storage: Storage; catalog: BookCatalog },
  isbn: string,
): Promise<BookDetail | null> {
  const [saved, entry, runningSession, sessions, review] = await Promise.all([
    deps.storage.books.get(isbn),
    deps.storage.library.find(isbn),
    deps.storage.sessions.running(),
    deps.storage.sessions.list(isbn),
    deps.storage.reviews.get(isbn),
  ]);
  const book = saved ?? (await deps.catalog.getBookByIsbn(isbn));
  return book ? { book, entry, runningSession, sessions, review } : null;
}
