import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getSetting, setSetting } from '../db/settings';
import { getTransactionsByMonth, getAllTransactions } from '../db/transactions';
import { getAllAccounts } from '../db/accounts';
import { getAllCategories } from '../db/categories';
import { getAllGoals, getAllSavingsTransactions } from '../db/savingsGoals';
import { exportToPdf } from './exportPdf';

export type ReportSchedule = 'monthly' | 'weekly' | 'off';

const LAST_REPORT_KEY = 'last_report_date';
const SCHEDULE_KEY = 'report_schedule';

export const getReportSchedule = async (): Promise<ReportSchedule> => {
  const val = await getSetting(SCHEDULE_KEY);
  return (val as ReportSchedule) || 'monthly';
};

export const setReportSchedule = async (schedule: ReportSchedule): Promise<void> => {
  await setSetting(SCHEDULE_KEY, schedule);
};

export const getLastReportDate = async (): Promise<string | null> => {
  return getSetting(LAST_REPORT_KEY);
};

const sendNotification = async (title: string, body: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        schedule: { at: new Date(Date.now() + 1000) },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: null,
      }],
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
};

const isMonthlyReportDue = (lastReportDate: string | null): boolean => {
  const now = new Date();
  if (!lastReportDate) return now.getDate() >= 1;
  const last = new Date(lastReportDate);
  return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
};

const isWeeklyReportDue = (lastReportDate: string | null): boolean => {
  if (!lastReportDate) return true;
  const last = new Date(lastReportDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 7;
};

export const checkAndGenerateReport = async (currency: string): Promise<boolean> => {
  try {
    const schedule = await getReportSchedule();
    if (schedule === 'off') return false;

    const lastReport = await getLastReportDate();
    const isDue = schedule === 'monthly'
      ? isMonthlyReportDue(lastReport)
      : isWeeklyReportDue(lastReport);

    if (!isDue) return false;

    const now = new Date();
    let transactions: Awaited<ReturnType<typeof getTransactionsByMonth>>;
    let periodStart: Date;
    let periodEnd: Date;

    if (schedule === 'monthly') {
      const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      transactions = await getTransactionsByMonth(reportYear, reportMonth);
      periodStart = new Date(reportYear, reportMonth - 1, 1);
      periodEnd = new Date(reportYear, reportMonth, 0, 23, 59, 59);
    } else {
      const allTx = await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      transactions = allTx.filter((t) => new Date(t.date) >= cutoff);
      periodStart = cutoff;
      periodEnd = now;
    }

    if (transactions.length === 0) return false;

    const accounts = await getAllAccounts();
    const cats = await getAllCategories();
    const goals = await getAllGoals();
    const goalTx = await getAllSavingsTransactions();
    const allTx = await getAllTransactions();
    await exportToPdf(transactions, currency, accounts, cats, goals, goalTx, periodStart, periodEnd, allTx);
    await setSetting(LAST_REPORT_KEY, now.toISOString());

    const label = schedule === 'monthly' ? 'Monthly' : 'Weekly';
    await sendNotification(
      `SafeSpend ${label} Report Ready`,
      `Your ${label.toLowerCase()} financial report has been generated.`
    );

    return true;
  } catch (err) {
    console.error('Report generation error:', err);
    return false;
  }
};

export const generateManualReport = async (
  currency: string,
  period: 'this_month' | 'last_month' | 'this_week'
): Promise<void> => {
  const now = new Date();
  let transactions: Awaited<ReturnType<typeof getTransactionsByMonth>>;
  let periodStart: Date;
  let periodEnd: Date;

  if (period === 'this_month') {
    transactions = await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'last_month') {
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    transactions = await getTransactionsByMonth(year, month);
    periodStart = new Date(year, month - 1, 1);
    periodEnd = new Date(year, month, 0, 23, 59, 59);
  } else {
    const allTx = await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    transactions = allTx.filter((t) => new Date(t.date) >= cutoff);
    periodStart = cutoff;
    periodEnd = now;
  }

  if (transactions.length === 0) throw new Error('No transactions found for this period');

  const accounts = await getAllAccounts();
  const cats = await getAllCategories();
  const goals = await getAllGoals();
  const goalTx = await getAllSavingsTransactions();
  const allTx = await getAllTransactions();
  await exportToPdf(transactions, currency, accounts, cats, goals, goalTx, periodStart, periodEnd, allTx);
  await setSetting(LAST_REPORT_KEY, now.toISOString());
};
