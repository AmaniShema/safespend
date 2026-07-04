import type { Transaction } from '../types';
import { getAllTransactions } from './transactions';

export const TRACKED_CATEGORIES = ['food', 'health'];

export interface ConsumptionRecord {
  itemName: string;
  category: string;
  purchases: {
    date: string;
    amount: number;
    daysLasted: number | null;
  }[];
  averageDays: number | null;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  estimatedNextDate: string | null;
}

const daysBetween = (dateA: string, dateB: string): number => {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
};

const normalizeItemName = (note: string): string => {
  return note.trim().toLowerCase();
};

export const getConsumptionData = async (): Promise<ConsumptionRecord[]> => {
  const all = await getAllTransactions();

  const tracked = all.filter(
    (t) =>
      t.type === 'expense' &&
      TRACKED_CATEGORIES.includes(t.category) &&
      t.note.trim() !== ''
  );

  const grouped: Record<string, Transaction[]> = {};
  tracked.forEach((t) => {
    const key = `${t.category}::${normalizeItemName(t.note)}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const records: ConsumptionRecord[] = [];

  Object.entries(grouped).forEach(([key, txs]) => {
    if (txs.length < 1) return;

    const [category] = key.split('::');
    const sorted = [...txs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const purchases = sorted.map((tx, i) => {
      const next = sorted[i + 1];
      const daysLasted = next
        ? daysBetween(tx.date, next.date)
        : null;
      return {
        date: tx.date,
        amount: tx.amount,
        daysLasted,
      };
    });

    const completedCycles = purchases
      .filter((p) => p.daysLasted !== null)
      .map((p) => p.daysLasted as number);

    const averageDays =
      completedCycles.length > 0
        ? Math.round(
            completedCycles.reduce((a, b) => a + b, 0) / completedCycles.length
          )
        : null;

    const lastPurchaseDate = sorted[sorted.length - 1].date;
    const daysSinceLastPurchase = daysBetween(
      lastPurchaseDate,
      new Date().toISOString()
    );

    const estimatedNextDate =
      averageDays !== null
        ? new Date(
            new Date(lastPurchaseDate).getTime() +
              averageDays * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0]
        : null;

    records.push({
      itemName: sorted[0].note.trim(),
      category,
      purchases,
      averageDays,
      lastPurchaseDate,
      daysSinceLastPurchase,
      estimatedNextDate,
    });
  });

  return records.sort(
    (a, b) => b.purchases.length - a.purchases.length
  );
};

export const getLastPurchase = async (
  note: string,
  category: string
): Promise<Transaction | null> => {
  const all = await getAllTransactions();
  const matches = all
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === category &&
        normalizeItemName(t.note) === normalizeItemName(note)
    )
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  return matches[0] ?? null;
};
