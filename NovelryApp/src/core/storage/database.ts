export type SqlValue = string | number | null;

/**
 * The minimal async SQL surface the core needs. The app adapts expo-sqlite to
 * this; tests adapt an in-memory SQLite.
 */
export interface SqlDatabase {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  getAll<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
}
