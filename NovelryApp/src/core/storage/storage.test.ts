import type { Book } from '../catalog/book';
import { MIGRATIONS } from './migrations';
import { openStorage } from './storage';
import { createTestDatabase } from './testDatabase';

const fellowship: Book = {
  isbn: '9780261102354',
  title: 'The Fellowship of the Ring',
  authors: ['J.R.R. Tolkien'],
  genres: ['Fantasy', 'Fiction'],
  pageCount: 545,
  publishedYear: 1999,
  coverUrl: 'https://covers.openlibrary.org/b/id/14625638-M.jpg',
};

describe('storage', () => {
  it('migrates a fresh database and starts with an empty Library', async () => {
    const storage = await openStorage(createTestDatabase());

    expect(await storage.library.list()).toEqual([]);
    expect(await storage.schemaVersion()).toBe(MIGRATIONS.length);
  });

  it('keeps a Reader’s existing Library when migrating from an older version', async () => {
    const database = createTestDatabase();
    await openStorage(database, MIGRATIONS);
    await database.run(
      "INSERT INTO library_entries (isbn, shelf, current_page, added_at) VALUES ('9780261102354', 'reading', 120, '2026-01-05')",
    );

    const nextVersion = MIGRATIONS.length + 1;
    const storage = await openStorage(database, [
      ...MIGRATIONS,
      { version: nextVersion, sql: 'ALTER TABLE library_entries ADD COLUMN notes TEXT' },
    ]);

    expect(await storage.schemaVersion()).toBe(nextVersion);
    expect(await storage.library.list()).toEqual([
      { isbn: '9780261102354', shelf: 'reading', currentPage: 120, addedAt: '2026-01-05' },
    ]);
  });

  it('refuses a database written by a newer version of the app', async () => {
    const database = createTestDatabase();
    await openStorage(database, [
      ...MIGRATIONS,
      { version: MIGRATIONS.length + 1, sql: 'CREATE TABLE future (id INTEGER)' },
    ]);

    await expect(openStorage(database)).rejects.toThrow(/newer version/i);
  });

  it('leaves the database untouched when a migration fails', async () => {
    const database = createTestDatabase();
    await openStorage(database);

    await expect(
      openStorage(database, [
        ...MIGRATIONS,
        {
          version: MIGRATIONS.length + 1,
          sql: 'CREATE TABLE half_done (id INTEGER); THIS IS NOT SQL;',
        },
      ]),
    ).rejects.toThrow();

    const storage = await openStorage(database);
    expect(await storage.schemaVersion()).toBe(MIGRATIONS.length);
    expect(
      await database.getAll("SELECT name FROM sqlite_master WHERE name = 'half_done'"),
    ).toEqual([]);
  });

  it('keeps rows when a migration rebuilds a table', async () => {
    const database = createTestDatabase();
    await openStorage(database, MIGRATIONS);
    await database.run(
      "INSERT INTO library_entries (isbn, shelf, current_page, added_at) VALUES ('9780261102354', 'read', 300, '2026-02-01')",
    );

    const storage = await openStorage(database, [
      ...MIGRATIONS,
      {
        version: MIGRATIONS.length + 1,
        sql: `
          CREATE TABLE library_entries_new (
            isbn TEXT PRIMARY KEY NOT NULL,
            shelf TEXT NOT NULL,
            current_page INTEGER NOT NULL DEFAULT 0,
            added_at TEXT NOT NULL,
            favorite INTEGER NOT NULL DEFAULT 0
          );
          INSERT INTO library_entries_new (isbn, shelf, current_page, added_at)
            SELECT isbn, shelf, current_page, added_at FROM library_entries;
          DROP TABLE library_entries;
          ALTER TABLE library_entries_new RENAME TO library_entries;
        `,
      },
    ]);

    expect(await storage.library.list()).toEqual([
      { isbn: '9780261102354', shelf: 'read', currentPage: 300, addedAt: '2026-02-01' },
    ]);
  });

  it('rejects a migration list with gaps or duplicates', async () => {
    const database = createTestDatabase();
    await expect(
      openStorage(database, [
        { version: 1, sql: 'CREATE TABLE a (id INTEGER)' },
        { version: 3, sql: 'CREATE TABLE b (id INTEGER)' },
      ]),
    ).rejects.toThrow(/consecutive/i);
    await expect(
      openStorage(database, [
        { version: 1, sql: 'CREATE TABLE a (id INTEGER)' },
        { version: 1, sql: 'CREATE TABLE b (id INTEGER)' },
      ]),
    ).rejects.toThrow(/consecutive/i);
  });

  it('reports a stored Shelf it does not recognize instead of passing it on', async () => {
    const database = createTestDatabase();
    const storage = await openStorage(database);
    await database.run(
      "INSERT INTO library_entries (isbn, shelf, current_page, added_at) VALUES ('9780261102354', 'Completed', 0, '2026-02-01')",
    );

    await expect(storage.library.list()).rejects.toThrow(/shelf/i);
  });

  describe('adding a Book to the Library', () => {
    it('puts the Book on the Want to read Shelf', async () => {
      const storage = await openStorage(createTestDatabase());

      await storage.library.add(fellowship);

      expect(await storage.library.list()).toEqual([
        {
          isbn: '9780261102354',
          shelf: 'want-to-read',
          currentPage: 0,
          addedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      ]);
    });

    it('does not duplicate or reset a Book that is already in the Library', async () => {
      const database = createTestDatabase();
      const storage = await openStorage(database);
      await storage.library.add(fellowship);
      await database.run("UPDATE library_entries SET shelf = 'reading', current_page = 80");

      await storage.library.add(fellowship);

      const entries = await storage.library.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ shelf: 'reading', currentPage: 80 });
    });

    it('remembers the Book on the device so it can be shown without internet', async () => {
      const storage = await openStorage(createTestDatabase());

      await storage.library.add(fellowship);

      expect(await storage.books.get('9780261102354')).toEqual(fellowship);
      expect(await storage.books.get('9780000000002')).toBeNull();
    });

    it('keeps richer details already saved when the same Book is added again with fewer', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add({ ...fellowship, description: 'A hobbit sets out.' });

      await storage.library.add({ isbn: fellowship.isbn, title: fellowship.title, authors: [], genres: [] });

      expect(await storage.books.get(fellowship.isbn)).toMatchObject({
        description: 'A hobbit sets out.',
        pageCount: 545,
        authors: fellowship.authors,
      });
    });

    it('saves nothing when adding a Book fails part-way', async () => {
      const database = createTestDatabase();
      const failing = {
        ...database,
        async run(sql: string, params?: (string | number | null)[]) {
          if (sql.includes('INTO library_entries')) {
            throw new Error('disk full');
          }
          return database.run(sql, params);
        },
      };
      const storage = await openStorage(failing);

      await expect(storage.library.add(fellowship)).rejects.toThrow('disk full');

      expect(await storage.books.get(fellowship.isbn)).toBeNull();
    });

    it('finds the Library Entry for a Book, or none', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);

      expect(await storage.library.find('9780261102354')).toMatchObject({ shelf: 'want-to-read' });
      expect(await storage.library.find('9780000000002')).toBeNull();
    });
  });
});
