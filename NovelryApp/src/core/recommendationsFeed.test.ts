import { CatalogOfflineError, createOpenLibraryCatalog } from './catalog/openLibraryCatalog';
import { loadRecommendations } from './recommendationsFeed';
import { openStorage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const NOW = new Date('2026-06-01T12:00:00Z');
const dune = { isbn: '9780441172719', title: 'Dune', authors: ['Frank Herbert'], genres: ['Science Fiction', 'Desert'] };

const doc = (title: string, isbn: string, subject: string[]) => ({
  title,
  author_name: ['Some Author'],
  isbn: [isbn],
  subject,
});

/** A fake Open Library that answers subject searches from a table. */
function fakeOpenLibrary(bySubject: Record<string, ReturnType<typeof doc>[]>) {
  return jest.fn(async (url: string) => {
    const subject = decodeURIComponent(url.match(/subject=([^&]+)/)![1]).toLowerCase();
    const docs = bySubject[subject] ?? [];
    return { ok: true, status: 200, json: async () => ({ numFound: docs.length, docs }) };
  });
}

async function readerWhoFinishedDune() {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add(dune);
  await storage.library.moveToShelf(dune.isbn, 'read', new Date('2026-05-30T10:00:00Z'));
  await storage.reviews.save(dune.isbn, { rating: 5, comment: '' }, new Date('2026-05-30T11:00:00Z'));
  return storage;
}

describe('loadRecommendations', () => {
  it('has nothing to go on for a Reader who has not finished, rated or favorited anything', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add(dune);
    const fetch = fakeOpenLibrary({});

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result).toEqual({ status: 'no-taste' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('looks up Books in the genres the Reader likes best, and recommends the best fits with reasons', async () => {
    const storage = await readerWhoFinishedDune();
    const fetch = fakeOpenLibrary({
      'science fiction': [
        doc('Hyperion', '9780553283686', ['Science Fiction', 'Desert']),
        doc('Persuasion', '9780141439686', ['Romance']),
      ],
      desert: [doc('The Sheltering Sky', '9780141185484', ['Desert'])],
    });

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      return;
    }
    expect(result.recommendations.map((r) => r.book.title)).toEqual(['Hyperion', 'The Sheltering Sky']);
    expect(result.recommendations[0].reason).toBe('Because you rated “Dune” 5 stars · Science Fiction');
    const asked = fetch.mock.calls.map(([url]) => decodeURIComponent(url).toLowerCase());
    expect(asked.some((url) => url.includes('subject=science fiction'))).toBe(true);
  });

  it('never recommends a Book already in the Library, even one only added', async () => {
    const storage = await readerWhoFinishedDune();
    await storage.library.add({ isbn: '9780553283686', title: 'Hyperion', authors: [], genres: [] });
    const fetch = fakeOpenLibrary({
      'science fiction': [
        doc('Hyperion', '9780553283686', ['Science Fiction']),
        doc('Neuromancer', '9780441569595', ['Science Fiction']),
      ],
    });

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result.status === 'ok' && result.recommendations.map((r) => r.book.title)).toEqual(['Neuromancer']);
  });

  it('never brings back a Book the Reader dismissed', async () => {
    const storage = await readerWhoFinishedDune();
    await storage.dismissals.add('9780441569595');
    const fetch = fakeOpenLibrary({
      'science fiction': [
        doc('Neuromancer', '9780441569595', ['Science Fiction']),
        doc('Hyperion', '9780553283686', ['Science Fiction']),
      ],
    });

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result.status === 'ok' && result.recommendations.map((r) => r.book.title)).toEqual(['Hyperion']);
  });

  it('says so when nothing fits, which is different from having no taste yet', async () => {
    const storage = await readerWhoFinishedDune();
    const fetch = fakeOpenLibrary({ 'science fiction': [doc('Persuasion', '9780141439686', ['Romance'])] });

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result).toEqual({ status: 'none' });
  });

  it('still recommends from the genres that answered when one lookup fails', async () => {
    const storage = await readerWhoFinishedDune();
    const fetch = jest.fn(async (url: string) => {
      if (/subject=desert/i.test(url)) {
        throw new TypeError('Network request failed');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ numFound: 1, docs: [doc('Hyperion', '9780553283686', ['Science Fiction'])] }),
      };
    });

    const result = await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(result.status === 'ok' && result.recommendations.map((r) => r.book.title)).toEqual(['Hyperion']);
  });

  it('reports being offline when no lookup could be made', async () => {
    const storage = await readerWhoFinishedDune();
    const catalog = createOpenLibraryCatalog({ fetch: jest.fn().mockRejectedValue(new TypeError('Network request failed')) });

    await expect(loadRecommendations({ storage, catalog }, NOW)).rejects.toBeInstanceOf(CatalogOfflineError);
  });

  it('asks about at most the three genres the Reader likes best', async () => {
    const storage = await openStorage(createTestDatabase());
    await storage.library.add({ isbn: '1', title: 'Mix', authors: [], genres: ['A', 'B', 'C', 'D', 'E'] });
    await storage.library.setFavorite('1', true);
    const fetch = fakeOpenLibrary({});

    await loadRecommendations({ storage, catalog: createOpenLibraryCatalog({ fetch }) }, NOW);

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
