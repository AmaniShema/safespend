import type { Transaction } from '../types';
import { getDatabase, isNative } from './database';

const STORAGE_KEY = 'safespend_transactions';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalTransactions = (): Transaction[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

export const addTransaction = async (
  data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction> => {
  const transaction: Transaction = {
    ...data,
    accountId: data.accountId || 'default',
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (!isNative()) {
    const existing = getLocalTransactions();
    saveLocalTransactions([transaction, ...existing]);
    return transaction;
  }

  const db = getDatabase();
  await db.run(
    `INSERT INTO transactions
     (id, amount, type, category, note, date, createdAt, accountId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id, transaction.amount, transaction.type,
      transaction.category, transaction.note, transaction.date,
      transaction.createdAt, transaction.accountId,
    ]
  );
  return transaction;
};

export const updateTransaction = async (
  id: string,
  data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<void> => {
  if (!isNative()) {
    const existing = getLocalTransactions();
    saveLocalTransactions(
      existing.map((t) =>
        t.id === id ? { ...t, ...data, accountId: data.accountId || 'default' } : t
      )
    );
    return;
  }
  const db = getDatabase();
  await db.run(
    `UPDATE transactions
     SET amount = ?, type = ?, category = ?, note = ?, date = ?, accountId = ?
     WHERE id = ?`,
    [data.amount, data.type, data.category, data.note, data.date,
     data.accountId || 'default', id]
  );
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  if (!isNative()) return getLocalTransactions();
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM transactions ORDER BY date DESC'
  );
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    amount: row.amount as number,
    type: row.type as 'income' | 'expense',
    category: row.category as string,
    note: row.note as string,
    date: row.date as string,
    createdAt: row.createdAt as string,
    accountId: (row.accountId as string) || 'default',
  }));
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalTransactions(getLocalTransactions().filter((t) => t.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM transactions WHERE id = ?', [id]);
};

export const getTransactionsByMonth = async (
  year: number,
  month: number
): Promise<Transaction[]> => {
  const all = await getAllTransactions();
  return all.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
};

export const getTotalBalance = async (): Promise<number> => {
  const all = await getAllTransactions();
  return all.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);
};
