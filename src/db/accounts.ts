import type { Account } from '../types';
import { getDatabase, isNative } from './database';

const LOCAL_KEY = 'safespend_accounts';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalAccounts = (): Account[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalAccounts = (accounts: Account[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(accounts));
};

const DEFAULT_ACCOUNT: Account = {
  id: 'default',
  name: 'Cash',
  type: 'cash',
  currency: 'RWF',
  color: '#10b981',
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export const initDefaultAccount = async (): Promise<Account> => {
  const existing = await getAllAccounts();
  if (existing.length > 0) return existing.find((a) => a.isDefault) || existing[0];

  if (!isNative()) {
    saveLocalAccounts([DEFAULT_ACCOUNT]);
    return DEFAULT_ACCOUNT;
  }

  const db = getDatabase();
  await db.run(
    `INSERT OR IGNORE INTO accounts
     (id, name, type, currency, color, isDefault, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [DEFAULT_ACCOUNT.id, DEFAULT_ACCOUNT.name, DEFAULT_ACCOUNT.type,
     DEFAULT_ACCOUNT.currency, DEFAULT_ACCOUNT.color, DEFAULT_ACCOUNT.createdAt]
  );
  return DEFAULT_ACCOUNT;
};

export const getAllAccounts = async (): Promise<Account[]> => {
  if (!isNative()) return getLocalAccounts();
  const db = getDatabase();
  try {
    const result = await db.query(
      'SELECT * FROM accounts ORDER BY isDefault DESC, createdAt ASC'
    );
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      type: row.type as Account['type'],
      currency: row.currency as string,
      color: row.color as string,
      isDefault: Boolean(row.isDefault),
      createdAt: row.createdAt as string,
    }));
  } catch {
    return [DEFAULT_ACCOUNT];
  }
};

export const createAccount = async (
  data: Omit<Account, 'id' | 'createdAt'>
): Promise<Account> => {
  const account: Account = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (!isNative()) {
    const existing = getLocalAccounts();
    if (data.isDefault) {
      saveLocalAccounts([
        ...existing.map((a) => ({ ...a, isDefault: false })),
        account,
      ]);
    } else {
      saveLocalAccounts([...existing, account]);
    }
    return account;
  }

  const db = getDatabase();
  if (data.isDefault) {
    await db.run('UPDATE accounts SET isDefault = 0');
  }
  await db.run(
    `INSERT INTO accounts (id, name, type, currency, color, isDefault, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [account.id, account.name, account.type, account.currency,
     account.color, data.isDefault ? 1 : 0, account.createdAt]
  );
  return account;
};

export const setDefaultAccount = async (id: string): Promise<void> => {
  if (!isNative()) {
    const existing = getLocalAccounts();
    saveLocalAccounts(
      existing.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE accounts SET isDefault = 0');
  await db.run('UPDATE accounts SET isDefault = 1 WHERE id = ?', [id]);
};

export const deleteAccount = async (id: string): Promise<void> => {
  if (id === 'default') return;
  if (!isNative()) {
    saveLocalAccounts(getLocalAccounts().filter((a) => a.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM accounts WHERE id != "default" AND id = ?', [id]);
};

export const getDefaultAccountId = async (): Promise<string> => {
  const accounts = await getAllAccounts();
  return accounts.find((a) => a.isDefault)?.id || 'default';
};
