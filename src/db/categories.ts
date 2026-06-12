import type { Category } from '../types';
import { getDatabase, isNative } from './database';

const LOCAL_KEY = 'safespend_categories';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', emoji: '🍽️', color: '#f97316', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'transport', name: 'Transport', emoji: '🚗', color: '#3b82f6', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#a855f7', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'rent', name: 'Rent', emoji: '🏠', color: '#eab308', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'travel', name: 'Travel', emoji: '✈️', color: '#06b6d4', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'health', name: 'Health', emoji: '❤️', color: '#ef4444', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#ec4899', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'salary', name: 'Salary', emoji: '💰', color: '#10b981', isSystem: true, isDaily: false, createdAt: '' },
  { id: 'daily', name: 'Daily Expenses', emoji: '🎲', color: '#6366f1', isSystem: true, isDaily: true, createdAt: '' },
];

const getLocalCategories = (): Category[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return SYSTEM_CATEGORIES;
  const stored: Category[] = JSON.parse(raw);
  const storedIds = stored.map((c) => c.id);
  const missingSystems = SYSTEM_CATEGORIES.filter((s) => !storedIds.includes(s.id));
  return [...missingSystems, ...stored];
};

const saveLocalCategories = (categories: Category[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(categories));
};

export const initCategories = async (): Promise<void> => {
  if (!isNative()) {
    if (!localStorage.getItem(LOCAL_KEY)) {
      saveLocalCategories(SYSTEM_CATEGORIES);
    }
    return;
  }

  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      isSystem INTEGER NOT NULL DEFAULT 0,
      isDaily INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  for (const cat of SYSTEM_CATEGORIES) {
    await db.run(
      `INSERT OR IGNORE INTO categories
       (id, name, emoji, color, isSystem, isDaily, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.emoji, cat.color,
       cat.isSystem ? 1 : 0, cat.isDaily ? 1 : 0,
       new Date().toISOString()]
    );
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  if (!isNative()) return getLocalCategories();
  const db = getDatabase();
  try {
    const result = await db.query(
      'SELECT * FROM categories ORDER BY isSystem DESC, name ASC'
    );
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      emoji: row.emoji as string,
      color: row.color as string,
      isSystem: Boolean(row.isSystem),
      isDaily: Boolean(row.isDaily),
      createdAt: row.createdAt as string,
    }));
  } catch {
    return SYSTEM_CATEGORIES;
  }
};

export const createCategory = async (
  data: Omit<Category, 'id' | 'createdAt' | 'isSystem' | 'isDaily'>
): Promise<Category> => {
  const category: Category = {
    ...data,
    id: generateId(),
    isSystem: false,
    isDaily: false,
    createdAt: new Date().toISOString(),
  };

  if (!isNative()) {
    const existing = getLocalCategories();
    saveLocalCategories([...existing, category]);
    return category;
  }

  const db = getDatabase();
  await db.run(
    `INSERT INTO categories (id, name, emoji, color, isSystem, isDaily, createdAt)
     VALUES (?, ?, ?, ?, 0, 0, ?)`,
    [category.id, category.name, category.emoji, category.color, category.createdAt]
  );
  return category;
};

export const updateCategory = async (
  id: string,
  data: { name: string; emoji: string; color: string }
): Promise<void> => {
  const cat = (await getAllCategories()).find((c) => c.id === id);
  if (cat?.isSystem) return; // protect system categories

  if (!isNative()) {
    const existing = getLocalCategories();
    saveLocalCategories(
      existing.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    return;
  }

  const db = getDatabase();
  await db.run(
    'UPDATE categories SET name = ?, emoji = ?, color = ? WHERE id = ? AND isSystem = 0',
    [data.name, data.emoji, data.color, id]
  );
};

export const deleteCategory = async (id: string): Promise<void> => {
  const cat = (await getAllCategories()).find((c) => c.id === id);
  if (cat?.isSystem) return;

  if (!isNative()) {
    saveLocalCategories(getLocalCategories().filter((c) => c.id !== id));
    return;
  }

  const db = getDatabase();
  await db.run('DELETE FROM categories WHERE id = ? AND isSystem = 0', [id]);
};
