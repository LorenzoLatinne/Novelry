import { isShelf, SHELF_LABELS, SHELVES } from './shelf';

describe('Shelf', () => {
  it('has a Reader-facing label for every Shelf', () => {
    expect(SHELVES.map((shelf) => SHELF_LABELS[shelf])).toEqual(['Want to read', 'Reading', 'Read']);
  });

  it('recognizes only valid Shelves', () => {
    expect(isShelf('reading')).toBe(true);
    expect(isShelf('Completed')).toBe(false);
    expect(isShelf(undefined)).toBe(false);
  });
});
