import { useState, useEffect, useCallback } from 'react';
import type { Budget } from '../types';
import {
  getBudgetsWithSpending,
  upsertBudget,
  deleteBudget,
} from '../db/budgets';

interface UseBudgetsReturn {
  budgets: Budget[];
  isLoading: boolean;
  addOrUpdateBudget: (data: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useBudgets = (): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getBudgetsWithSpending();
      setBudgets(data);
    } catch (err) {
      console.error('Budget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrUpdateBudget = async (
    data: Omit<Budget, 'id' | 'spent'>
  ): Promise<void> => {
    await upsertBudget(data);
    await refresh();
  };

  const removeBudget = async (id: string): Promise<void> => {
    await deleteBudget(id);
    await refresh();
  };

  return { budgets, isLoading, addOrUpdateBudget, removeBudget, refresh };
};
