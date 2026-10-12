import fellowship from './__fixtures__/fellowship.json';
import {
  CatalogOfflineError,
  CatalogUnavailableError,
  createOpenLibraryCatalog,
} from './openLibraryCatalog';

function respondWith(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return jest.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  })) as unknown as jest.Mock;
}

describe('Open Library catalog: lookup by ISBN', () => {
  it('returns the Book for a known ISBN', async () => {
    const catalog = createOpenLibraryCatalog({ fetch: respondWith(fellowship) });

    expect(await catalog.getBookByIsbn('9780261102354')).toEqual({
      isbn: '9780261102354',
      title: 'The Fellowship of the Ring',
      authors: ['J.R.R. Tolkien'],
      genres: ['Elves', 'Dwarves', 'evil', 'fear', 'Fantasy'],
      pageCount: 545,
      publishedYear: 1999,
      coverUrl: 'https://covers.openlibrary.org/b/id/14625638-M.jpg',
    });
  });

  it('returns no match for an unknown ISBN', async () => {
    const catalog = createOpenLibraryCatalog({ fetch: respondWith({}) });

    expect(await catalog.getBookByIsbn('9780000000002')).toBeNull();
  });

  it('reports being offline when the network is unreachable', async () => {
    const catalog = createOpenLibraryCatalog({
      fetch: jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    });

    await expect(catalog.getBookByIsbn('9780261102354')).rejects.toBeInstanceOf(CatalogOfflineError);
  });

  it('reports the catalog as unavailable on a server error', async () => {
    const catalog = createOpenLibraryCatalog({
      fetch: respondWith({}, { ok: false, status: 503 }),
    });

    await expect(catalog.getBookByIsbn('9780261102354')).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it('does not ask Open Library twice for the same Book', async () => {
    const fetch = respondWith(fellowship);
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.getBookByIsbn('9780261102354');
    const again = await catalog.getBookByIsbn('9780261102354');

    expect(again?.title).toBe('The Fellowship of the Ring');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('accepts an ISBN typed with hyphens or spaces', async () => {
    const fetch = respondWith(fellowship);
    const catalog = createOpenLibraryCatalog({ fetch });

    const book = await catalog.getBookByIsbn('978-0-261 10235-4');

    expect(book?.isbn).toBe('9780261102354');
  });
});
