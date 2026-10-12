export type Migration = {
  /** Schema version this migration produces. Versions are consecutive from 1. */
  version: number;
  sql: string;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE library_entries (
        isbn TEXT PRIMARY KEY NOT NULL,
        shelf TEXT NOT NULL,
        current_page INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE books (
        isbn TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        genres TEXT NOT NULL,
        page_count INTEGER,
        published_year INTEGER,
        cover_url TEXT,
        description TEXT
      );
    `,
  },
];
