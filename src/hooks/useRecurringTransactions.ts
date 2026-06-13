import { useState, useEffect, useCallback } from 'react';
import type { RecurringTransaction } from '../db/recurringTransactions';
import {
  getAllRecurring,
  createRecurring,
  toggleRecurringActive,
  deleteRecurring,
  advanceRecurring,
  initRecurringTable,
} from '../db/recurringTransactions';

interface UseRecurringReturn {
  recurring: RecurringTransaction[];
  dueItems: RecurringTransaction[];
  isLoading: boolean;
  addRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  markAdded: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useRecurringTransactions = (): UseRecurringReturn => {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initRecurringTable();
      const data = await getAllRecurring();
      setRecurring(data);
    } catch (err) {
      console.error('Recurring transactions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'isActive'>): Promise<void> => {
    await createRecurring(data);
    await refresh();
  };

  const toggleActive = async (id: string): Promise<void> => {
    await toggleRecurringActive(id);
    await refresh();
  };

  const removeRecurring = async (id: string): Promise<void> => {
    await deleteRecurring(id);
    await refresh();
  };

  const markAdded = async (id: string): Promise<void> => {
    await advanceRecurring(id);
    await refresh();
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dueItems = recurring.filter(
    (r) => r.isActive && new Date(r.nextDueDate) <= today
  );

  return { recurring, dueItems, isLoading, addRecurring, toggleActive, removeRecurring, markAdded, refresh };
};
