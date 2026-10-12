import type { Book } from '../catalog/book';
import { MIGRATIONS } from './migrations';
import {
  InvalidPageError,
  InvalidReviewError,
  InvalidSessionError,
  SessionAlreadyRunningError,
  openStorage,
} from './storage';
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
      { isbn: '9780261102354', shelf: 'reading', currentPage: 120, addedAt: '2026-01-05', favorite: false },
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
      { isbn: '9780261102354', shelf: 'read', currentPage: 300, addedAt: '2026-02-01', favorite: false },
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
          favorite: false,
        },
      ]);
    });

    it('does not duplicate or reset a Book that is already in the Library', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);
      await storage.library.moveToShelf(fellowship.isbn, 'reading');

      await storage.library.add(fellowship);

      const entries = await storage.library.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ shelf: 'reading' });
    });

    it('still works when moveToShelf is passed around on its own', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);
      const { moveToShelf } = storage.library;

      await moveToShelf(fellowship.isbn, 'read');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ shelf: 'read' });
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

    it('lists Library Entries together with their Books, oldest first', async () => {
      const database = createTestDatabase();
      const storage = await openStorage(database);
      await storage.library.add(fellowship);
      await database.run(
        "INSERT INTO library_entries (isbn, shelf, current_page, added_at) VALUES ('9780000000002', 'read', 10, '2000-01-01')",
      );

      const items = await storage.library.listWithBooks();

      expect(items.map((i) => [i.entry.isbn, i.book?.title ?? null])).toEqual([
        ['9780000000002', null],
        ['9780261102354', 'The Fellowship of the Ring'],
      ]);
    });

    it('moves a Book to another Shelf, and remembers it', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);

      await storage.library.moveToShelf(fellowship.isbn, 'reading');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ shelf: 'reading' });
    });

    it('refuses to move a Book that is not in the Library', async () => {
      const storage = await openStorage(createTestDatabase());

      await expect(storage.library.moveToShelf('9780000000002', 'read')).rejects.toThrow(
        /not in your Library/,
      );
    });

    it('removes a Book from the Library but keeps its details on the device', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);

      await storage.library.remove(fellowship.isbn);

      expect(await storage.library.find(fellowship.isbn)).toBeNull();
      expect(await storage.library.list()).toEqual([]);
      expect(await storage.books.get(fellowship.isbn)).toEqual(fellowship);
    });

    it('treats removing a Book that is not in the Library as done', async () => {
      const storage = await openStorage(createTestDatabase());

      await expect(storage.library.remove('9780000000002')).resolves.toBeUndefined();
    });

    it('starts a re-added Book afresh on Want to read', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);
      await storage.library.moveToShelf(fellowship.isbn, 'read');
      await storage.library.remove(fellowship.isbn);

      await storage.library.add(fellowship);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        shelf: 'want-to-read',
        currentPage: 0,
      });
    });

    it('keeps the page when the same Book is added again', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);
      await storage.library.recordPage(fellowship.isbn, 80);

      await storage.library.add(fellowship);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ currentPage: 80 });
    });

    it('finds the Library Entry for a Book, or none', async () => {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(fellowship);

      expect(await storage.library.find('9780261102354')).toMatchObject({ shelf: 'want-to-read' });
      expect(await storage.library.find('9780000000002')).toBeNull();
    });
  });

  describe('recording reading progress', () => {
    async function libraryWith(book: Book) {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(book);
      return storage;
    }

    it('moves a Book from Want to read to Reading when the first page is recorded', async () => {
      const storage = await libraryWith(fellowship);

      await storage.library.recordPage(fellowship.isbn, 12);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 12,
        shelf: 'reading',
      });
    });

    it('moves the Book to Read when the last page is reached', async () => {
      const storage = await libraryWith(fellowship);

      await storage.library.recordPage(fellowship.isbn, 545);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 545,
        shelf: 'read',
      });
    });

    it('moves a Read Book back to Reading when the page is lowered', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.recordPage(fellowship.isbn, 545);

      await storage.library.recordPage(fellowship.isbn, 300);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 300,
        shelf: 'reading',
      });
    });

    it('keeps the Shelf when page zero is recorded on a Book being read', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.recordPage(fellowship.isbn, 40);

      await storage.library.recordPage(fellowship.isbn, 0);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 0,
        shelf: 'reading',
      });
    });

    it('rejects pages past the end of the Book, below zero, or not whole numbers', async () => {
      const storage = await libraryWith(fellowship);

      await expect(storage.library.recordPage(fellowship.isbn, 546)).rejects.toBeInstanceOf(InvalidPageError);
      await expect(storage.library.recordPage(fellowship.isbn, 546)).rejects.toThrow(/between 0 and 545/);
      await expect(storage.library.recordPage(fellowship.isbn, -1)).rejects.toThrow(/between 0 and 545/);
      await expect(storage.library.recordPage(fellowship.isbn, 12.5)).rejects.toThrow(/whole number/);
      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 0,
        shelf: 'want-to-read',
      });
    });

    it('records any page for a Book with an unknown length, without finishing it', async () => {
      const storage = await libraryWith({ isbn: '9780000000002', title: 'Mystery', authors: [], genres: [] });

      await storage.library.recordPage('9780000000002', 1200);

      expect(await storage.library.find('9780000000002')).toMatchObject({
        currentPage: 1200,
        shelf: 'reading',
      });
    });

    it('refuses to record a page for a Book that is not in the Library', async () => {
      const storage = await openStorage(createTestDatabase());

      await expect(storage.library.recordPage('9780000000002', 5)).rejects.toThrow(/not in your Library/);
    });

    it('puts the page at the end when a Book is moved to Read', async () => {
      const storage = await libraryWith(fellowship);

      await storage.library.moveToShelf(fellowship.isbn, 'read');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ currentPage: 545, shelf: 'read' });
    });

    it('starts the page over when a Book is moved back to Want to read', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.recordPage(fellowship.isbn, 200);

      await storage.library.moveToShelf(fellowship.isbn, 'want-to-read');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({
        currentPage: 0,
        shelf: 'want-to-read',
      });
    });

    it('starts a finished Book over when it is moved back to Reading', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.moveToShelf(fellowship.isbn, 'read');

      await storage.library.moveToShelf(fellowship.isbn, 'reading');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ currentPage: 0, shelf: 'reading' });
    });

    it('keeps the page when a Book is moved to Reading', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.recordPage(fellowship.isbn, 200);

      await storage.library.moveToShelf(fellowship.isbn, 'reading');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ currentPage: 200, shelf: 'reading' });
    });
  });

  describe('Reading Sessions', () => {
    const T0 = new Date('2026-03-01T20:00:00.000Z');
    const T1 = new Date('2026-03-01T20:25:00.000Z');

    async function libraryWith(...books: Book[]) {
      const database = createTestDatabase();
      const storage = await openStorage(database);
      for (const book of books) {
        await storage.library.add(book);
      }
      return { database, storage };
    }
    const hobbit: Book = { isbn: '9780261103344', title: 'The Hobbit', authors: ['J.R.R. Tolkien'], genres: [] };

    it('starts a session on a Book in the Library, and it is running', async () => {
      const { storage } = await libraryWith(fellowship);

      await storage.sessions.start(fellowship.isbn, T0);

      expect(await storage.sessions.running()).toMatchObject({
        isbn: fellowship.isbn,
        startedAt: '2026-03-01T20:00:00.000Z',
        endedAt: null,
      });
    });

    it('is still running after the app restarts', async () => {
      const { database, storage } = await libraryWith(fellowship);
      await storage.sessions.start(fellowship.isbn, T0);

      const afterRestart = await openStorage(database);

      expect(await afterRestart.sessions.running()).toMatchObject({ isbn: fellowship.isbn, endedAt: null });
    });

    it('allows only one running session at a time', async () => {
      const { storage } = await libraryWith(fellowship, hobbit);
      await storage.sessions.start(fellowship.isbn, T0);

      await expect(storage.sessions.start(hobbit.isbn, T1)).rejects.toBeInstanceOf(SessionAlreadyRunningError);
      expect((await storage.sessions.running())?.isbn).toBe(fellowship.isbn);
    });

    it('stops the running session and keeps it in the Book’s history', async () => {
      const { storage } = await libraryWith(fellowship);
      await storage.sessions.start(fellowship.isbn, T0);

      const stopped = await storage.sessions.stop(T1);

      expect(stopped).toMatchObject({ startedAt: '2026-03-01T20:00:00.000Z', endedAt: '2026-03-01T20:25:00.000Z' });
      expect(await storage.sessions.running()).toBeNull();
      expect(await storage.sessions.list(fellowship.isbn)).toEqual([stopped]);
    });

    it('lets the next session start once the previous one is stopped', async () => {
      const { storage } = await libraryWith(fellowship, hobbit);
      await storage.sessions.start(fellowship.isbn, T0);
      await storage.sessions.stop(T1);

      await storage.sessions.start(hobbit.isbn, T1);

      expect((await storage.sessions.running())?.isbn).toBe(hobbit.isbn);
    });

    it('has nothing to stop when no session is running', async () => {
      const { storage } = await libraryWith(fellowship);

      await expect(storage.sessions.stop(T1)).rejects.toThrow(/No reading session is running/);
    });

    it('ends at the start time, with no time read, if the clock went backwards', async () => {
      const { storage } = await libraryWith(fellowship);
      await storage.sessions.start(fellowship.isbn, T1);

      const stopped = await storage.sessions.stop(T0);

      expect(stopped.endedAt).toBe(stopped.startedAt);
      expect(await storage.sessions.running()).toBeNull();
    });

    it('ends a running session when its Book is removed, so it cannot block the next one', async () => {
      const { storage } = await libraryWith(fellowship, hobbit);
      await storage.sessions.start(fellowship.isbn, T0);

      await storage.library.remove(fellowship.isbn);

      expect(await storage.sessions.running()).toBeNull();
      expect((await storage.sessions.list(fellowship.isbn))[0].endedAt).not.toBeNull();
      await expect(storage.sessions.start(hobbit.isbn, T1)).resolves.toMatchObject({ isbn: hobbit.isbn });
    });

    it('only starts sessions for Books in the Library', async () => {
      const { storage } = await libraryWith();

      await expect(storage.sessions.start(fellowship.isbn, T0)).rejects.toThrow(/not in your Library/);
    });

    it('adds a session the Reader forgot to time', async () => {
      const { storage } = await libraryWith(fellowship);
      const now = new Date('2026-03-02T09:00:00.000Z');

      const added = await storage.sessions.addManual(fellowship.isbn, T0, T1, now);

      expect(added).toMatchObject({
        isbn: fellowship.isbn,
        startedAt: '2026-03-01T20:00:00.000Z',
        endedAt: '2026-03-01T20:25:00.000Z',
      });
      expect(await storage.sessions.list(fellowship.isbn)).toEqual([added]);
      expect(await storage.sessions.running()).toBeNull();
    });

    it('can be added while another session is running', async () => {
      const { storage } = await libraryWith(fellowship, hobbit);
      await storage.sessions.start(hobbit.isbn, T1);

      await expect(
        storage.sessions.addManual(fellowship.isbn, T0, T1, new Date('2026-03-02T09:00:00.000Z')),
      ).resolves.toBeDefined();
      expect((await storage.sessions.running())?.isbn).toBe(hobbit.isbn);
    });

    it('rejects a manual session that does not end after it starts', async () => {
      const { storage } = await libraryWith(fellowship);
      const now = new Date('2026-03-02T09:00:00.000Z');

      await expect(storage.sessions.addManual(fellowship.isbn, T1, T0, now)).rejects.toBeInstanceOf(InvalidSessionError);
      await expect(storage.sessions.addManual(fellowship.isbn, T0, T0, now)).rejects.toBeInstanceOf(InvalidSessionError);
      expect(await storage.sessions.list(fellowship.isbn)).toEqual([]);
    });

    it('rejects a manual session that ends in the future', async () => {
      const { storage } = await libraryWith(fellowship);

      await expect(
        storage.sessions.addManual(fellowship.isbn, T0, T1, new Date('2026-03-01T20:10:00.000Z')),
      ).rejects.toThrow(/in the future/);
    });

    it('only adds manual sessions for Books in the Library', async () => {
      const { storage } = await libraryWith();

      await expect(
        storage.sessions.addManual(fellowship.isbn, T0, T1, new Date('2026-03-02T09:00:00.000Z')),
      ).rejects.toThrow(/not in your Library/);
    });

    it('deletes a session, and deleting a missing one is fine', async () => {
      const { storage } = await libraryWith(fellowship);
      const added = await storage.sessions.addManual(fellowship.isbn, T0, T1, new Date('2026-03-02T09:00:00.000Z'));

      await storage.sessions.remove(added.id);
      await storage.sessions.remove(added.id);

      expect(await storage.sessions.list(fellowship.isbn)).toEqual([]);
    });

    it('does not delete a session that is still running', async () => {
      const { storage } = await libraryWith(fellowship);
      const running = await storage.sessions.start(fellowship.isbn, T0);

      await storage.sessions.remove(running.id);

      expect(await storage.sessions.running()).toMatchObject({ id: running.id });
    });

    it('returns the session it added even when another is added straight after', async () => {
      const { storage } = await libraryWith(fellowship);
      const now = new Date('2026-03-02T09:00:00.000Z');

      const [first, second] = await Promise.all([
        storage.sessions.addManual(fellowship.isbn, T0, T1, now),
        storage.sessions.addManual(fellowship.isbn, T1, new Date('2026-03-01T21:00:00.000Z'), now),
      ]);

      expect(first.endedAt).toBe(T1.toISOString());
      expect(second.endedAt).toBe('2026-03-01T21:00:00.000Z');
    });

    it('lists every session across Books, oldest first, for totals', async () => {
      const { storage } = await libraryWith(fellowship, hobbit);
      const now = new Date('2026-03-02T09:00:00.000Z');
      await storage.sessions.addManual(hobbit.isbn, T1, new Date('2026-03-01T21:00:00.000Z'), now);
      await storage.sessions.addManual(fellowship.isbn, T0, T1, now);

      const all = await storage.sessions.all();

      expect(all.map((s) => s.isbn)).toEqual([fellowship.isbn, hobbit.isbn]);
    });

    it('keeps a Book’s sessions when the Book is removed from the Library', async () => {
      const { storage } = await libraryWith(fellowship);
      await storage.sessions.start(fellowship.isbn, T0);
      await storage.sessions.stop(T1);

      await storage.library.remove(fellowship.isbn);

      expect(await storage.sessions.list(fellowship.isbn)).toHaveLength(1);
    });
  });

  describe('Reviews', () => {
    const T0 = new Date('2026-04-01T10:00:00.000Z');
    const T1 = new Date('2026-04-02T18:30:00.000Z');

    async function libraryWith(book: Book) {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(book);
      return storage;
    }

    it('saves a Rating and a comment for a Book', async () => {
      const storage = await libraryWith(fellowship);

      await storage.reviews.save(fellowship.isbn, { rating: 4, comment: 'Slow start, great ending.' }, T0);

      expect(await storage.reviews.get(fellowship.isbn)).toEqual({
        isbn: fellowship.isbn,
        rating: 4,
        comment: 'Slow start, great ending.',
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-01T10:00:00.000Z',
      });
    });

    it('has no Review for a Book that was not reviewed', async () => {
      const storage = await libraryWith(fellowship);

      expect(await storage.reviews.get(fellowship.isbn)).toBeNull();
    });

    it('edits the one Review of a Book, keeping when it was first written', async () => {
      const storage = await libraryWith(fellowship);
      await storage.reviews.save(fellowship.isbn, { rating: 3, comment: 'Okay.' }, T0);

      await storage.reviews.save(fellowship.isbn, { rating: 5, comment: 'A classic.' }, T1);

      expect(await storage.reviews.get(fellowship.isbn)).toMatchObject({
        rating: 5,
        comment: 'A classic.',
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-02T18:30:00.000Z',
      });
    });

    it('allows a Rating without a comment, and trims the comment', async () => {
      const storage = await libraryWith(fellowship);

      await storage.reviews.save(fellowship.isbn, { rating: 2, comment: '' }, T0);
      expect(await storage.reviews.get(fellowship.isbn)).toMatchObject({ rating: 2, comment: '' });

      await storage.reviews.save(fellowship.isbn, { rating: 2, comment: '  spaced out  ' }, T0);
      expect((await storage.reviews.get(fellowship.isbn))?.comment).toBe('spaced out');
    });

    it('accepts only whole Ratings from 1 to 5', async () => {
      const storage = await libraryWith(fellowship);

      for (const rating of [0, 6, 3.5, Number.NaN, -1]) {
        await expect(storage.reviews.save(fellowship.isbn, { rating, comment: '' }, T0)).rejects.toBeInstanceOf(
          InvalidReviewError,
        );
      }
      expect(await storage.reviews.get(fellowship.isbn)).toBeNull();
    });

    it('accepts a comment of 500 characters but not 501', async () => {
      const storage = await libraryWith(fellowship);

      await expect(storage.reviews.save(fellowship.isbn, { rating: 3, comment: 'x'.repeat(500) }, T0)).resolves.toBeUndefined();
      await expect(storage.reviews.save(fellowship.isbn, { rating: 3, comment: 'x'.repeat(501) }, T0)).rejects.toThrow(
        /500 characters/,
      );
    });

    it('only reviews Books in the Library', async () => {
      const storage = await libraryWith(fellowship);

      await expect(storage.reviews.save('9780000000002', { rating: 3, comment: '' }, T0)).rejects.toThrow(
        /not in your Library/,
      );
    });

    it('deletes a Review, and deleting a missing one is fine', async () => {
      const storage = await libraryWith(fellowship);
      await storage.reviews.save(fellowship.isbn, { rating: 3, comment: 'Fine.' }, T0);

      await storage.reviews.remove(fellowship.isbn);
      await storage.reviews.remove(fellowship.isbn);

      expect(await storage.reviews.get(fellowship.isbn)).toBeNull();
    });

    it('keeps a Book’s Review when the Book is removed from the Library', async () => {
      const storage = await libraryWith(fellowship);
      await storage.reviews.save(fellowship.isbn, { rating: 5, comment: 'Loved it.' }, T0);

      await storage.library.remove(fellowship.isbn);

      expect(await storage.reviews.get(fellowship.isbn)).toMatchObject({ rating: 5, comment: 'Loved it.' });
    });

    it('lists every Review, newest first', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.add({ isbn: '9780000000002', title: 'Other', authors: [], genres: [] });
      await storage.reviews.save(fellowship.isbn, { rating: 4, comment: '' }, T0);
      await storage.reviews.save('9780000000002', { rating: 2, comment: '' }, T1);

      expect((await storage.reviews.all()).map((r) => r.isbn)).toEqual(['9780000000002', fellowship.isbn]);
    });
  });

  describe('Favorites', () => {
    async function libraryWith(book: Book) {
      const storage = await openStorage(createTestDatabase());
      await storage.library.add(book);
      return storage;
    }

    it('marks a Book as a Favorite, and unmarks it', async () => {
      const storage = await libraryWith(fellowship);
      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: false });

      await storage.library.setFavorite(fellowship.isbn, true);
      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: true });

      await storage.library.setFavorite(fellowship.isbn, false);
      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: false });
    });

    it('keeps a Favorite when the Book changes Shelf or progress', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.setFavorite(fellowship.isbn, true);

      await storage.library.recordPage(fellowship.isbn, 545);
      await storage.library.moveToShelf(fellowship.isbn, 'reading');

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: true });
    });

    it('keeps a Favorite when the same Book is added again', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.setFavorite(fellowship.isbn, true);

      await storage.library.add(fellowship);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: true });
    });

    it('is still a Favorite when the Book is removed and added back (ADR-0004: history is kept)', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.setFavorite(fellowship.isbn, true);
      await storage.library.remove(fellowship.isbn);
      expect(await storage.library.list()).toEqual([]);

      await storage.library.add(fellowship);

      expect(await storage.library.find(fellowship.isbn)).toMatchObject({ favorite: true });
    });

    it('lists the Favorite Books, including ones no longer in the Library', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.add({ isbn: '9780000000002', title: 'Other', authors: [], genres: [] });
      await storage.library.setFavorite(fellowship.isbn, true);
      await storage.library.remove(fellowship.isbn);

      expect(await storage.library.favoriteIsbns()).toEqual([fellowship.isbn]);
    });

    it('refuses to mark a Book that is not in the Library', async () => {
      const storage = await openStorage(createTestDatabase());

      await expect(storage.library.setFavorite('9780000000002', true)).rejects.toThrow(/not in your Library/);
    });

    it('shows up in listings with its Book', async () => {
      const storage = await libraryWith(fellowship);
      await storage.library.setFavorite(fellowship.isbn, true);

      const [item] = await storage.library.listWithBooks();

      expect(item.entry.favorite).toBe(true);
    });
  });
});
