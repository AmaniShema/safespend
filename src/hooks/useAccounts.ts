import { useState, useEffect, useCallback } from 'react';
import type { Account } from '../types';
import {
  getAllAccounts,
  createAccount,
  deleteAccount,
  initDefaultAccount,
} from '../db/accounts';

interface UseAccountsReturn {
  accounts: Account[];
  isLoading: boolean;
  addAccount: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAccounts = (): UseAccountsReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initDefaultAccount();
      const data = await getAllAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Accounts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAccount = async (data: Omit<Account, 'id' | 'createdAt'>): Promise<void> => {
    await createAccount(data);
    await refresh();
  };

  const removeAccount = async (id: string): Promise<void> => {
    await deleteAccount(id);
    await refresh();
  };

  return { accounts, isLoading, addAccount, removeAccount, refresh };
};
