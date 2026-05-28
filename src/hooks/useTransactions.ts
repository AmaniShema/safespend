import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '../types';
import {
  getAllTransactions,
  addTransaction,
  deleteTransaction,
  getTotalBalance,
} from '../db/transactions';

interface UseTransactionsReturn {
  transactions: Transaction[];
  totalBalance: number;
  isLoading: boolean;
  error: string | null;
  addNewTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [txs, balance] = await Promise.all([
        getAllTransactions(),
        getTotalBalance(),
      ]);
      setTransactions(txs);
      setTotalBalance(balance);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNewTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<void> => {
    await addTransaction(data);
    await refresh();
  };

  const removeTransaction = async (id: string): Promise<void> => {
    await deleteTransaction(id);
    await refresh();
  };

  return {
    transactions,
    totalBalance,
    isLoading,
    error,
    addNewTransaction,
    removeTransaction,
    refresh,
  };
};
