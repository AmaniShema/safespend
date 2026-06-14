import { getDatabase, isNative } from './database';

export interface Debt {
  id: string;
  personName: string;
  originalAmount: number;
  remainingAmount: number;
  direction: 'owed_to_me' | 'i_owe';
  description: string;
  isSettled: boolean;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  note: string;
  date: string;
}

const DEBTS_KEY = 'safespend_debts';
const PAYMENTS_KEY = 'safespend_debt_payments';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalDebts = (): Debt[] => {
  const raw = localStorage.getItem(DEBTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalDebts = (debts: Debt[]): void => {
  localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
};

const getLocalPayments = (): DebtPayment[] => {
  const raw = localStorage.getItem(PAYMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalPayments = (payments: DebtPayment[]): void => {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const initDebtTables = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY NOT NULL,
      personName TEXT NOT NULL,
      originalAmount REAL NOT NULL,
      remainingAmount REAL NOT NULL,
      direction TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      isSettled INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY NOT NULL,
      debtId TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    );
  `);
};

export const getAllDebts = async (): Promise<Debt[]> => {
  if (!isNative()) return getLocalDebts();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM debts ORDER BY createdAt DESC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      personName: row.personName as string,
      originalAmount: row.originalAmount as number,
      remainingAmount: row.remainingAmount as number,
      direction: row.direction as 'owed_to_me' | 'i_owe',
      description: row.description as string,
      isSettled: Boolean(row.isSettled),
      createdAt: row.createdAt as string,
    }));
  } catch {
    return [];
  }
};

export const createDebt = async (
  data: Omit<Debt, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>
): Promise<Debt> => {
  const debt: Debt = {
    ...data,
    id: generateId(),
    remainingAmount: data.originalAmount,
    isSettled: false,
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalDebts([debt, ...getLocalDebts()]);
    return debt;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO debts (id, personName, originalAmount, remainingAmount, direction, description, isSettled, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [debt.id, debt.personName, debt.originalAmount, debt.remainingAmount,
     debt.direction, debt.description, debt.createdAt]
  );
  return debt;
};

export const getDebtPayments = async (debtId: string): Promise<DebtPayment[]> => {
  if (!isNative()) {
    return getLocalPayments()
      .filter((p) => p.debtId === debtId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC',
    [debtId]
  );
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    debtId: row.debtId as string,
    amount: row.amount as number,
    note: row.note as string,
    date: row.date as string,
  }));
};

export const recordDebtPayment = async (
  debtId: string,
  amount: number,
  note: string
): Promise<void> => {
  const payment: DebtPayment = {
    id: generateId(),
    debtId,
    amount,
    note,
    date: new Date().toISOString(),
  };

  if (!isNative()) {
    saveLocalPayments([payment, ...getLocalPayments()]);
    const debts = getLocalDebts();
    saveLocalDebts(debts.map((d) => {
      if (d.id !== debtId) return d;
      const remaining = Math.max(0, d.remainingAmount - amount);
      return { ...d, remainingAmount: remaining, isSettled: remaining === 0 };
    }));
    return;
  }

  const db = getDatabase();
  await db.run(
    'INSERT INTO debt_payments (id, debtId, amount, note, date) VALUES (?, ?, ?, ?, ?)',
    [payment.id, payment.debtId, payment.amount, payment.note, payment.date]
  );
  await db.run(
    `UPDATE debts SET
      remainingAmount = MAX(0, remainingAmount - ?),
      isSettled = CASE WHEN MAX(0, remainingAmount - ?) = 0 THEN 1 ELSE 0 END
     WHERE id = ?`,
    [amount, amount, debtId]
  );
};

export const deleteDebt = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalDebts(getLocalDebts().filter((d) => d.id !== id));
    saveLocalPayments(getLocalPayments().filter((p) => p.debtId !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM debts WHERE id = ?', [id]);
  await db.run('DELETE FROM debt_payments WHERE debtId = ?', [id]);
};

export const reopenDebt = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalDebts(getLocalDebts().map((d) =>
      d.id === id ? { ...d, isSettled: false } : d
    ));
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE debts SET isSettled = 0 WHERE id = ?', [id]);
};
