import { useState, useEffect, useCallback } from 'react';
import type { TotalBudget } from '../db/totalBudget';
import { getTotalBudget, saveTotalBudget, deleteTotalBudget } from '../db/totalBudget';

interface UseTotalBudgetReturn {
  totalBudget: TotalBudget | null;
  isLoading: boolean;
  save: (budget: TotalBudget) => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTotalBudget = (): UseTotalBudgetReturn => {
  const [totalBudget, setTotalBudget] = useState<TotalBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTotalBudget();
      setTotalBudget(data);
    } catch (err) {
      console.error('TotalBudget error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (budget: TotalBudget): Promise<void> => {
    await saveTotalBudget(budget);
    await refresh();
  };

  const remove = async (): Promise<void> => {
    await deleteTotalBudget();
    setTotalBudget(null);
  };

  return { totalBudget, isLoading, save, remove, refresh };
};
