import type { SqlDatabase } from './database';
import { MIGRATIONS, type Migration } from './migrations';
import type { Book } from '../catalog/book';
import { isShelf, type Shelf } from '../shelf';

export type LibraryEntry = {
  isbn: string;
  shelf: Shelf;
  currentPage: number;
  addedAt: string;
  /** Marked by the Reader as a Favorite. Survives the Book leaving the Library (ADR-0004). */
  favorite: boolean;
};

/** A Library Entry with its Book; the Book is null if its details were never saved. */
export type LibraryEntryWithBook = { entry: LibraryEntry; book: Book | null };

/** The page the Reader entered cannot be recorded (not a whole number, below zero or past the last page). */
export class InvalidPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPageError';
  }
}

/** The Reader's own Rating (1-5) and comment on a Book. Private: it never leaves the device. */
export type Review = {
  isbn: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_REVIEW_COMMENT_LENGTH = 500;

/** The Rating or comment given cannot be saved. */
export class InvalidReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReviewError';
  }
}

export interface Reviews {
  /** Writes or replaces a Book's one Review. The Book must be in the Library. */
  save(isbn: string, review: { rating: number; comment: string }, at?: Date): Promise<void>;
  get(isbn: string): Promise<Review | null>;
  /** Every Review, most recently changed first. */
  all(): Promise<Review[]>;
  /** Deletes a Book's Review. Deleting one that does not exist is a no-op. */
  remove(isbn: string): Promise<void>;
}

/** A timed stretch of reading on one Book. A session with no end time is still running. */
export type ReadingSession = {
  id: number;
  isbn: string;
  startedAt: string;
  endedAt: string | null;
};

/** The Reader tried to start a session while another one is already running. */
export class SessionAlreadyRunningError extends Error {
  constructor() {
    super('Another reading session is already running. Stop it first.');
    this.name = 'SessionAlreadyRunningError';
  }
}

/** The times given for a manually added session cannot be recorded. */
export class InvalidSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSessionError';
  }
}

export interface ReadingSessions {
  /** Starts a session on a Book in the Library. Only one session can run at a time. */
  start(isbn: string, at?: Date): Promise<ReadingSession>;
  /** Ends the running session. Throws if none is running. If the clock went backwards it ends at its start. */
  stop(at?: Date): Promise<ReadingSession>;
  /** Adds a finished session after the fact. It must end after it starts and not in the future. */
  addManual(isbn: string, startedAt: Date, endedAt: Date, now?: Date): Promise<ReadingSession>;
  /** Deletes a finished session. Deleting one that does not exist, or one still running, is a no-op. */
  remove(id: number): Promise<void>;
  /** Every session of every Book, oldest first. */
  all(): Promise<ReadingSession[]>;
  /** The running session, if any. It survives the app being closed. */
  running(): Promise<ReadingSession | null>;
  /** A Book's finished and running sessions, newest first. */
  list(isbn: string): Promise<ReadingSession[]>;
}

export const MAX_YEARLY_BOOKS_GOAL = 1000;
export const MAX_DAILY_MINUTES_GOAL = 24 * 60;

const YEARLY_BOOKS = 'yearly-books';
const DAILY_MINUTES = 'daily-minutes';

/** The goal target given cannot be saved. */
export class InvalidGoalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGoalError';
  }
}

export interface Goals {
  /** The number of Books the Reader wants to finish each year, or null if they have not set one. */
  getYearlyBooks(): Promise<number | null>;
  setYearlyBooks(target: number): Promise<void>;
  removeYearlyBooks(): Promise<void>;
  /** The number of minutes the Reader wants to read each day, or null if they have not set one. */
  getDailyMinutes(): Promise<number | null>;
  setDailyMinutes(target: number): Promise<void>;
  removeDailyMinutes(): Promise<void>;
}

export interface Library {
  list(): Promise<LibraryEntry[]>;
  /** Every Library Entry with its Book, oldest first. */
  listWithBooks(): Promise<LibraryEntryWithBook[]>;
  find(isbn: string): Promise<LibraryEntry | null>;
  /**
   * Moves a Book already in the Library to another Shelf; throws if it is not in the Library.
   * The page follows: Read puts it at the last page (when the length is known), Want to read
   * resets it to 0, and Reading keeps it, except that a finished Book starts again from 0.
   */
  moveToShelf(isbn: string, shelf: Shelf, at?: Date): Promise<void>;
  /** Marks or unmarks a Book already in the Library as a Favorite. */
  setFavorite(isbn: string, favorite: boolean): Promise<void>;
  /**
   * Every time a Book became Read, oldest first. Starting a Book again keeps its finish; moving a Book off
   * Read as a correction (back to Want to read, or a lower page) undoes the latest one.
   */
  finishes(): Promise<{ isbn: string; finishedAt: string }[]>;
  /** Every Book ever marked as a Favorite, including ones no longer in the Library. */
  favoriteIsbns(): Promise<string[]>;
  /**
   * Records how far the Reader has got. The Shelf follows: the first page moves Want to read to
   * Reading, the last page moves the Book to Read, and going back from the last page returns it to Reading.
   */
  recordPage(isbn: string, page: number, at?: Date): Promise<void>;
  /**
   * Takes a Book out of the Library. Its saved details, Reviews and Reading Sessions stay (ADR-0004),
   * but a session still running on it is ended now. Removing an absent Book is a no-op.
   */
  remove(isbn: string): Promise<void>;
  /** Puts a Book on the Want to read Shelf. A Book already in the Library is left untouched. */
  add(book: Book): Promise<void>;
}

/** Books the device has seen, so they can be shown without internet. */
export interface BookCache {
  get(isbn: string): Promise<Book | null>;
}

export interface Storage {
  schemaVersion(): Promise<number>;
  library: Library;
  books: BookCache;
  sessions: ReadingSessions;
  reviews: Reviews;
  goals: Goals;
}

type EntryRow = { isbn: string; shelf: string; current_page: number; added_at: string; favorite: number };

type ReviewRow = { isbn: string; rating: number; comment: string; created_at: string; updated_at: string };

function toReview(row: ReviewRow): Review {
  return {
    isbn: row.isbn,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type SessionRow = { id: number; isbn: string; started_at: string; ended_at: string | null };

function toSession(row: SessionRow): ReadingSession {
  return { id: row.id, isbn: row.isbn, startedAt: row.started_at, endedAt: row.ended_at };
}

type BookRow = {
  isbn: string;
  title: string;
  authors: string;
  genres: string;
  page_count: number | null;
  published_year: number | null;
  cover_url: string | null;
  description: string | null;
};

function toEntry(row: EntryRow): LibraryEntry {
  if (!isShelf(row.shelf)) {
    throw new Error(`Unknown Shelf "${row.shelf}" stored for ${row.isbn}.`);
  }
  return {
    isbn: row.isbn,
    shelf: row.shelf,
    currentPage: row.current_page,
    addedAt: row.added_at,
    favorite: row.favorite === 1, // SQLite stores true/false as 1/0
  };
}

function toBook(row: BookRow): Book {
  return {
    isbn: row.isbn,
    title: row.title,
    authors: JSON.parse(row.authors),
    genres: JSON.parse(row.genres),
    ...(row.page_count !== null ? { pageCount: row.page_count } : {}),
    ...(row.published_year !== null ? { publishedYear: row.published_year } : {}),
    ...(row.cover_url !== null ? { coverUrl: row.cover_url } : {}),
    ...(row.description !== null ? { description: row.description } : {}),
  };
}

async function readVersion(database: SqlDatabase): Promise<number> {
  const [row] = await database.getAll<{ user_version: number }>('PRAGMA user_version');
  return row.user_version;
}

export async function openStorage(
  database: SqlDatabase,
  migrations: Migration[] = MIGRATIONS,
): Promise<Storage> {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migrations must be consecutive from 1 (found version ${migration.version} at position ${index + 1}).`,
      );
    }
  });

  const current = await readVersion(database);
  const latest = migrations.reduce((max, m) => Math.max(max, m.version), 0);
  if (current > latest) {
    throw new Error(
      `This data was saved by a newer version of Novelry (schema ${current}, this app supports ${latest}). Please update the app.`,
    );
  }

  for (const migration of migrations.filter((m) => m.version > current)) {
    await database.exec('BEGIN');
    try {
      await database.exec(migration.sql);
      await database.exec(`PRAGMA user_version = ${migration.version}`);
      await database.exec('COMMIT');
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  }

  // A Library Entry with whether its Book is a Favorite (kept in its own table).
  const ENTRY_SELECT = `SELECT e.isbn, e.shelf, e.current_page, e.added_at, f.isbn IS NOT NULL AS favorite
                        FROM library_entries e LEFT JOIN favorites f ON f.isbn = e.isbn`;

  async function findEntry(isbn: string): Promise<LibraryEntry | null> {
    const [row] = await database.getAll<EntryRow>(`${ENTRY_SELECT} WHERE e.isbn = ?`, [isbn]);
    return row ? toEntry(row) : null;
  }

  async function requireEntry(isbn: string): Promise<LibraryEntry> {
    const entry = await findEntry(isbn);
    if (!entry) {
      throw new Error(`The book ${isbn} is not in your Library.`);
    }
    return entry;
  }

  /**
   * Saves the Shelf and page, keeping the finishes in step: becoming Read records one, and leaving Read
   * undoes the latest, unless the Reader is starting the Book again.
   */
  async function writeProgress(
    entry: LibraryEntry,
    shelf: Shelf,
    page: number,
    at: Date,
    { startingAgain = false }: { startingAgain?: boolean } = {},
  ): Promise<void> {
    await database.exec('BEGIN');
    try {
      await database.run('UPDATE library_entries SET shelf = ?, current_page = ? WHERE isbn = ?', [
        shelf,
        page,
        entry.isbn,
      ]);
      if (shelf === 'read' && entry.shelf !== 'read') {
        await database.run('INSERT INTO finishes (isbn, finished_at) VALUES (?, ?)', [
          entry.isbn,
          at.toISOString(),
        ]);
      } else if (shelf !== 'read' && entry.shelf === 'read' && !startingAgain) {
        await database.run(
          `DELETE FROM finishes WHERE id = (
             SELECT id FROM finishes WHERE isbn = ? ORDER BY finished_at DESC, id DESC LIMIT 1)`,
          [entry.isbn],
        );
      }
      await database.exec('COMMIT');
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  }

  /** The Book's length in pages, or null if unknown (or the Book's details were never saved). */
  async function pageCountOf(isbn: string): Promise<number | null> {
    const [row] = await database.getAll<{ page_count: number | null }>(
      'SELECT page_count FROM books WHERE isbn = ?',
      [isbn],
    );
    return row?.page_count ?? null;
  }

  const REVIEW_COLUMNS = 'isbn, rating, comment, created_at, updated_at';
  const SESSION_COLUMNS = 'id, isbn, started_at, ended_at';

  async function getGoal(kind: string): Promise<number | null> {
    const [row] = await database.getAll<{ target: number }>('SELECT target FROM goals WHERE kind = ?', [kind]);
    return row?.target ?? null;
  }

  async function setGoal(kind: string, target: number, max: number, description: string): Promise<void> {
    if (!Number.isInteger(target) || target < 1 || target > max) {
      throw new InvalidGoalError(`The goal must be ${description}.`);
    }
    await database.run(
      'INSERT INTO goals (kind, target) VALUES (?, ?) ON CONFLICT(kind) DO UPDATE SET target = excluded.target',
      [kind, target],
    );
  }

  async function removeGoal(kind: string): Promise<void> {
    await database.run('DELETE FROM goals WHERE kind = ?', [kind]);
  }

  async function runningSession(): Promise<ReadingSession | null> {
    const [row] = await database.getAll<SessionRow>(
      `SELECT ${SESSION_COLUMNS} FROM reading_sessions WHERE ended_at IS NULL`,
    );
    return row ? toSession(row) : null;
  }

  return {
    schemaVersion: () => readVersion(database),
    library: {
      async list() {
        const rows = await database.getAll<EntryRow>(`${ENTRY_SELECT} ORDER BY e.added_at, e.isbn`);
        return rows.map(toEntry);
      },
      async listWithBooks() {
        const rows = await database.getAll<EntryRow & Partial<Record<`b_${keyof BookRow}`, unknown>>>(
          `SELECT e.isbn, e.shelf, e.current_page, e.added_at, f.isbn IS NOT NULL AS favorite,
                  b.isbn AS b_isbn, b.title AS b_title, b.authors AS b_authors, b.genres AS b_genres,
                  b.page_count AS b_page_count, b.published_year AS b_published_year,
                  b.cover_url AS b_cover_url, b.description AS b_description
           FROM library_entries e LEFT JOIN favorites f ON f.isbn = e.isbn
           LEFT JOIN books b ON b.isbn = e.isbn
           ORDER BY e.added_at, e.isbn`,
        );
        return rows.map((row) => ({
          entry: toEntry(row),
          book:
            row.b_isbn == null
              ? null
              : toBook({
                  isbn: row.b_isbn as string,
                  title: row.b_title as string,
                  authors: row.b_authors as string,
                  genres: row.b_genres as string,
                  page_count: row.b_page_count as number | null,
                  published_year: row.b_published_year as number | null,
                  cover_url: row.b_cover_url as string | null,
                  description: row.b_description as string | null,
                }),
        }));
      },
      async moveToShelf(isbn, shelf, at = new Date()) {
        const entry = await requireEntry(isbn);
        const pageCount = await pageCountOf(isbn);
        let page = entry.currentPage;
        if (shelf === 'read' && pageCount) {
          page = pageCount;
        } else if (shelf === 'want-to-read') {
          page = 0;
        } else if (shelf === 'reading' && entry.shelf === 'read') {
          page = 0; // reading it again
        }
        await writeProgress(entry, shelf, page, at, {
          startingAgain: shelf === 'reading' && entry.shelf === 'read',
        });
      },
      async setFavorite(isbn, favorite) {
        await requireEntry(isbn);
        await database.run(
          favorite ? 'INSERT OR IGNORE INTO favorites (isbn) VALUES (?)' : 'DELETE FROM favorites WHERE isbn = ?',
          [isbn],
        );
      },
      async finishes() {
        const rows = await database.getAll<{ isbn: string; finished_at: string }>(
          'SELECT isbn, finished_at FROM finishes ORDER BY finished_at, id',
        );
        return rows.map((row) => ({ isbn: row.isbn, finishedAt: row.finished_at }));
      },
      async favoriteIsbns() {
        const rows = await database.getAll<{ isbn: string }>('SELECT isbn FROM favorites ORDER BY isbn');
        return rows.map((row) => row.isbn);
      },
      async recordPage(isbn, page, at = new Date()) {
        if (!Number.isInteger(page)) {
          throw new InvalidPageError('The page must be a whole number.');
        }
        const entry = await requireEntry(isbn);
        const pageCount = await pageCountOf(isbn);
        if (page < 0 || (pageCount !== null && page > pageCount)) {
          throw new InvalidPageError(
            pageCount === null
              ? 'The page cannot be below 0.'
              : `The page must be between 0 and ${pageCount}.`,
          );
        }

        let shelf = entry.shelf;
        if (pageCount !== null && page === pageCount) {
          shelf = 'read';
        } else if (pageCount !== null && shelf === 'read') {
          shelf = 'reading';
        } else if (page > 0 && shelf === 'want-to-read') {
          shelf = 'reading';
        }
        await writeProgress(entry, shelf, page, at);
      },
      async remove(isbn) {
        await database.exec('BEGIN');
        try {
          await database.run('UPDATE reading_sessions SET ended_at = ? WHERE isbn = ? AND ended_at IS NULL', [
            new Date().toISOString(),
            isbn,
          ]);
          await database.run('DELETE FROM library_entries WHERE isbn = ?', [isbn]);
          await database.exec('COMMIT');
        } catch (error) {
          await database.exec('ROLLBACK');
          throw error;
        }
      },
      find: findEntry,
      async add(book) {
        await database.exec('BEGIN');
        try {
          await database.run(
            `INSERT INTO books
               (isbn, title, authors, genres, page_count, published_year, cover_url, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(isbn) DO UPDATE SET
               title = excluded.title,
               authors = CASE WHEN excluded.authors = '[]' THEN books.authors ELSE excluded.authors END,
               genres = CASE WHEN excluded.genres = '[]' THEN books.genres ELSE excluded.genres END,
               page_count = COALESCE(excluded.page_count, books.page_count),
               published_year = COALESCE(excluded.published_year, books.published_year),
               cover_url = COALESCE(excluded.cover_url, books.cover_url),
               description = COALESCE(excluded.description, books.description)`,
            [
              book.isbn,
              book.title,
              JSON.stringify(book.authors),
              JSON.stringify(book.genres),
              book.pageCount ?? null,
              book.publishedYear ?? null,
              book.coverUrl ?? null,
              book.description ?? null,
            ],
          );
          await database.run(
            `INSERT OR IGNORE INTO library_entries (isbn, shelf, current_page, added_at)
             VALUES (?, 'want-to-read', 0, ?)`,
            [book.isbn, new Date().toISOString()],
          );
          await database.exec('COMMIT');
        } catch (error) {
          await database.exec('ROLLBACK');
          throw error;
        }
      },
    },
    sessions: {
      running: runningSession,
      async start(isbn, at = new Date()) {
        await requireEntry(isbn);
        const running = await runningSession();
        if (running) {
          throw new SessionAlreadyRunningError();
        }
        try {
          await database.run('INSERT INTO reading_sessions (isbn, started_at) VALUES (?, ?)', [
            isbn,
            at.toISOString(),
          ]);
        } catch (error) {
          // Another start slipped in between the check and the insert; the unique index caught it.
          if (error instanceof Error && /unique/i.test(error.message)) {
            throw new SessionAlreadyRunningError();
          }
          throw error;
        }
        return (await runningSession())!;
      },
      async stop(at = new Date()) {
        const running = await runningSession();
        if (!running) {
          throw new Error('No reading session is running.');
        }
        // Timestamps are always written as UTC ISO strings, which sort like the times they stand for.
        const endedAt = at.toISOString() < running.startedAt ? running.startedAt : at.toISOString();
        await database.run('UPDATE reading_sessions SET ended_at = ? WHERE id = ?', [endedAt, running.id]);
        return { ...running, endedAt };
      },
      async addManual(isbn, startedAt, endedAt, now = new Date()) {
        await requireEntry(isbn);
        if (!(endedAt.getTime() > startedAt.getTime())) {
          throw new InvalidSessionError('A reading session must end after it starts.');
        }
        if (endedAt.getTime() > now.getTime()) {
          throw new InvalidSessionError('A reading session cannot end in the future.');
        }
        const [row] = await database.getAll<SessionRow>(
          `INSERT INTO reading_sessions (isbn, started_at, ended_at) VALUES (?, ?, ?)
           RETURNING ${SESSION_COLUMNS}`,
          [isbn, startedAt.toISOString(), endedAt.toISOString()],
        );
        return toSession(row);
      },
      async remove(id) {
        // A running session is stopped, not deleted.
        await database.run('DELETE FROM reading_sessions WHERE id = ? AND ended_at IS NOT NULL', [id]);
      },
      async all() {
        const rows = await database.getAll<SessionRow>(
          `SELECT ${SESSION_COLUMNS} FROM reading_sessions ORDER BY started_at, id`,
        );
        return rows.map(toSession);
      },
      async list(isbn) {
        const rows = await database.getAll<SessionRow>(
          `SELECT ${SESSION_COLUMNS} FROM reading_sessions WHERE isbn = ? ORDER BY started_at DESC, id DESC`,
          [isbn],
        );
        return rows.map(toSession);
      },
    },
    goals: {
      getYearlyBooks: () => getGoal(YEARLY_BOOKS),
      setYearlyBooks: (target) =>
        setGoal(YEARLY_BOOKS, target, MAX_YEARLY_BOOKS_GOAL, `a whole number of books from 1 to ${MAX_YEARLY_BOOKS_GOAL}`),
      removeYearlyBooks: () => removeGoal(YEARLY_BOOKS),
      getDailyMinutes: () => getGoal(DAILY_MINUTES),
      setDailyMinutes: (target) =>
        setGoal(DAILY_MINUTES, target, MAX_DAILY_MINUTES_GOAL, `a whole number of minutes from 1 to ${MAX_DAILY_MINUTES_GOAL}`),
      removeDailyMinutes: () => removeGoal(DAILY_MINUTES),
    },
    reviews: {
      async save(isbn, { rating, comment }, at = new Date()) {
        if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
          throw new InvalidReviewError(`The Rating must be a whole number from ${MIN_RATING} to ${MAX_RATING}.`);
        }
        const trimmedComment = comment.trim();
        if (trimmedComment.length > MAX_REVIEW_COMMENT_LENGTH) {
          throw new InvalidReviewError(`The comment can be at most ${MAX_REVIEW_COMMENT_LENGTH} characters.`);
        }
        await requireEntry(isbn);
        const now = at.toISOString();
        await database.run(
          `INSERT INTO reviews (isbn, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(isbn) DO UPDATE SET rating = excluded.rating, comment = excluded.comment,
                                           updated_at = excluded.updated_at`,
          [isbn, rating, trimmedComment, now, now],
        );
      },
      async get(isbn) {
        const [row] = await database.getAll<ReviewRow>(
          `SELECT ${REVIEW_COLUMNS} FROM reviews WHERE isbn = ?`,
          [isbn],
        );
        return row ? toReview(row) : null;
      },
      async all() {
        const rows = await database.getAll<ReviewRow>(
          `SELECT ${REVIEW_COLUMNS} FROM reviews ORDER BY updated_at DESC, isbn`,
        );
        return rows.map(toReview);
      },
      async remove(isbn) {
        await database.run('DELETE FROM reviews WHERE isbn = ?', [isbn]);
      },
    },
    books: {
      async get(isbn) {
        const [row] = await database.getAll<BookRow>('SELECT * FROM books WHERE isbn = ?', [isbn]);
        return row ? toBook(row) : null;
      },
    },
  };
}
