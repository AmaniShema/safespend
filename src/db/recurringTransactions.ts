import { getDatabase, isNative } from './database';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  frequency: 'weekly' | 'monthly';
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
}

const LOCAL_KEY = 'safespend_recurring';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocal = (): RecurringTransaction[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocal = (items: RecurringTransaction[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const initRecurringTable = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      accountId TEXT NOT NULL DEFAULT 'default',
      frequency TEXT NOT NULL,
      nextDueDate TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);
};

export const getAllRecurring = async (): Promise<RecurringTransaction[]> => {
  if (!isNative()) return getLocal();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM recurring_transactions ORDER BY nextDueDate ASC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      amount: row.amount as number,
      type: row.type as 'income' | 'expense',
      category: row.category as string,
      accountId: row.accountId as string,
      frequency: row.frequency as 'weekly' | 'monthly',
      nextDueDate: row.nextDueDate as string,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt as string,
    }));
  } catch {
    return [];
  }
};

export const createRecurring = async (
  data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'isActive'>
): Promise<RecurringTransaction> => {
  const item: RecurringTransaction = {
    ...data,
    id: generateId(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocal([...getLocal(), item]);
    return item;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO recurring_transactions
     (id, name, amount, type, category, accountId, frequency, nextDueDate, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [item.id, item.name, item.amount, item.type, item.category, item.accountId, item.frequency, item.nextDueDate, item.createdAt]
  );
  return item;
};

export const toggleRecurringActive = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocal(getLocal().map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
    return;
  }
  const db = getDatabase();
  const result = await db.query('SELECT isActive FROM recurring_transactions WHERE id = ?', [id]);
  const current = Boolean(result.values?.[0]?.isActive);
  await db.run('UPDATE recurring_transactions SET isActive = ? WHERE id = ?', [current ? 0 : 1, id]);
};

export const deleteRecurring = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocal(getLocal().filter((r) => r.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM recurring_transactions WHERE id = ?', [id]);
};

const advanceDate = (dateStr: string, frequency: 'weekly' | 'monthly'): string => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  do {
    if (frequency === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
  } while (date <= today);

  return date.toISOString();
};

export const advanceRecurring = async (id: string): Promise<void> => {
  if (!isNative()) {
    const items = getLocal();
    const item = items.find((r) => r.id === id);
    if (!item) return;
    const nextDueDate = advanceDate(item.nextDueDate, item.frequency);
    saveLocal(items.map((r) => (r.id === id ? { ...r, nextDueDate } : r)));
    return;
  }
  const db = getDatabase();
  const result = await db.query('SELECT nextDueDate, frequency FROM recurring_transactions WHERE id = ?', [id]);
  const row = result.values?.[0];
  if (!row) return;
  const nextDueDate = advanceDate(row.nextDueDate as string, row.frequency as 'weekly' | 'monthly');
  await db.run('UPDATE recurring_transactions SET nextDueDate = ? WHERE id = ?', [nextDueDate, id]);
};
