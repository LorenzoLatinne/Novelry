import type { Book } from './catalog/book';
import { viewLibrary } from './libraryView';
import type { LibraryEntryWithBook } from './storage/storage';
import type { Shelf } from './shelf';

function item(
  isbn: string,
  shelf: Shelf,
  book: Partial<Book> | null,
  favorite = false,
): LibraryEntryWithBook {
  return {
    entry: { isbn, shelf, currentPage: 0, addedAt: '2026-01-01T00:00:00.000Z', favorite },
    book: book && { isbn, title: 'Untitled', authors: [], genres: [], ...book },
  };
}

const hobbit = item('1', 'read', { title: 'The Hobbit', authors: ['J.R.R. Tolkien'] });
const dune = item('2', 'reading', { title: 'Dune', authors: ['Frank Herbert'] }, true);
const emma = item('3', 'want-to-read', { title: 'Emma', authors: ['Jane Austen'] });
const unknown = item('4', 'want-to-read', null);
const all = [hobbit, dune, emma, unknown];

describe('viewLibrary', () => {
  it('shows everything when there is no filter or search', () => {
    expect(viewLibrary(all, {})).toEqual(all);
  });

  it('filters by Shelf', () => {
    expect(viewLibrary(all, { shelf: 'reading' })).toEqual([dune]);
    expect(viewLibrary(all, { shelf: 'want-to-read' })).toEqual([emma, unknown]);
  });

  it('searches titles and authors, ignoring case and surrounding spaces', () => {
    expect(viewLibrary(all, { query: '  hob ' })).toEqual([hobbit]);
    expect(viewLibrary(all, { query: 'HERBERT' })).toEqual([dune]);
  });

  it('shows only Favorites when asked', () => {
    expect(viewLibrary(all, { favoritesOnly: true })).toEqual([dune]);
    expect(viewLibrary(all, { favoritesOnly: false })).toEqual(all);
  });

  it('combines Favorites with a Shelf and a search', () => {
    expect(viewLibrary(all, { favoritesOnly: true, shelf: 'read' })).toEqual([]);
    expect(viewLibrary(all, { favoritesOnly: true, shelf: 'reading', query: 'herbert' })).toEqual([dune]);
  });

  it('combines a Shelf with a search', () => {
    expect(viewLibrary(all, { shelf: 'read', query: 'dune' })).toEqual([]);
    expect(viewLibrary(all, { shelf: 'read', query: 'tolkien' })).toEqual([hobbit]);
  });

  it('finds a Library Entry without saved Book details by its ISBN', () => {
    expect(viewLibrary(all, { query: '4' })).toEqual([unknown]);
    expect(viewLibrary([unknown], {})).toEqual([unknown]);
  });

  it('ignores accents when searching', () => {
    const bronte = item('5', 'read', { title: 'Jane Eyre', authors: ['Charlotte Brontë'] });

    expect(viewLibrary([bronte], { query: 'bronte' })).toEqual([bronte]);
    expect(viewLibrary([item('6', 'read', { title: 'Emma', authors: ['Jane Austen'] })], { query: 'brontë' })).toEqual([]);
  });
});
