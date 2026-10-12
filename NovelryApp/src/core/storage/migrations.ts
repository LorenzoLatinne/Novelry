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
  {
    version: 3,
    sql: `
      CREATE TABLE reading_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isbn TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );
      CREATE INDEX reading_sessions_by_book ON reading_sessions (isbn, started_at);
      -- At most one session may be running (no end time) at any moment.
      CREATE UNIQUE INDEX one_running_session ON reading_sessions ((1)) WHERE ended_at IS NULL;
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE reviews (
        isbn TEXT PRIMARY KEY NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 5,
    // Kept apart from library_entries so a Favorite survives the Book leaving the Library (ADR-0004).
    sql: `CREATE TABLE favorites (isbn TEXT PRIMARY KEY NOT NULL);`,
  },
  {
    version: 6,
    sql: `
      -- One row each time a Book became Read, kept when the Book leaves the Library (ADR-0004).
      -- Books already Read before finishes were recorded are dated by when they were added (an approximation).
      CREATE TABLE finishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isbn TEXT NOT NULL,
        finished_at TEXT NOT NULL
      );
      CREATE INDEX finishes_by_book ON finishes (isbn, finished_at);
      INSERT INTO finishes (isbn, finished_at)
        SELECT isbn, added_at FROM library_entries WHERE shelf = 'read';
      -- Reading Goals, one row per kind of goal.
      CREATE TABLE goals (kind TEXT PRIMARY KEY NOT NULL, target INTEGER NOT NULL CHECK (target >= 1));
    `,
  },
  {
    version: 7,
    // Achievements stay earned once earned, even if the history behind them is corrected later (ADR-0004).
    sql: `CREATE TABLE earned_achievements (id TEXT PRIMARY KEY NOT NULL, earned_at TEXT NOT NULL);`,
  },
  {
    version: 8,
    // Whether the Reader has been told about an earned Achievement (so the notice appears once).
    sql: `
      ALTER TABLE earned_achievements ADD COLUMN seen INTEGER NOT NULL DEFAULT 0;
      -- Anything recorded before this existed was never meant to be announced: count it as seen.
      UPDATE earned_achievements SET seen = 1;
    `,
  },
];
