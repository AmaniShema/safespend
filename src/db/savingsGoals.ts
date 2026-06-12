import { getDatabase, isNative } from './database';

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  goalId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  note: string;
  date: string;
}

const GOALS_KEY = 'safespend_savings_goals';
const TX_KEY = 'safespend_savings_transactions';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalGoals = (): SavingsGoal[] => {
  const raw = localStorage.getItem(GOALS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalGoals = (goals: SavingsGoal[]): void => {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

const getLocalTx = (): SavingsTransaction[] => {
  const raw = localStorage.getItem(TX_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalTx = (tx: SavingsTransaction[]): void => {
  localStorage.setItem(TX_KEY, JSON.stringify(tx));
};

export const initSavingsTables = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS savings_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      goalId TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    );
  `);
};

export const getAllGoals = async (): Promise<SavingsGoal[]> => {
  if (!isNative()) return getLocalGoals();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM savings_goals ORDER BY createdAt ASC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      emoji: row.emoji as string,
      color: row.color as string,
      targetAmount: row.targetAmount as number,
      currentAmount: row.currentAmount as number,
      createdAt: row.createdAt as string,
    }));
  } catch {
    return [];
  }
};

export const createGoal = async (
  data: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'>
): Promise<SavingsGoal> => {
  const goal: SavingsGoal = {
    ...data,
    id: generateId(),
    currentAmount: 0,
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalGoals([...getLocalGoals(), goal]);
    return goal;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO savings_goals (id, name, emoji, color, targetAmount, currentAmount, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [goal.id, goal.name, goal.emoji, goal.color, goal.targetAmount, goal.createdAt]
  );
  return goal;
};

export const deleteGoal = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalGoals(getLocalGoals().filter((g) => g.id !== id));
    saveLocalTx(getLocalTx().filter((t) => t.goalId !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM savings_goals WHERE id = ?', [id]);
  await db.run('DELETE FROM savings_transactions WHERE goalId = ?', [id]);
};

export const getGoalTransactions = async (goalId: string): Promise<SavingsTransaction[]> => {
  if (!isNative()) {
    return getLocalTx()
      .filter((t) => t.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM savings_transactions WHERE goalId = ? ORDER BY date DESC',
    [goalId]
  );
  return (result.values || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    goalId: row.goalId as string,
    amount: row.amount as number,
    type: row.type as 'deposit' | 'withdrawal',
    note: row.note as string,
    date: row.date as string,
  }));
};

export const getAllSavingsTransactions = async (): Promise<SavingsTransaction[]> => {
  if (!isNative()) return getLocalTx();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM savings_transactions ORDER BY date DESC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      goalId: row.goalId as string,
      amount: row.amount as number,
      type: row.type as 'deposit' | 'withdrawal',
      note: row.note as string,
      date: row.date as string,
    }));
  } catch {
    return [];
  }
};

export const addGoalTransaction = async (
  goalId: string,
  amount: number,
  type: 'deposit' | 'withdrawal',
  note: string
): Promise<void> => {
  const tx: SavingsTransaction = {
    id: generateId(),
    goalId,
    amount,
    type,
    note,
    date: new Date().toISOString(),
  };

  const delta = type === 'deposit' ? amount : -amount;

  if (!isNative()) {
    saveLocalTx([tx, ...getLocalTx()]);
    const goals = getLocalGoals();
    saveLocalGoals(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) }
          : g
      )
    );
    return;
  }

  const db = getDatabase();
  await db.run(
    `INSERT INTO savings_transactions (id, goalId, amount, type, note, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tx.id, tx.goalId, tx.amount, tx.type, tx.note, tx.date]
  );
  await db.run(
    `UPDATE savings_goals SET currentAmount = MAX(0, currentAmount + ?) WHERE id = ?`,
    [delta, goalId]
  );
};
