import type { SqlDatabase, SqlValue } from './database';

/** Real in-memory SQLite for tests, behind the same port the app uses. */
export function createTestDatabase(): SqlDatabase {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  return {
    async exec(sql: string) {
      db.exec(sql);
    },
    async run(sql: string, params: SqlValue[] = []) {
      db.prepare(sql).run(...params);
    },
    async getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
  };
}
