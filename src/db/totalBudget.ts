import { getSetting, setSetting } from './settings';

export interface CategoryAllocation {
  categoryId: string;
  amount: number;
}

export interface TotalBudget {
  amount: number;
  period: 'monthly' | 'weekly';
  allocations: CategoryAllocation[];
}

const TOTAL_BUDGET_KEY = 'total_budget';

export const getTotalBudget = async (): Promise<TotalBudget | null> => {
  const raw = await getSetting(TOTAL_BUDGET_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TotalBudget;
  } catch {
    return null;
  }
};

export const saveTotalBudget = async (budget: TotalBudget): Promise<void> => {
  await setSetting(TOTAL_BUDGET_KEY, JSON.stringify(budget));
};

export const deleteTotalBudget = async (): Promise<void> => {
  await setSetting(TOTAL_BUDGET_KEY, '');
};

export const getAllocatedTotal = (budget: TotalBudget): number => {
  return budget.allocations.reduce((sum, a) => sum + a.amount, 0);
};

export const getUnallocated = (budget: TotalBudget): number => {
  return budget.amount - getAllocatedTotal(budget);
};

export const getCategoryAllocation = (
  budget: TotalBudget,
  categoryId: string
): number => {
  return budget.allocations.find((a) => a.categoryId === categoryId)?.amount || 0;
};
