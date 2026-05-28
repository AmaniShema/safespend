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
    `INSERT INTO transactions (id, amount, type, category, note, date, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.amount,
      transaction.type,
      transaction.category,
      transaction.note,
      transaction.date,
      transaction.createdAt,
    ]
  );
  return transaction;
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  if (!isNative()) {
    return getLocalTransactions();
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM transactions ORDER BY date DESC'
  );
  return (result.values as Transaction[]) || [];
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (!isNative()) {
    const existing = getLocalTransactions();
    saveLocalTransactions(existing.filter((t) => t.id !== id));
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
