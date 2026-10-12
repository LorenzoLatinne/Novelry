import type { SqlDatabase } from './database';
import { MIGRATIONS, type Migration } from './migrations';
import { isShelf, type Shelf } from '../shelf';

export type LibraryEntry = {
  isbn: string;
  shelf: Shelf;
  currentPage: number;
  addedAt: string;
};

export interface Library {
  list(): Promise<LibraryEntry[]>;
}

export interface Storage {
  schemaVersion(): Promise<number>;
  library: Library;
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

  return {
    schemaVersion: () => readVersion(database),
    library: {
      async list() {
        const rows = await database.getAll<{
          isbn: string;
          shelf: string;
          current_page: number;
          added_at: string;
        }>('SELECT isbn, shelf, current_page, added_at FROM library_entries ORDER BY added_at');
        return rows.map((r) => {
          if (!isShelf(r.shelf)) {
            throw new Error(`Unknown Shelf "${r.shelf}" stored for ${r.isbn}.`);
          }
          return {
            isbn: r.isbn,
            shelf: r.shelf,
            currentPage: r.current_page,
            addedAt: r.added_at,
          };
        });
      },
    },
  };
}
