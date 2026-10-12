import { loadAchievements } from './achievements';
import { buildExport, EXPORT_FORMAT, EXPORT_SCHEMA_VERSION, exportFileName, serializeExport } from './export';
import { openStorage, type Storage } from './storage/storage';
import { createTestDatabase } from './storage/testDatabase';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const dune = { isbn: '9780441172719', title: 'Dune', authors: ['Frank Herbert'], genres: ['Science Fiction'], pageCount: 412 };
const emma = { isbn: '9780141439587', title: 'Emma', authors: ['Jane Austen'], genres: ['Romance'] };

/** A Reader with something of everything: the point of an Export is that nothing is left behind. */
async function populatedReader(): Promise<Storage> {
  const storage = await openStorage(createTestDatabase());
  await storage.library.add(dune);
  await storage.library.add(emma);
  await storage.library.recordPage(dune.isbn, 412, new Date('2026-05-30T10:00:00.000Z')); // finishes Dune
  await storage.library.recordPage(emma.isbn, 40);
  await storage.library.setFavorite(dune.isbn, true);
  await storage.reviews.save(dune.isbn, { rating: 5, comment: 'Superb.' }, new Date('2026-05-30T11:00:00.000Z'));
  await storage.sessions.addManual(dune.isbn, new Date('2026-05-29T20:00:00.000Z'), new Date('2026-05-29T21:00:00.000Z'), NOW);
  await storage.sessions.start(emma.isbn, new Date('2026-06-01T11:00:00.000Z'));
  await storage.goals.setYearlyBooks(12);
  await storage.goals.setDailyMinutes(30);
  await loadAchievements(storage, NOW, 'Europe/Brussels');
  await storage.dismissals.add('9780553283686', new Date('2026-05-31T10:00:00.000Z'));
  return storage;
}

describe('export', () => {
  it('says what it is and which version of the format it uses, so a future app can read it', async () => {
    const file = await buildExport(await populatedReader(), NOW);

    expect(file.format).toBe(EXPORT_FORMAT);
    expect(file.format).toBe('novelry-export');
    expect(file.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(file.schemaVersion).toBe(1);
    expect(file.exportedAt).toBe('2026-06-01T12:00:00.000Z');
  });

  it('contains everything the Reader has: Library, Books, Reviews, Sessions, Goals, Favorites and more', async () => {
    const file = await buildExport(await populatedReader(), NOW);

    expect(file.library).toEqual([
      { isbn: emma.isbn, shelf: 'reading', currentPage: 40, addedAt: expect.any(String) },
      { isbn: dune.isbn, shelf: 'read', currentPage: 412, addedAt: expect.any(String) },
    ]);
    expect(file.books).toEqual([emma, dune].sort((a, b) => a.isbn.localeCompare(b.isbn)));
    expect(file.reviews).toEqual([
      {
        isbn: dune.isbn,
        rating: 5,
        comment: 'Superb.',
        createdAt: '2026-05-30T11:00:00.000Z',
        updatedAt: '2026-05-30T11:00:00.000Z',
      },
    ]);
    expect(file.sessions).toEqual([
      { isbn: dune.isbn, startedAt: '2026-05-29T20:00:00.000Z', endedAt: '2026-05-29T21:00:00.000Z' },
      { isbn: emma.isbn, startedAt: '2026-06-01T11:00:00.000Z', endedAt: null }, // still running
    ]);
    expect(file.finishes).toEqual([{ isbn: dune.isbn, finishedAt: '2026-05-30T10:00:00.000Z' }]);
    expect(file.favorites).toEqual([dune.isbn]);
    expect(file.goals).toEqual({ yearlyBooks: 12, dailyMinutes: 30 });
    // finishing Dune earns first-book; an hour with Dune plus the hour so far with Emma earns first-hour
    expect(file.achievements.map((a) => a.id)).toEqual(['first-book', 'first-hour']);
    expect(file.achievements[0]).toMatchObject({ earnedAt: '2026-06-01T12:00:00.000Z', seen: false });
    expect(file.dismissedRecommendations).toEqual(['9780553283686']);
  });

  it('keeps history that outlives the Library: a removed Book’s finish, Review, Sessions and Favorite', async () => {
    const storage = await populatedReader();
    await storage.library.remove(dune.isbn);

    const file = await buildExport(storage, NOW);

    expect(file.library.map((entry) => entry.isbn)).toEqual([emma.isbn]);
    expect(file.finishes).toHaveLength(1);
    expect(file.reviews).toHaveLength(1);
    expect(file.sessions.filter((s) => s.isbn === dune.isbn)).toHaveLength(1);
    expect(file.favorites).toEqual([dune.isbn]);
    expect(file.books.map((b) => b.isbn)).toContain(dune.isbn);
  });

  it('is a valid, empty document for a Reader with nothing yet', async () => {
    const file = await buildExport(await openStorage(createTestDatabase()), NOW);

    expect(file).toEqual({
      format: 'novelry-export',
      schemaVersion: 1,
      exportedAt: '2026-06-01T12:00:00.000Z',
      library: [],
      books: [],
      reviews: [],
      sessions: [],
      finishes: [],
      favorites: [],
      goals: { yearlyBooks: null, dailyMinutes: null },
      achievements: [],
      dismissedRecommendations: [],
    });
  });

  it('does not include the device’s own row numbers, which mean nothing anywhere else', async () => {
    const text = serializeExport(await buildExport(await populatedReader(), NOW));

    expect(text).not.toMatch(/"id"\s*:\s*\d/);
  });

  it('serialises to JSON that reads back as the same document', async () => {
    const file = await buildExport(await populatedReader(), NOW);

    const text = serializeExport(file);

    expect(JSON.parse(text)).toEqual(file);
    expect(text).toContain('\n'); // readable if the Reader opens it
  });

  it('is the same every time for the same data and moment', async () => {
    const storage = await populatedReader();

    expect(serializeExport(await buildExport(storage, NOW))).toBe(serializeExport(await buildExport(storage, NOW)));
  });

  it('names the file by day, without anything private', () => {
    expect(exportFileName(NOW)).toBe('novelry-export-2026-06-01.json');
    expect(exportFileName(new Date('2027-01-09T23:59:59Z'))).toBe('novelry-export-2027-01-09.json');
  });
});
