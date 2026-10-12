import { openDatabaseAsync } from 'expo-sqlite';
import type { SqlDatabase } from './database';

const DATABASE_NAME = 'novelry.db';

/** Adapts expo-sqlite's on-device database to the core's SqlDatabase port. */
export async function openDeviceDatabase(): Promise<SqlDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  return {
    exec: (sql) => db.execAsync(sql),
    async run(sql, params = []) {
      await db.runAsync(sql, params);
    },
    getAll: (sql, params = []) => db.getAllAsync(sql, params),
  };
}
