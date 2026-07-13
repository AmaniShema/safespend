import { getDatabase, isNative } from './database';

export interface ShoppingList {
  id: string;
  name: string;
  date: string;
  accountId: string;
  categoryId: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  plannedAmount: number;
  actualAmount: number | null;
  status: 'pending' | 'bought' | 'skipped';
  skipReason: string;
  createdAt: string;
}

const LISTS_KEY = 'safespend_shopping_lists';
const ITEMS_KEY = 'safespend_shopping_items';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalLists = (): ShoppingList[] => {
  const raw = localStorage.getItem(LISTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalLists = (lists: ShoppingList[]): void => {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
};

const getLocalItems = (): ShoppingItem[] => {
  const raw = localStorage.getItem(ITEMS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalItems = (items: ShoppingItem[]): void => {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

export const initShoppingTables = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shopping_lists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      accountId TEXT NOT NULL DEFAULT 'default',
      categoryId TEXT NOT NULL DEFAULT 'food',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY NOT NULL,
      listId TEXT NOT NULL,
      name TEXT NOT NULL,
      plannedAmount REAL NOT NULL DEFAULT 0,
      actualAmount REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      skipReason TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    )
  `);
};

export const getAllShoppingLists = async (): Promise<ShoppingList[]> => {
  if (!isNative()) return getLocalLists().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM shopping_lists ORDER BY createdAt DESC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      date: row.date as string,
      accountId: row.accountId as string,
      categoryId: row.categoryId as string,
      status: row.status as 'active' | 'completed',
      createdAt: row.createdAt as string,
    }));
  } catch { return []; }
};

export const createShoppingList = async (
  data: Omit<ShoppingList, 'id' | 'createdAt' | 'status'>
): Promise<ShoppingList> => {
  const list: ShoppingList = {
    ...data,
    id: generateId(),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalLists([list, ...getLocalLists()]);
    return list;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO shopping_lists (id, name, date, accountId, categoryId, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    [list.id, list.name, list.date, list.accountId, list.categoryId, list.createdAt]
  );
  return list;
};

export const updateShoppingListStatus = async (id: string, status: 'active' | 'completed'): Promise<void> => {
  if (!isNative()) {
    saveLocalLists(getLocalLists().map((l) => l.id === id ? { ...l, status } : l));
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE shopping_lists SET status = ? WHERE id = ?', [status, id]);
};

export const deleteShoppingList = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalLists(getLocalLists().filter((l) => l.id !== id));
    saveLocalItems(getLocalItems().filter((i) => i.listId !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM shopping_lists WHERE id = ?', [id]);
  await db.run('DELETE FROM shopping_items WHERE listId = ?', [id]);
};

export const getItemsByList = async (listId: string): Promise<ShoppingItem[]> => {
  if (!isNative()) {
    return getLocalItems()
      .filter((i) => i.listId === listId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM shopping_items WHERE listId = ? ORDER BY createdAt ASC',
    [listId]
  );
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    listId: row.listId as string,
    name: row.name as string,
    plannedAmount: row.plannedAmount as number,
    actualAmount: row.actualAmount as number | null,
    status: row.status as 'pending' | 'bought' | 'skipped',
    skipReason: row.skipReason as string,
    createdAt: row.createdAt as string,
  }));
};

export const addShoppingItem = async (
  data: Omit<ShoppingItem, 'id' | 'createdAt' | 'status' | 'actualAmount' | 'skipReason'>
): Promise<ShoppingItem> => {
  const item: ShoppingItem = {
    ...data,
    id: generateId(),
    status: 'pending',
    actualAmount: null,
    skipReason: '',
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalItems([...getLocalItems(), item]);
    return item;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO shopping_items (id, listId, name, plannedAmount, actualAmount, status, skipReason, createdAt)
     VALUES (?, ?, ?, ?, NULL, 'pending', '', ?)`,
    [item.id, item.listId, item.name, item.plannedAmount, item.createdAt]
  );
  return item;
};

export const markItemBought = async (id: string, actualAmount: number): Promise<void> => {
  if (!isNative()) {
    saveLocalItems(getLocalItems().map((i) =>
      i.id === id ? { ...i, status: 'bought', actualAmount } : i
    ));
    return;
  }
  const db = getDatabase();
  await db.run(
    `UPDATE shopping_items SET status = 'bought', actualAmount = ? WHERE id = ?`,
    [actualAmount, id]
  );
};

export const markItemSkipped = async (id: string, reason: string): Promise<void> => {
  if (!isNative()) {
    saveLocalItems(getLocalItems().map((i) =>
      i.id === id ? { ...i, status: 'skipped', skipReason: reason } : i
    ));
    return;
  }
  const db = getDatabase();
  await db.run(
    `UPDATE shopping_items SET status = 'skipped', skipReason = ? WHERE id = ?`,
    [reason, id]
  );
};

export const resetItemToPending = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalItems(getLocalItems().map((i) =>
      i.id === id ? { ...i, status: 'pending', actualAmount: null, skipReason: '' } : i
    ));
    return;
  }
  const db = getDatabase();
  await db.run(
    `UPDATE shopping_items SET status = 'pending', actualAmount = NULL, skipReason = '' WHERE id = ?`,
    [id]
  );
};

export const deleteShoppingItem = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalItems(getLocalItems().filter((i) => i.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM shopping_items WHERE id = ?', [id]);
};
