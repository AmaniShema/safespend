import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllTransactions, addTransaction } from '../db/transactions';
import { getAllAccounts, createAccount } from '../db/accounts';
import { getAllCategories, createCategory } from '../db/categories';
import { getAllBudgets, upsertBudget } from '../db/budgets';
import { getAllBudgetItems, addBudgetItem } from '../db/budgetItems';
import { getTotalBudget, saveTotalBudget } from '../db/totalBudget';
import { getSetting, setSetting } from '../db/settings';

export interface BackupData {
  version: string;
  exportedAt: string;
  transactions: Awaited<ReturnType<typeof getAllTransactions>>;
  accounts: Awaited<ReturnType<typeof getAllAccounts>>;
  categories: Awaited<ReturnType<typeof getAllCategories>>;
  budgets: Awaited<ReturnType<typeof getAllBudgets>>;
  budgetItems: Awaited<ReturnType<typeof getAllBudgetItems>>;
  totalBudget: Awaited<ReturnType<typeof getTotalBudget>>;
  settings: Record<string, string>;
}

const SETTINGS_KEYS = ['currency', 'report_schedule', 'biometric_enabled'];

export const createBackup = async (): Promise<string> => {
  const [transactions, accounts, categories, budgets, budgetItems, totalBudget] =
    await Promise.all([
      getAllTransactions(),
      getAllAccounts(),
      getAllCategories(),
      getAllBudgets(),
      getAllBudgetItems(),
      getTotalBudget(),
    ]);

  const settings: Record<string, string> = {};
  for (const key of SETTINGS_KEYS) {
    const val = await getSetting(key);
    if (val) settings[key] = val;
  }

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    transactions,
    accounts,
    categories: categories.filter((c) => !c.isSystem),
    budgets,
    budgetItems,
    totalBudget,
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
}> => {
  let backup: BackupData;

  try {
    backup = JSON.parse(jsonString) as BackupData;
  } catch {
    throw new Error('Invalid backup file. Please select a valid SafeSpend JSON backup.');
  }

  if (!backup.version || !backup.transactions) {
    throw new Error('This file is not a valid SafeSpend backup.');
  }

  // Restore custom categories first
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
      await createAccount({
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        color: acc.color,
        isDefault: acc.isDefault,
      });
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
      await addTransaction({
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        note: tx.note,
        date: tx.date,
        accountId: tx.accountId || 'default',
      });
      restoredTx++;
    } catch { /* skip */ }
  }

  // Restore budgets
  for (const budget of (backup.budgets || [])) {
    try {
      await upsertBudget({
        category: budget.category,
        limit: budget.limit,
        period: budget.period,
      });
    } catch { /* skip */ }
  }

  // Restore budget items
  const existingItems = await getAllBudgetItems();
  const existingItemNames = new Set(existingItems.map((i) => `${i.categoryId}:${i.name}`));
  for (const item of (backup.budgetItems || [])) {
    const key = `${item.categoryId}:${item.name}`;
    if (existingItemNames.has(key)) continue;
    try {
      await addBudgetItem({
        categoryId: item.categoryId,
        name: item.name,
        plannedAmount: item.plannedAmount,
      });
    } catch { /* skip */ }
  }

  // Restore total budget
  if (backup.totalBudget) {
    try {
      await saveTotalBudget(backup.totalBudget);
    } catch { /* skip */ }
  }

  // Restore settings
  for (const [key, value] of Object.entries(backup.settings || {})) {
    try {
      await setSetting(key, value);
    } catch { /* skip */ }
  }

  return {
    transactions: restoredTx,
    accounts: restoredAccounts,
    categories: restoredCats.size,
  };
};
