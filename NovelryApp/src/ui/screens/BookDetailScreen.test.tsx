import { fireEvent, render, screen } from '@testing-library/react-native';
import fellowship from '../../core/catalog/__fixtures__/fellowship.json';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { AppServicesProvider } from '../AppServices';
import { BookDetailScreen } from './BookDetailScreen';

async function renderDetail(fetch: jest.Mock) {
  const storage = await openStorage(createTestDatabase());
  const catalog = createOpenLibraryCatalog({ fetch });
  await render(
    <AppServicesProvider services={{ storage, catalog }}>
      <BookDetailScreen isbn="9780261102354" />
    </AppServicesProvider>,
  );
  return storage;
}

describe('BookDetailScreen', () => {
  it('shows the Book and lets the Reader add it to their Library', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);

    expect(await screen.findByText('The Fellowship of the Ring')).toBeTruthy();
    expect(screen.getByText('J.R.R. Tolkien')).toBeTruthy();
    expect(screen.getByText('545 pages · First published 1999')).toBeTruthy();

    await fireEvent.press(screen.getByText('Add to Library'));

    expect(await screen.findByText('In your Library · Want to read')).toBeTruthy();
    expect(await storage.library.list()).toHaveLength(1);
  });

  it('explains when the Reader is offline and lets them retry', async () => {
    const fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await renderDetail(fetch);

    expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();

    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => fellowship });
    await fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('The Fellowship of the Ring')).toBeTruthy();
  });
});
