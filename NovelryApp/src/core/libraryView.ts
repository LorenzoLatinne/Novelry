import type { Shelf } from './shelf';
import type { LibraryItem } from './storage/storage';

export type LibraryFilter = {
  /** Show only this Shelf; all Shelves when omitted. */
  shelf?: Shelf;
  /** Free text matched against title and authors. */
  query?: string;
};

/** What the Reader sees in their Library once a Shelf and a search are applied. */
export function viewLibrary(items: LibraryItem[], { shelf, query }: LibraryFilter): LibraryItem[] {
  const needle = query?.trim().toLowerCase();
  return items.filter(({ entry, book }) => {
    if (shelf && entry.shelf !== shelf) {
      return false;
    }
    if (!needle) {
      return true;
    }
    const haystack = [book?.title, ...(book?.authors ?? [])].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}
