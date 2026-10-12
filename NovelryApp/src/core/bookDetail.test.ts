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
});
