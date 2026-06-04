import type { Budget } from '../types';
import { getDatabase, isNative } from './database';
import { getAllTransactions } from './transactions';

const LOCAL_KEY = 'safespend_budgets';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalBudgets = (): Budget[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalBudgets = (budgets: Budget[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(budgets));
};

export const getAllBudgets = async (): Promise<Budget[]> => {
  if (!isNative()) return getLocalBudgets();
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM budgets'
  );
  return (result.values as Budget[]) || [];
};

export const upsertBudget = async (
  data: Omit<Budget, 'id' | 'spent'>
): Promise<Budget> => {
  const existing = await getAllBudgets();
  const match = existing.find(
    (b) => b.category === data.category && b.period === data.period
  );

  if (match) {
    const updated = { ...match, limit: data.limit };
    if (!isNative()) {
      saveLocalBudgets(existing.map((b) => (b.id === match.id ? updated : b)));
      return updated;
    }
    const db = getDatabase();
    await db.run(
      'UPDATE budgets SET limit_amount = ? WHERE id = ?',
      [data.limit, match.id]
    );
    return updated;
  }

  const budget: Budget = {
    id: generateId(),
    category: data.category,
    limit: data.limit,
    spent: 0,
    period: data.period,
  };

  if (!isNative()) {
    saveLocalBudgets([...existing, budget]);
    return budget;
  }

  const db = getDatabase();
  await db.run(
    `INSERT INTO budgets (id, category, limit_amount, spent, period)
     VALUES (?, ?, ?, 0, ?)`,
    [budget.id, budget.category, budget.limit, budget.period]
  );
  return budget;
};

export const deleteBudget = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalBudgets(getLocalBudgets().filter((b) => b.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM budgets WHERE id = ?', [id]);
};

export const getBudgetsWithSpending = async (): Promise<Budget[]> => {
  const [budgets, transactions] = await Promise.all([
    getAllBudgets(),
    getAllTransactions(),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return budgets.map((budget) => {
    const relevant = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      if (t.category !== budget.category) return false;
      const date = new Date(t.date);
      if (budget.period === 'monthly') {
        return (
          date.getMonth() + 1 === currentMonth &&
          date.getFullYear() === currentYear
        );
      }
      return date >= weekAgo;
    });

    const spent = relevant.reduce((sum, t) => sum + t.amount, 0);
    return { ...budget, spent };
  });
};
