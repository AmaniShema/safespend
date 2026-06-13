import { useState, useEffect, useCallback } from 'react';
import type { Contributor } from '../db/household';
import {
  getAllContributors,
  addContributor,
  updateContributorAmount,
  toggleContributorStatus,
  setContributorRecorded,
  deleteContributor,
  initHouseholdTable,
} from '../db/household';

interface UseHouseholdReturn {
  contributors: Contributor[];
  totalFund: number;
  isLoading: boolean;
  addPerson: (data: { name: string; amount: number }) => Promise<void>;
  editAmount: (id: string, amount: number) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  markRecorded: (id: string, recorded: boolean) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useHousehold = (): UseHouseholdReturn => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initHouseholdTable();
      const data = await getAllContributors();
      setContributors(data);
    } catch (err) {
      console.error('Household error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPerson = async (data: { name: string; amount: number }): Promise<void> => {
    await addContributor(data);
    await refresh();
  };

  const editAmount = async (id: string, amount: number): Promise<void> => {
    await updateContributorAmount(id, amount);
    await refresh();
  };

  const toggleStatus = async (id: string): Promise<void> => {
    await toggleContributorStatus(id);
    await refresh();
  };

  const markRecorded = async (id: string, recorded: boolean): Promise<void> => {
    await setContributorRecorded(id, recorded);
    await refresh();
  };

  const removePerson = async (id: string): Promise<void> => {
    await deleteContributor(id);
    await refresh();
  };

  const totalFund = contributors
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.amount, 0);

  return { contributors, totalFund, isLoading, addPerson, editAmount, toggleStatus, markRecorded, removePerson, refresh };
};
