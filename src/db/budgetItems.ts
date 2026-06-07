import { getDatabase, isNative } from './database';

const LOCAL_KEY = 'safespend_budget_items';

export interface BudgetItem {
  id: string;
  categoryId: string;
  name: string;
  plannedAmount: number;
  createdAt: string;
}

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocal = (): BudgetItem[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocal = (items: BudgetItem[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
};

export const initBudgetItemsTable = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id TEXT PRIMARY KEY NOT NULL,
      categoryId TEXT NOT NULL,
      name TEXT NOT NULL,
      plannedAmount REAL NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
};

export const getBudgetItemsByCategory = async (
  categoryId: string
): Promise<BudgetItem[]> => {
  if (!isNative()) {
    return getLocal().filter((i) => i.categoryId === categoryId);
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM budget_items WHERE categoryId = ? ORDER BY createdAt ASC',
    [categoryId]
  );
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    categoryId: row.categoryId as string,
    name: row.name as string,
    plannedAmount: row.plannedAmount as number,
    createdAt: row.createdAt as string,
  }));
};

export const getAllBudgetItems = async (): Promise<BudgetItem[]> => {
  if (!isNative()) return getLocal();
  const db = getDatabase();
  const result = await db.query('SELECT * FROM budget_items');
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    categoryId: row.categoryId as string,
    name: row.name as string,
    plannedAmount: row.plannedAmount as number,
    createdAt: row.createdAt as string,
  }));
};

export const addBudgetItem = async (
  data: Omit<BudgetItem, 'id' | 'createdAt'>
): Promise<BudgetItem> => {
  const item: BudgetItem = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocal([...getLocal(), item]);
    return item;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO budget_items (id, categoryId, name, plannedAmount, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [item.id, item.categoryId, item.name, item.plannedAmount, item.createdAt]
  );
  return item;
};

export const deleteBudgetItem = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocal(getLocal().filter((i) => i.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM budget_items WHERE id = ?', [id]);
};
