import fellowship from './catalog/__fixtures__/fellowship.json';
import { CatalogOfflineError, createOpenLibraryCatalog } from './catalog/openLibraryCatalog';
import { loadBookDetail } from './bookDetail';
import { openStorage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const ISBN = '9780261102354';

function catalogReturning(body: unknown) {
  const fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => body }));
  return { fetch, catalog: createOpenLibraryCatalog({ fetch }) };
}

describe('Book detail', () => {
  it('fetches a Book we have not seen and says it is not in the Library', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);

    const detail = await loadBookDetail({ storage, catalog }, ISBN);

    expect(detail?.book.title).toBe('The Fellowship of the Ring');
    expect(detail?.entry).toBeNull();
  });

  it('shows a Library Book from the device, without internet', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);
    const book = (await loadBookDetail({ storage, catalog }, ISBN))!.book;
    await storage.library.add(book);
    const offline = createOpenLibraryCatalog({
      fetch: jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    });

    const detail = await loadBookDetail({ storage, catalog: offline }, ISBN);

    expect(detail?.book.title).toBe('The Fellowship of the Ring');
    expect(detail?.entry).toMatchObject({ shelf: 'want-to-read' });
  });

  it('returns nothing for an unknown ISBN', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning({});

    expect(await loadBookDetail({ storage, catalog }, '9780000000002')).toBeNull();
  });

  it('reports being offline for a Book that was never saved', async () => {
    const storage = await openStorage(createTestDatabase());
    const offline = createOpenLibraryCatalog({
      fetch: jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    });

    await expect(loadBookDetail({ storage, catalog: offline }, ISBN)).rejects.toBeInstanceOf(
      CatalogOfflineError,
    );
  });

  it('reports the reading session that is running, if any', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);
    const book = (await loadBookDetail({ storage, catalog }, ISBN))!.book;
    await storage.library.add(book);
    expect((await loadBookDetail({ storage, catalog }, ISBN))?.runningSession).toBeNull();

    await storage.sessions.start(ISBN);

    expect((await loadBookDetail({ storage, catalog }, ISBN))?.runningSession).toMatchObject({ isbn: ISBN });
  });

  it('includes the Book’s reading sessions', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);
    const book = (await loadBookDetail({ storage, catalog }, ISBN))!.book;
    await storage.library.add(book);
    await storage.sessions.addManual(
      ISBN,
      new Date('2026-03-01T20:00:00Z'),
      new Date('2026-03-01T20:30:00Z'),
      new Date('2026-03-02T09:00:00Z'),
    );

    const detail = await loadBookDetail({ storage, catalog }, ISBN);

    expect(detail?.sessions).toHaveLength(1);
    expect(detail?.sessions[0]).toMatchObject({ endedAt: '2026-03-01T20:30:00.000Z' });
  });

  it('includes the Reader’s Review of the Book', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);
    const book = (await loadBookDetail({ storage, catalog }, ISBN))!.book;
    await storage.library.add(book);
    expect((await loadBookDetail({ storage, catalog }, ISBN))?.review).toBeNull();

    await storage.reviews.save(ISBN, { rating: 4, comment: 'Gripping.' });

    expect((await loadBookDetail({ storage, catalog }, ISBN))?.review).toMatchObject({
      rating: 4,
      comment: 'Gripping.',
    });
  });

  it('shows an earlier Review again when the Book is added back to the Library', async () => {
    const storage = await openStorage(createTestDatabase());
    const { catalog } = catalogReturning(fellowship);
    const book = (await loadBookDetail({ storage, catalog }, ISBN))!.book;
    await storage.library.add(book);
    await storage.reviews.save(ISBN, { rating: 5, comment: 'Loved it.' });
    await storage.library.remove(ISBN);
    await storage.library.add(book);

    const detail = await loadBookDetail({ storage, catalog }, ISBN);

    expect(detail?.review).toMatchObject({ rating: 5, comment: 'Loved it.' });
    expect(detail?.entry).toMatchObject({ shelf: 'want-to-read' });
  });
});
