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
    createdAt TEXT NOT NULL,
    accountId TEXT NOT NULL DEFAULT 'default'
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
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT NOT NULL,
    color TEXT NOT NULL,
    isDefault INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`;

const MIGRATIONS = `
  ALTER TABLE transactions ADD COLUMN accountId TEXT NOT NULL DEFAULT 'default';
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

    // Run migrations safely
    try {
      await db.execute(MIGRATIONS);
    } catch {
      // Column already exists — safe to ignore
    }

    await db.execute(`CREATE TABLE IF NOT EXISTS savings_goals (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL, color TEXT NOT NULL, targetAmount REAL NOT NULL, currentAmount REAL NOT NULL DEFAULT 0, createdAt TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS savings_transactions (id TEXT PRIMARY KEY NOT NULL, goalId TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', date TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS household_contributors (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', createdAt TEXT NOT NULL)`);
    try {
      await db.execute(`ALTER TABLE household_contributors ADD COLUMN recorded INTEGER NOT NULL DEFAULT 0`);
    } catch {
      // Column already exists
    }
    await db.execute(`CREATE TABLE IF NOT EXISTS recurring_transactions (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, accountId TEXT NOT NULL DEFAULT 'default', frequency TEXT NOT NULL, nextDueDate TEXT NOT NULL, isActive INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS debts (id TEXT PRIMARY KEY NOT NULL, personName TEXT NOT NULL, originalAmount REAL NOT NULL, remainingAmount REAL NOT NULL, direction TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', isSettled INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS debt_payments (id TEXT PRIMARY KEY NOT NULL, debtId TEXT NOT NULL, amount REAL NOT NULL, note TEXT NOT NULL DEFAULT '', date TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS household_members (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', createdAt TEXT NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS household_contributions (id TEXT PRIMARY KEY NOT NULL, contributorId TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, month TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', recorded INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL)`);
    console.log('SQLite database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export const getDatabase = (): SQLiteDBConnection => {
  if (!db) throw new Error('Database not initialized.');
  return db;
};

export const isNative = (): boolean => IS_NATIVE;
