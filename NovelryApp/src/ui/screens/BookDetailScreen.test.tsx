import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
  afterEach(() => jest.restoreAllMocks());

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

  it('lets the Reader move a Book between Shelves', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('In your Library · Want to read');

    await fireEvent.press(screen.getByRole('radio', { name: 'Reading' }));

    expect(await screen.findByText('In your Library · Reading')).toBeTruthy();
    expect(await storage.library.find('9780261102354')).toMatchObject({ shelf: 'reading' });
  });

  it('removes a Book from the Library only after the Reader confirms', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));

    await fireEvent.press(await screen.findByText('Remove from Library'));
    expect(await storage.library.find('9780261102354')).not.toBeNull();

    const buttons = alert.mock.calls[0][2]!;
    await act(async () => buttons.find((b) => b.text === 'Remove')!.onPress!());

    expect(await screen.findByText('Add to Library')).toBeTruthy();
    expect(await storage.library.find('9780261102354')).toBeNull();
  });

  it('keeps the Book when the Reader cancels the removal', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await fireEvent.press(await screen.findByText('Remove from Library'));

    const cancel = alert.mock.calls[0][2]!.find((b) => b.text === 'Cancel')!;
    await act(async () => cancel.onPress?.());

    expect(await storage.library.find('9780261102354')).not.toBeNull();
    expect(screen.getByText('Remove from Library')).toBeTruthy();
  });

  it('tells the Reader when a Shelf change fails, and keeps the old Shelf', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('In your Library · Want to read');
    jest.spyOn(storage.library, 'moveToShelf').mockRejectedValue(new Error('disk full'));

    await fireEvent.press(screen.getByRole('radio', { name: 'Read' }));

    expect(await screen.findByText(/Could not move this book/)).toBeTruthy();
    expect(screen.getByText('In your Library · Want to read')).toBeTruthy();
  });

  it('records the current page and shows the progress', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('Your progress');

    await fireEvent.changeText(screen.getByLabelText('Current page'), '120');
    await fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText('22% read')).toBeTruthy();
    expect(await screen.findByText('In your Library · Reading')).toBeTruthy();
    expect(await storage.library.find('9780261102354')).toMatchObject({ currentPage: 120 });
  });

  it('finishes the Book when the last page is saved', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('Your progress');

    await fireEvent.changeText(screen.getByLabelText('Current page'), '545');
    await fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText('In your Library · Read')).toBeTruthy();
    expect(screen.getByText('100% read')).toBeTruthy();
  });

  it('asks for a valid page when the number is out of range', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('Your progress');

    await fireEvent.changeText(screen.getByLabelText('Current page'), '9999');
    await fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText('The page must be between 0 and 545.')).toBeTruthy();
    expect(await storage.library.find('9780261102354')).toMatchObject({ currentPage: 0 });
  });

  it('asks for a whole number when the page is not digits', async () => {
    const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => fellowship }));
    const storage = await renderDetail(fetch);
    await fireEvent.press(await screen.findByText('Add to Library'));
    await screen.findByText('Your progress');

    for (const text of ['', 'abc', '1e3', '12.5']) {
      await fireEvent.changeText(screen.getByLabelText('Current page'), text);
      await fireEvent.press(screen.getByText('Save'));
      expect(await screen.findByText('Enter the page you are on, as a whole number.')).toBeTruthy();
    }
    expect(await storage.library.find('9780261102354')).toMatchObject({ currentPage: 0 });
  });
});
