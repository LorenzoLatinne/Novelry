import type { Shelf } from './shelf';
import type { LibraryEntryWithBook } from './storage/storage';

export type LibraryFilter = {
  /** Show only this Shelf; all Shelves when omitted. */
  shelf?: Shelf;
  /** Show only Books marked as Favorites. */
  favoritesOnly?: boolean;
  /** Free text matched against title and authors. */
  query?: string;
};

function plain(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** What the Reader sees in their Library once a Shelf and a search are applied. */
export function viewLibrary(items: LibraryEntryWithBook[], { shelf, favoritesOnly, query }: LibraryFilter): LibraryEntryWithBook[] {
  const needle = plain(query?.trim() ?? '');
  return items.filter(({ entry, book }) => {
    if (shelf && entry.shelf !== shelf) {
      return false;
    }
    if (favoritesOnly && !entry.favorite) {
      return false;
    }
    if (!needle) {
      return true;
    }
    const haystack = plain([entry.isbn, book?.title, ...(book?.authors ?? [])].join(' '));
    return haystack.includes(needle);
  });
}
