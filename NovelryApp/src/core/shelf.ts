export const SHELVES = ['want-to-read', 'reading', 'read'] as const;

export type Shelf = (typeof SHELVES)[number];

export const SHELF_LABELS: Record<Shelf, string> = {
  'want-to-read': 'Want to read',
  reading: 'Reading',
  read: 'Read',
};

export function isShelf(value: unknown): value is Shelf {
  return typeof value === 'string' && (SHELVES as readonly string[]).includes(value);
}
