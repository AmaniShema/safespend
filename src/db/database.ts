import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

const DB_NAME = 'safespend';
const IS_NATIVE = Capacitor.isNativePlatform();

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    note TEXT NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    spent REAL NOT NULL DEFAULT 0,
    period TEXT NOT NULL
  );
`;

export const initDatabase = async (): Promise<void> => {
  if (!IS_NATIVE) {
    console.log('Browser mode: using localStorage fallback');
    return;
  }

  try {
    const isConnection = (await sqlite.isConnection(DB_NAME, false)).result;

    if (isConnection) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await db.open();
    await db.execute(CREATE_TABLES);
    console.log('SQLite database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export const getDatabase = (): SQLiteDBConnection => {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db;
};

export const isNative = (): boolean => IS_NATIVE;
