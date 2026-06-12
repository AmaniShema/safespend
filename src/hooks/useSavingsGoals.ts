import { useState, useEffect, useCallback } from 'react';
import type { SavingsGoal } from '../db/savingsGoals';
import {
  getAllGoals,
  createGoal,
  deleteGoal,
  addGoalTransaction,
  initSavingsTables,
} from '../db/savingsGoals';

interface UseSavingsGoalsReturn {
  goals: SavingsGoal[];
  isLoading: boolean;
  addGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contribute: (goalId: string, amount: number, type: 'deposit' | 'withdrawal', note: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSavingsGoals = (): UseSavingsGoalsReturn => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initSavingsTables();
      const data = await getAllGoals();
      setGoals(data);
    } catch (err) {
      console.error('Savings goals error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'>): Promise<void> => {
    await createGoal(data);
    await refresh();
  };

  const removeGoal = async (id: string): Promise<void> => {
    await deleteGoal(id);
    await refresh();
  };

  const contribute = async (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdrawal',
    note: string
  ): Promise<void> => {
    await addGoalTransaction(goalId, amount, type, note);
    await refresh();
  };

  return { goals, isLoading, addGoal, removeGoal, contribute, refresh };
};
