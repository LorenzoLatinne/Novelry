import fellowship from './__fixtures__/fellowship.json';
import searchTolkien from './__fixtures__/search-tolkien.json';
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

  it('asks Open Library for the right ISBN and identifies the app', async () => {
    const fetch = respondWith(fellowship);
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.getBookByIsbn('9780261102354');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('bibkeys=ISBN:9780261102354');
    expect(init.headers['User-Agent']).toMatch(/^Novelry\//);
  });

  it('reports the catalog as unavailable when the response is not valid JSON', async () => {
    const fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    })) as unknown as jest.Mock;
    const catalog = createOpenLibraryCatalog({ fetch });

    await expect(catalog.getBookByIsbn('9780261102354')).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });
});

describe('Open Library catalog: search', () => {
  it('returns matching Books, preferring each result’s ISBN-13', async () => {
    const catalog = createOpenLibraryCatalog({ fetch: respondWith(searchTolkien) });

    const { books, total } = await catalog.searchBooks('tolkien fellowship');

    expect(total).toBe(70);
    expect(books.map((b) => [b.title, b.isbn])).toEqual([
      ['The Fellowship of the Ring', '9781500410223'],
      ['The Lord of the Rings', '9780061917813'],
      ['The Two Towers', '9780345272591'],
    ]);
    expect(books[0]).toMatchObject({
      authors: ['J.R.R. Tolkien'],
      genres: ['Elves', 'Dwarves', 'evil', 'fear', 'hope'],
      pageCount: 492,
      publishedYear: 1954,
      coverUrl: 'https://covers.openlibrary.org/b/id/14627060-M.jpg',
    });
  });

  it('skips results that have no ISBN, since a Book is identified by its ISBN', async () => {
    const catalog = createOpenLibraryCatalog({
      fetch: respondWith({
        numFound: 2,
        docs: [
          { title: 'No ISBN anywhere', author_name: ['A. Writer'] },
          { title: 'Has one', author_name: ['B. Writer'], isbn: ['0261102354'] },
        ],
      }),
    });

    const { books, total } = await catalog.searchBooks('writer');

    expect(books.map((b) => b.title)).toEqual(['Has one']);
    expect(total).toBe(2);
  });

  it('returns nothing, without asking Open Library, for a blank query', async () => {
    const fetch = respondWith(searchTolkien);
    const catalog = createOpenLibraryCatalog({ fetch });

    expect(await catalog.searchBooks('   ')).toEqual({ books: [], total: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns an empty result when nothing matches', async () => {
    const catalog = createOpenLibraryCatalog({ fetch: respondWith({ numFound: 0, docs: [] }) });

    expect(await catalog.searchBooks('zzzzqqqq')).toEqual({ books: [], total: 0 });
  });

  it('encodes the query, asks for the requested page and identifies the app', async () => {
    const fetch = respondWith({ numFound: 0, docs: [] });
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.searchBooks('war & peace', { page: 3 });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('q=war%20%26%20peace');
    expect(url).toContain('page=3');
    expect(init.headers['User-Agent']).toMatch(/^Novelry\//);
  });

  it('reports being offline, or the catalog being unavailable, like an ISBN lookup does', async () => {
    const offline = createOpenLibraryCatalog({
      fetch: jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    });
    const broken = createOpenLibraryCatalog({ fetch: respondWith({}, { ok: false, status: 500 }) });

    await expect(offline.searchBooks('tolkien')).rejects.toBeInstanceOf(CatalogOfflineError);
    await expect(broken.searchBooks('tolkien')).rejects.toBeInstanceOf(CatalogUnavailableError);
  });

  it('does not ask Open Library twice for the same query and page', async () => {
    const fetch = respondWith(searchTolkien);
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.searchBooks('tolkien');
    await catalog.searchBooks('  Tolkien ');
    await catalog.searchBooks('tolkien', { page: 2 });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('treats an invalid page number as the first page', async () => {
    const fetch = respondWith({ numFound: 0, docs: [] });
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.searchBooks('tolkien', { page: 0 });
    await catalog.searchBooks('hobbit', { page: Number.NaN });

    expect(fetch.mock.calls[0][0]).toContain('page=1');
    expect(fetch.mock.calls[1][0]).toContain('page=1');
  });

  it('copes with a response that has no usable results', async () => {
    const catalog = createOpenLibraryCatalog({ fetch: respondWith({ numFound: 3, docs: 'oops' }) });

    expect(await catalog.searchBooks('tolkien')).toEqual({ books: [], total: 3 });
  });
});

describe('Open Library catalog: search by subject', () => {
  const doc = (title: string, isbn: string) => ({ title, author_name: ['A. Writer'], isbn: [isbn], subject: ['Science Fiction'] });

  it('returns Books filed under a subject', async () => {
    const fetch = respondWith({ numFound: 2, docs: [doc('Hyperion', '9780553283686'), doc('Foundation', '9780553293357')] });
    const catalog = createOpenLibraryCatalog({ fetch });

    const { books } = await catalog.searchBySubject('Science Fiction');

    expect(books.map((b) => b.title)).toEqual(['Hyperion', 'Foundation']);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('subject=Science%20Fiction');
    expect(url).toContain('/search.json');
    expect(init.headers['User-Agent']).toMatch(/^Novelry\//);
  });

  it('does not ask twice for the same subject, however it is written', async () => {
    const fetch = respondWith({ numFound: 1, docs: [doc('Hyperion', '9780553283686')] });
    const catalog = createOpenLibraryCatalog({ fetch });

    await catalog.searchBySubject('Science Fiction');
    await catalog.searchBySubject('  science fiction ');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns nothing for a blank subject, without asking', async () => {
    const fetch = respondWith({});
    const catalog = createOpenLibraryCatalog({ fetch });

    expect(await catalog.searchBySubject('  ')).toEqual({ books: [], total: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports being offline, or the catalog being unavailable, like the other lookups', async () => {
    const offline = createOpenLibraryCatalog({ fetch: jest.fn().mockRejectedValue(new TypeError('x')) });
    const broken = createOpenLibraryCatalog({ fetch: respondWith({}, { ok: false, status: 500 }) });

    await expect(offline.searchBySubject('Romance')).rejects.toBeInstanceOf(CatalogOfflineError);
    await expect(broken.searchBySubject('Romance')).rejects.toBeInstanceOf(CatalogUnavailableError);
  });
});
