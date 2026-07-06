import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllTransactions, addTransaction } from '../db/transactions';
import { getAllAccounts, createAccount } from '../db/accounts';
import { getAllCategories, createCategory } from '../db/categories';
import { getAllBudgets, upsertBudget } from '../db/budgets';
import { getAllBudgetItems, addBudgetItem } from '../db/budgetItems';
import { getTotalBudget, saveTotalBudget } from '../db/totalBudget';
import { getAllGoals, getAllSavingsTransactions, createGoal, addGoalTransaction } from '../db/savingsGoals';
import { getAllRecurring, createRecurring } from '../db/recurringTransactions';
import { getAllDebts, getDebtPayments, createDebt, recordDebtPayment } from '../db/debts';
import { getAllMembers, getAllContributions, addMember, addContribution } from '../db/household';
import { getSetting, setSetting } from '../db/settings';

const SETTINGS_KEYS = ['currency', 'report_schedule', 'biometric_enabled', 'theme'];

export const createBackup = async (): Promise<string> => {
  const [
    transactions, accounts, categories, budgets, budgetItems, totalBudget,
    savingsGoals, savingsTransactions, recurring, debts,
    householdMembers, householdContributions,
  ] = await Promise.all([
    getAllTransactions(),
    getAllAccounts(),
    getAllCategories(),
    getAllBudgets(),
    getAllBudgetItems(),
    getTotalBudget(),
    getAllGoals(),
    getAllSavingsTransactions(),
    getAllRecurring(),
    getAllDebts(),
    getAllMembers(),
    getAllContributions(),
  ]);

  // Get debt payments for all debts
  const debtPayments = await Promise.all(
    debts.map(async (d) => ({
      debtId: d.id,
      payments: await getDebtPayments(d.id),
    }))
  );

  const settings: Record<string, string> = {};
  for (const key of SETTINGS_KEYS) {
    const val = await getSetting(key);
    if (val) settings[key] = val;
  }

  const backup = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    transactions,
    accounts,
    categories: categories.filter((c) => !c.isSystem),
    budgets,
    budgetItems,
    totalBudget,
    savingsGoals,
    savingsTransactions,
    recurring,
    debts,
    debtPayments,
    householdMembers,
    householdContributions,
    settings,
  };

  return JSON.stringify(backup, null, 2);
};

export const exportBackup = async (): Promise<void> => {
  const json = await createBackup();
  const fileName = `safespend_backup_${new Date().toISOString().split('T')[0]}.json`;

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
    });
    const fileUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });
    await Share.share({
      title: 'SafeSpend Backup',
      url: fileUri.uri,
      dialogTitle: 'Save your backup file',
    });
  } else {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
};

export const importBackup = async (jsonString: string): Promise<{
  transactions: number;
  accounts: number;
  categories: number;
  savingsGoals: number;
  recurring: number;
  debts: number;
  householdMembers: number;
}> => {
  let backup: ReturnType<typeof JSON.parse>;

  try {
    backup = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid backup file. Please select a valid SafeSpend JSON backup.');
  }

  if (!backup.version || !backup.transactions) {
    throw new Error('This file is not a valid SafeSpend backup.');
  }

  // Restore custom categories
  const restoredCats = new Set<string>();
  for (const cat of (backup.categories || [])) {
    try {
      await createCategory({ name: cat.name, emoji: cat.emoji, color: cat.color });
      restoredCats.add(cat.id);
    } catch { /* skip duplicates */ }
  }

  // Restore accounts
  const existingAccounts = await getAllAccounts();
  const existingAccountIds = new Set(existingAccounts.map((a) => a.id));
  let restoredAccounts = 0;
  for (const acc of (backup.accounts || [])) {
    if (existingAccountIds.has(acc.id)) continue;
    try {
      await createAccount({ name: acc.name, type: acc.type, currency: acc.currency, color: acc.color, isDefault: acc.isDefault });
      restoredAccounts++;
    } catch { /* skip */ }
  }

  // Restore transactions
  const existing = await getAllTransactions();
  const existingIds = new Set(existing.map((t) => t.id));
  let restoredTx = 0;
  for (const tx of (backup.transactions || [])) {
    if (existingIds.has(tx.id)) continue;
    try {
      await addTransaction({ amount: tx.amount, type: tx.type, category: tx.category, note: tx.note, date: tx.date, accountId: tx.accountId || 'default' });
      restoredTx++;
    } catch { /* skip */ }
  }

  // Restore budgets
  for (const budget of (backup.budgets || [])) {
    try { await upsertBudget({ category: budget.category, limit: budget.limit, period: budget.period }); } catch { /* skip */ }
  }

  // Restore budget items
  const existingItems = await getAllBudgetItems();
  const existingItemNames = new Set(existingItems.map((i) => `${i.categoryId}:${i.name}`));
  for (const item of (backup.budgetItems || [])) {
    if (existingItemNames.has(`${item.categoryId}:${item.name}`)) continue;
    try { await addBudgetItem({ categoryId: item.categoryId, name: item.name, plannedAmount: item.plannedAmount }); } catch { /* skip */ }
  }

  // Restore total budget
  if (backup.totalBudget) {
    try { await saveTotalBudget(backup.totalBudget); } catch { /* skip */ }
  }

  // Restore savings goals
  const existingGoals = await getAllGoals();
  const existingGoalIds = new Set(existingGoals.map((g) => g.id));
  let restoredGoals = 0;
  for (const goal of (backup.savingsGoals || [])) {
    if (existingGoalIds.has(goal.id)) continue;
    try {
      await createGoal({ name: goal.name, emoji: goal.emoji, color: goal.color, targetAmount: goal.targetAmount });
      restoredGoals++;
    } catch { /* skip */ }
  }

  // Restore savings transactions
  const existingSavingsTx = await getAllSavingsTransactions();
  const existingSavingsTxIds = new Set(existingSavingsTx.map((t) => t.id));
  for (const tx of (backup.savingsTransactions || [])) {
    if (existingSavingsTxIds.has(tx.id)) continue;
    try { await addGoalTransaction(tx.goalId, tx.amount, tx.type, tx.note); } catch { /* skip */ }
  }

  // Restore recurring transactions
  const existingRecurring = await getAllRecurring();
  const existingRecurringIds = new Set(existingRecurring.map((r) => r.id));
  let restoredRecurring = 0;
  for (const r of (backup.recurring || [])) {
    if (existingRecurringIds.has(r.id)) continue;
    try {
      await createRecurring({ name: r.name, amount: r.amount, type: r.type, category: r.category, accountId: r.accountId, frequency: r.frequency, nextDueDate: r.nextDueDate });
      restoredRecurring++;
    } catch { /* skip */ }
  }

  // Restore debts
  const existingDebts = await getAllDebts();
  const existingDebtIds = new Set(existingDebts.map((d) => d.id));
  let restoredDebts = 0;
  for (const debt of (backup.debts || [])) {
    if (existingDebtIds.has(debt.id)) continue;
    try {
      await createDebt({ personName: debt.personName, originalAmount: debt.originalAmount, direction: debt.direction, description: debt.description });
      restoredDebts++;
    } catch { /* skip */ }
  }

  // Restore debt payments
  for (const dp of (backup.debtPayments || [])) {
    for (const payment of (dp.payments || [])) {
      try { await recordDebtPayment(dp.debtId, payment.amount, payment.note); } catch { /* skip */ }
    }
  }

  // Restore household members
  const existingMembers = await getAllMembers();
  const existingMemberNames = new Set(existingMembers.map((m) => m.name.toLowerCase()));
  let restoredMembers = 0;
  for (const member of (backup.householdMembers || [])) {
    if (existingMemberNames.has(member.name.toLowerCase())) continue;
    try { await addMember(member.name); restoredMembers++; } catch { /* skip */ }
  }

  // Restore household contributions
  const existingContribs = await getAllContributions();
  const existingContribKeys = new Set(existingContribs.map((c) => `${c.contributorId}:${c.month}`));
  for (const contrib of (backup.householdContributions || [])) {
    if (existingContribKeys.has(`${contrib.contributorId}:${contrib.month}`)) continue;
    try { await addContribution(contrib.contributorId, contrib.amount, contrib.month, contrib.note); } catch { /* skip */ }
  }

  // Restore settings
  for (const [key, value] of Object.entries(backup.settings || {})) {
    try { await setSetting(key, value as string); } catch { /* skip */ }
  }

  return {
    transactions: restoredTx,
    accounts: restoredAccounts,
    categories: restoredCats.size,
    savingsGoals: restoredGoals,
    recurring: restoredRecurring,
    debts: restoredDebts,
    householdMembers: restoredMembers,
  };
};
