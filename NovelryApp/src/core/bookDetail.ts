import type { Book } from './catalog/book';
import type { BookCatalog } from './catalog/openLibraryCatalog';
import type { LibraryEntry, Storage } from './storage/storage';

export type BookDetail = {
  book: Book;
  /** The Reader's Library Entry for this Book, or null if it is not in their Library. */
  entry: LibraryEntry | null;
};

/**
 * Loads a Book for its detail screen. A Book the device already knows is shown
 * from the device (works offline); otherwise it is fetched from the catalog.
 */
export async function loadBookDetail(
  deps: { storage: Storage; catalog: BookCatalog },
  isbn: string,
): Promise<BookDetail | null> {
  const [saved, entry] = await Promise.all([
    deps.storage.books.get(isbn),
    deps.storage.library.find(isbn),
  ]);
  const book = saved ?? (await deps.catalog.getBookByIsbn(isbn));
  return book ? { book, entry } : null;
}
