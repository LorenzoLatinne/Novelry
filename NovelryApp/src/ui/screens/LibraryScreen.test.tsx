import { fireEvent, render, screen } from '@testing-library/react-native';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import type { Shelf } from '../../core/shelf';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

type TestBook = { isbn: string; title: string; author: string; shelf: Shelf };

async function openLibrary(books: TestBook[]) {
  const database = createTestDatabase();
  const storage = await openStorage(database);
  for (const { isbn, title, author, shelf } of books) {
    await storage.library.add({ isbn, title, authors: [author], genres: [] });
    await database.run('UPDATE library_entries SET shelf = ? WHERE isbn = ?', [shelf, isbn]);
  }
  const catalog = createOpenLibraryCatalog({ fetch: jest.fn() });
  await render(<RootNavigator services={{ storage, catalog }} />);
}

const LIBRARY: TestBook[] = [
  { isbn: '9780261102354', title: 'The Hobbit', author: 'J.R.R. Tolkien', shelf: 'read' },
  { isbn: '9780441172719', title: 'Dune', author: 'Frank Herbert', shelf: 'reading' },
  { isbn: '9780141439587', title: 'Emma', author: 'Jane Austen', shelf: 'want-to-read' },
];

describe('LibraryScreen', () => {
  it('shows an empty state for a new Library, without filters', async () => {
    await openLibrary([]);

    expect(await screen.findByText('Your Library is empty')).toBeTruthy();
    expect(screen.queryByLabelText('Search your Library')).toBeNull();
  });

  it('lists every Book, then narrows by Shelf', async () => {
    await openLibrary(LIBRARY);
    expect(await screen.findByText('The Hobbit')).toBeTruthy();
    expect(screen.getByText('Dune')).toBeTruthy();
    expect(screen.getByText('Emma')).toBeTruthy();

    await fireEvent.press(screen.getByRole('tab', { name: 'Reading' }));

    expect(screen.getByText('Dune')).toBeTruthy();
    expect(screen.queryByText('The Hobbit')).toBeNull();
    expect(screen.queryByText('Emma')).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'All' }));

    expect(screen.getByText('The Hobbit')).toBeTruthy();
    expect(screen.getByText('Emma')).toBeTruthy();
  });

  it('narrows by a search on title or author', async () => {
    await openLibrary(LIBRARY);
    await screen.findByText('The Hobbit');

    await fireEvent.changeText(screen.getByLabelText('Search your Library'), 'austen');

    expect(screen.getByText('Emma')).toBeTruthy();
    expect(screen.queryByText('Dune')).toBeNull();
  });

  it('says so when nothing matches, and recovers when the search is cleared', async () => {
    await openLibrary(LIBRARY);
    await screen.findByText('The Hobbit');

    await fireEvent.changeText(screen.getByLabelText('Search your Library'), 'zzzz');
    expect(screen.getByText(/No books match/)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Search your Library'), '');
    expect(screen.getByText('The Hobbit')).toBeTruthy();
  });
});
