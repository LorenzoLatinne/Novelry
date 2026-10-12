import { act, fireEvent, render, screen } from '@testing-library/react-native';
import fellowship from '../../core/catalog/__fixtures__/fellowship.json';
import searchTolkien from '../../core/catalog/__fixtures__/search-tolkien.json';
import { createOpenLibraryCatalog } from '../../core/catalog/openLibraryCatalog';
import { openStorage } from '../../core/storage/storage';
import { createTestDatabase } from '../../core/storage/testDatabase';
import { RootNavigator } from '../RootNavigator';

function fakeOpenLibrary(search: unknown) {
  return jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => {
      if (url.includes('/search.json')) {
        return search;
      }
      const requested = url.match(/bibkeys=(ISBN:\d+)/)![1];
      return { [requested]: fellowship['ISBN:9780261102354'] };
    },
  }));
}

async function openExplore(fetch: jest.Mock) {
  const storage = await openStorage(createTestDatabase());
  const catalog = createOpenLibraryCatalog({ fetch });
  await render(<RootNavigator services={{ storage, catalog }} />);
  await fireEvent.press(screen.getAllByText('Explore')[0]);
}

async function typeQuery(text: string) {
  await fireEvent.changeText(screen.getByLabelText('Search books'), text);
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
}

describe('ExploreScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows matching books and opens one on tap', async () => {
    const fetch = fakeOpenLibrary(searchTolkien);
    await openExplore(fetch);

    await typeQuery('tolkien');
    expect(await screen.findByText('The Two Towers')).toBeTruthy();

    await fireEvent.press(screen.getByText('The Two Towers'));

    expect(await screen.findByText('Add to Library')).toBeTruthy();
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('ISBN:9780345272591'),
      expect.anything(),
    );
  });

  it('waits until typing stops before asking Open Library', async () => {
    const fetch = fakeOpenLibrary(searchTolkien);
    await openExplore(fetch);

    await fireEvent.changeText(screen.getByLabelText('Search books'), 'tol');
    await fireEvent.changeText(screen.getByLabelText('Search books'), 'tolk');
    await typeQuery('tolkien');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=tolkien'), expect.anything());
  });

  it('says so when nothing matches', async () => {
    await openExplore(fakeOpenLibrary({ numFound: 0, docs: [] }));

    await typeQuery('zzzzqqqq');

    expect(await screen.findByText(/No books found/)).toBeTruthy();
  });

  it('explains when the Reader is offline', async () => {
    await openExplore(jest.fn().mockRejectedValue(new TypeError('Network request failed')));

    await typeQuery('tolkien');

    expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();
  });

  it('returns to the prompt when the query is cleared', async () => {
    await openExplore(fakeOpenLibrary(searchTolkien));
    await typeQuery('tolkien');
    await screen.findByText('The Two Towers');

    await fireEvent.changeText(screen.getByLabelText('Search books'), '');

    expect(screen.getByText('Search for a book by title or author.')).toBeTruthy();
    expect(screen.queryByText('The Two Towers')).toBeNull();
  });

  it('lets the Reader retry after a failed search', async () => {
    const fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await openExplore(fetch);
    await typeQuery('tolkien');
    await screen.findByText(/You seem to be offline/);

    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => searchTolkien });
    await fireEvent.press(screen.getByText('Try again'));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('The Two Towers')).toBeTruthy();
  });

  it('says search is unavailable when Open Library answers with an error', async () => {
    await openExplore(jest.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));

    await typeQuery('tolkien');

    expect(await screen.findByText(/Search is not available right now/)).toBeTruthy();
  });

  it('ignores a slow answer to an earlier query', async () => {
    let answerFirst: (value: unknown) => void = () => {};
    const slowFirst = new Promise((resolve) => {
      answerFirst = resolve;
    });
    const fetch = jest
      .fn()
      .mockImplementationOnce(() => slowFirst)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          numFound: 1,
          docs: [{ title: 'The Hobbit', author_name: ['J.R.R. Tolkien'], isbn: ['9780547928227'] }],
        }),
      });
    await openExplore(fetch);

    await typeQuery('tolkien');
    await typeQuery('hobbit');
    expect(await screen.findByText('The Hobbit')).toBeTruthy();

    await act(async () => {
      answerFirst({ ok: true, status: 200, json: async () => searchTolkien });
    });

    expect(screen.queryByText('The Two Towers')).toBeNull();
    expect(screen.getByText('The Hobbit')).toBeTruthy();
  });
});
