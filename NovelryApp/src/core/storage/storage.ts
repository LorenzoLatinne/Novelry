import type { SqlDatabase } from './database';
import { MIGRATIONS, type Migration } from './migrations';
import type { Book } from '../catalog/book';
import { isShelf, type Shelf } from '../shelf';

export type LibraryEntry = {
  isbn: string;
  shelf: Shelf;
  currentPage: number;
  addedAt: string;
};

export interface Library {
  list(): Promise<LibraryEntry[]>;
  find(isbn: string): Promise<LibraryEntry | null>;
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
}

type EntryRow = { isbn: string; shelf: string; current_page: number; added_at: string };

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
  return { isbn: row.isbn, shelf: row.shelf, currentPage: row.current_page, addedAt: row.added_at };
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

  const ENTRY_COLUMNS = 'isbn, shelf, current_page, added_at';

  return {
    schemaVersion: () => readVersion(database),
    library: {
      async list() {
        const rows = await database.getAll<EntryRow>(
          `SELECT ${ENTRY_COLUMNS} FROM library_entries ORDER BY added_at`,
        );
        return rows.map(toEntry);
      },
      async find(isbn) {
        const [row] = await database.getAll<EntryRow>(
          `SELECT ${ENTRY_COLUMNS} FROM library_entries WHERE isbn = ?`,
          [isbn],
        );
        return row ? toEntry(row) : null;
      },
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
    books: {
      async get(isbn) {
        const [row] = await database.getAll<BookRow>('SELECT * FROM books WHERE isbn = ?', [isbn]);
        return row ? toBook(row) : null;
      },
    },
  };
}
