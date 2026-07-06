import { useState, useEffect, useCallback } from 'react';
import type { Contributor, HouseholdContribution } from '../db/household';
import {
  getAllMembers,
  getAllContributions,
  addMember,
  toggleMemberStatus,
  deleteMember,
  addContribution,
  updateContribution,
  setContributionRecorded,
  deleteContribution,
  initHouseholdTable,
  getCurrentMonth,
} from '../db/household';

interface UseHouseholdReturn {
  members: Contributor[];
  contributions: HouseholdContribution[];
  currentMonth: string;
  totalFund: number;
  isLoading: boolean;
  addPerson: (name: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  addMonthContribution: (contributorId: string, amount: number, month: string, note: string) => Promise<HouseholdContribution>;
  editContribution: (id: string, amount: number, note: string) => Promise<void>;
  markRecorded: (id: string, recorded: boolean) => Promise<void>;
  removeContribution: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useHousehold = (): UseHouseholdReturn => {
  const [members, setMembers] = useState<Contributor[]>([]);
  const [contributions, setContributions] = useState<HouseholdContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = getCurrentMonth();

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await initHouseholdTable();
      const [m, c] = await Promise.all([getAllMembers(), getAllContributions()]);
      setMembers(m);
      setContributions(c);
    } catch (err) {
      console.error('Household error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addPerson = async (name: string): Promise<void> => {
    await addMember(name);
    await refresh();
  };

  const toggleStatus = async (id: string): Promise<void> => {
    await toggleMemberStatus(id);
    await refresh();
  };

  const removePerson = async (id: string): Promise<void> => {
    await deleteMember(id);
    await refresh();
  };

  const addMonthContribution = async (
    contributorId: string, amount: number, month: string, note: string
  ): Promise<HouseholdContribution> => {
    const c = await addContribution(contributorId, amount, month, note);
    await refresh();
    return c;
  };

  const editContribution = async (id: string, amount: number, note: string): Promise<void> => {
    await updateContribution(id, amount, note);
    await refresh();
  };

  const markRecorded = async (id: string, recorded: boolean): Promise<void> => {
    await setContributionRecorded(id, recorded);
    await refresh();
  };

  const removeContribution = async (id: string): Promise<void> => {
    await deleteContribution(id);
    await refresh();
  };

  // Total fund = all recorded contributions
  const totalFund = contributions
    .filter((c) => c.recorded)
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    members, contributions, currentMonth, totalFund, isLoading,
    addPerson, toggleStatus, removePerson,
    addMonthContribution, editContribution, markRecorded, removeContribution,
    refresh,
  };
};
