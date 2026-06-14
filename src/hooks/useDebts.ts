import { useState, useEffect, useCallback } from 'react';
import type { Debt } from '../db/debts';
import {
  getAllDebts,
  createDebt,
  recordDebtPayment,
  deleteDebt,
  reopenDebt,
  initDebtTables,
} from '../db/debts';

interface UseDebtsReturn {
  debts: Debt[];
  owedToMe: Debt[];
  iOwe: Debt[];
  totalOwedToMe: number;
  totalIOwe: number;
  isLoading: boolean;
  addDebt: (data: Omit<Debt, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>) => Promise<void>;
  makePayment: (debtId: string, amount: number, note: string) => Promise<void>;
  removeDebt: (id: string) => Promise<void>;
  reopen: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDebts = (): UseDebtsReturn => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initDebtTables();
      const data = await getAllDebts();
      setDebts(data);
    } catch (err) {
      console.error('Debts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addDebt = async (
    data: Omit<Debt, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>
  ): Promise<void> => {
    await createDebt(data);
    await refresh();
  };

  const makePayment = async (debtId: string, amount: number, note: string): Promise<void> => {
    await recordDebtPayment(debtId, amount, note);
    await refresh();
  };

  const removeDebt = async (id: string): Promise<void> => {
    await deleteDebt(id);
    await refresh();
  };

  const reopen = async (id: string): Promise<void> => {
    await reopenDebt(id);
    await refresh();
  };

  const activeDebts = debts.filter((d) => !d.isSettled);
  const owedToMe = activeDebts.filter((d) => d.direction === 'owed_to_me');
  const iOwe = activeDebts.filter((d) => d.direction === 'i_owe');
  const totalOwedToMe = owedToMe.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalIOwe = iOwe.reduce((sum, d) => sum + d.remainingAmount, 0);

  return { debts, owedToMe, iOwe, totalOwedToMe, totalIOwe, isLoading, addDebt, makePayment, removeDebt, reopen, refresh };
};
