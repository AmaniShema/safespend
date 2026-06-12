import jsPDF from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { Transaction, Account, Category } from '../types';
import type { SavingsGoal, SavingsTransaction } from '../db/savingsGoals';
import { formatCurrency } from './currency';
import { getAllCategories } from '../db/categories';

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  food: [249, 115, 22],
  transport: [59, 130, 246],
  shopping: [168, 85, 247],
  rent: [234, 179, 8],
  travel: [6, 182, 212],
  health: [239, 68, 68],
  entertainment: [236, 72, 153],
  salary: [16, 185, 129],
  daily: [99, 102, 241],
  other: [107, 114, 128],
};

const formatDuration = (days: number): string => {
  if (days <= 0) return 'less than a day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  const monthLabel = months === 1 ? '1 month' : `${months} months`;
  if (remDays === 0) return monthLabel;
  return `${monthLabel} ${remDays} day${remDays === 1 ? '' : 's'}`;
};

export const exportToPdf = async (
  transactions: Transaction[],
  currency: string,
  accounts: Account[] = [],
  categories: Category[] = [],
  savingsGoals: SavingsGoal[] = [],
  savingsTransactions: SavingsTransaction[] = [],
  periodStart?: Date,
  periodEnd?: Date,
  allTransactions: Transaction[] = []
): Promise<void> => {

  let allCategories = categories;
  if (allCategories.length === 0) {
    allCategories = await getAllCategories();
  }

  const fullHistory = allTransactions.length > 0 ? allTransactions : transactions;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const getAccountName = (accountId: string): string => {
    if (!accountId) return 'Default';
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Default';
  };

  const getCategoryInfo = (categoryId: string): { name: string; color: [number, number, number] } => {
    const cat = allCategories.find((c) => c.id === categoryId);
    const name = cat?.name || categoryId;
    const color = CATEGORY_COLORS[categoryId] || [107, 114, 128];
    return { name, color };
  };

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SafeSpend', 14, 18);
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Report', 14, 28);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })}`,
    14, 35
  );

  if (periodStart && periodEnd) {
    doc.setFontSize(9);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    doc.text(`Period: ${fmt(periodStart)} - ${fmt(periodEnd)}`, pageWidth - 14, 35, { align: 'right' });
  } else if (accounts.length > 1) {
    doc.setFontSize(9);
    doc.text(
      `Accounts: ${accounts.map((a) => a.name).join(', ')}`,
      pageWidth - 14, 35, { align: 'right' }
    );
  }

  y = 55;

  // Summary cards
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const cardW = (pageWidth - 28 - 8) / 3;

  doc.setFillColor(6, 78, 59);
  doc.roundedRect(14, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.text('INCOME', 14 + cardW / 2, y + 7, { align: 'center' });
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalIncome, currency), 14 + cardW / 2, y + 16, { align: 'center' });

  const x2 = 14 + cardW + 4;
  doc.setFillColor(127, 29, 29);
  doc.roundedRect(x2, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EXPENSES', x2 + cardW / 2, y + 7, { align: 'center' });
  doc.setTextColor(252, 165, 165);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalExpenses, currency), x2 + cardW / 2, y + 16, { align: 'center' });

  const x3 = 14 + (cardW + 4) * 2;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(x3, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BALANCE', x3 + cardW / 2, y + 7, { align: 'center' });
  doc.setTextColor(balance >= 0 ? 52 : 252, balance >= 0 ? 211 : 165, balance >= 0 ? 153 : 165);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(balance, currency), x3 + cardW / 2, y + 16, { align: 'center' });

  y += 32;

  // ── Per-account summary ───────────────────────────────
  const usedAccountIds = new Set(transactions.map((t) => t.accountId || 'default'));
  const usedAccounts = accounts.length > 0
    ? accounts.filter((a) => usedAccountIds.has(a.id))
    : [];

  if (usedAccounts.length > 0) {
    checkNewPage(15);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Summary', 14, y);
    y += 7;

    usedAccounts.forEach((account) => {
      const accTx = transactions.filter((t) => (t.accountId || 'default') === account.id);
      const accIncome = accTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const accExpenses = accTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      if (periodStart) {
        // Opening / Closing balance mode
        checkNewPage(38);

        const openingBalance = fullHistory
          .filter((t) => (t.accountId || 'default') === account.id && new Date(t.date) < periodStart)
          .reduce((sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount), 0);
        const closingBalance = openingBalance + accIncome - accExpenses;

        // Header bar
        doc.setFillColor(31, 41, 55);
        doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${account.name} (${account.type})`, 18, y + 5.5);
        y += 10;

        const rows: [string, string, [number, number, number]][] = [
          ['Opening Balance', formatCurrency(openingBalance, currency), [156, 163, 175]],
          ['+ Income', formatCurrency(accIncome, currency), [52, 211, 153]],
          ['- Expenses', formatCurrency(accExpenses, currency), [252, 165, 165]],
        ];

        rows.forEach(([label, value, color]) => {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(label, 20, y + 4);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(value, pageWidth - 17, y + 4, { align: 'right' });
          y += 6;
        });

        // Closing balance - highlighted
        doc.setFillColor(6, 78, 59);
        doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Closing Balance', 20, y + 5.5);
        doc.setTextColor(52, 211, 153);
        doc.text(formatCurrency(closingBalance, currency), pageWidth - 17, y + 5.5, { align: 'right' });
        y += 12;
      } else {
        // Simple net balance mode (Export All)
        checkNewPage(10);
        const accBalance = accIncome - accExpenses;
        doc.setFillColor(31, 41, 55);
        doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
        doc.setTextColor(209, 213, 219);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${account.name} (${account.type})`, 18, y + 5.5);
        doc.text(`${accTx.length} transactions`, pageWidth / 2, y + 5.5, { align: 'center' });
        doc.setTextColor(accBalance >= 0 ? 52 : 252, accBalance >= 0 ? 211 : 165, accBalance >= 0 ? 153 : 165);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(accBalance, currency), pageWidth - 17, y + 5.5, { align: 'right' });
        y += 10;
      }
    });
    y += 4;
  }

  // Transactions table
  checkNewPage(20);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Transactions', 14, y);
  y += 8;

  doc.setFillColor(31, 41, 55);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', 17, y + 5.5);
  doc.text('NOTE', 45, y + 5.5);
  doc.text('CATEGORY', 95, y + 5.5);
  doc.text('ACCOUNT', 133, y + 5.5);
  doc.text('AMOUNT', pageWidth - 17, y + 5.5, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  transactions.forEach((t, i) => {
    checkNewPage(9);
    if (i % 2 === 0) {
      doc.setFillColor(243, 244, 246);
      doc.rect(14, y - 1, pageWidth - 28, 8, 'F');
    }

    const date = new Date(t.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: '2-digit',
    });

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(7.5);
    doc.text(date, 17, y + 4.5);

    const note = t.note.length > 20 ? t.note.substring(0, 18) + '..' : t.note;
    doc.text(note, 45, y + 4.5);

    const { name: catName, color } = getCategoryInfo(t.category);
    const badgeLabel = catName.length > 9 ? catName.substring(0, 8) + '.' : catName.toUpperCase();
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(93, y + 0.5, 32, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(badgeLabel, 109, y + 4.5, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const accName = getAccountName(t.accountId);
    const accShort = accName.length > 11 ? accName.substring(0, 10) + '.' : accName;
    doc.text(accShort, 133, y + 4.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      t.type === 'income' ? 16 : 220,
      t.type === 'income' ? 185 : 38,
      t.type === 'income' ? 129 : 38
    );
    doc.text(
      `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`,
      pageWidth - 17, y + 4.5, { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');
    y += 9;
  });

  // ── Savings Goals section ─────────────────────────────
  if (savingsGoals.length > 0) {
    y += 8;
    checkNewPage(15);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Savings Goals', 14, y);
    y += 8;

    const completedThisPeriod: { name: string; days: number }[] = [];

    savingsGoals.forEach((goal) => {
      checkNewPage(20);

      const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      const isComplete = goal.currentAmount >= goal.targetAmount;

      doc.setFillColor(31, 41, 55);
      doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(goal.name, 18, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `${formatCurrency(goal.currentAmount, currency)} / ${formatCurrency(goal.targetAmount, currency)} (${pct.toFixed(0)}%)`,
        pageWidth - 17, y + 5.5, { align: 'right' }
      );
      y += 9;

      doc.setFillColor(55, 65, 81);
      doc.roundedRect(14, y, pageWidth - 28, 2.5, 1, 1, 'F');
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(14, y, (pageWidth - 28) * (pct / 100), 2.5, 1, 1, 'F');
      y += 6;

      const goalTx = savingsTransactions.filter((t) => t.goalId === goal.id);

      if (periodStart && periodEnd) {
        const periodTx = goalTx.filter((t) => {
          const d = new Date(t.date);
          return d >= periodStart && d <= periodEnd;
        });

        if (periodTx.length > 0) {
          periodTx
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach((tx) => {
              checkNewPage(6);
              doc.setFontSize(7.5);
              doc.setTextColor(100, 116, 139);
              const date = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              doc.text(`  ${date}`, 18, y + 4);
              doc.text(tx.note || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'), 45, y + 4);
              doc.setTextColor(
                tx.type === 'deposit' ? 16 : 220,
                tx.type === 'deposit' ? 185 : 38,
                tx.type === 'deposit' ? 129 : 38
              );
              doc.setFont('helvetica', 'bold');
              doc.text(
                `${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(tx.amount, currency)}`,
                pageWidth - 17, y + 4, { align: 'right' }
              );
              doc.setFont('helvetica', 'normal');
              y += 6;
            });
        }

        const sorted = [...goalTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let cumulative = 0;
        let completionDate: Date | null = null;
        let cumulativeBeforePeriod = 0;

        for (const tx of sorted) {
          const d = new Date(tx.date);
          const delta = tx.type === 'deposit' ? tx.amount : -tx.amount;
          if (d < periodStart) cumulativeBeforePeriod += delta;
          cumulative += delta;
          if (!completionDate && cumulative >= goal.targetAmount) {
            completionDate = d;
          }
        }

        if (
          completionDate &&
          completionDate >= periodStart &&
          completionDate <= periodEnd &&
          cumulativeBeforePeriod < goal.targetAmount
        ) {
          const created = new Date(goal.createdAt);
          const days = Math.round((completionDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          completedThisPeriod.push({ name: goal.name, days });
        }
      }

      if (isComplete) {
        checkNewPage(6);
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text('  Goal reached', 18, y + 4);
        y += 6;
      }

      y += 3;
    });

    if (completedThisPeriod.length > 0) {
      y += 4;
      checkNewPage(10 + completedThisPeriod.length * 7);
      doc.setFillColor(6, 78, 59);
      doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
      doc.setTextColor(52, 211, 153);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Goals Completed This Period', 18, y + 5.5);
      y += 11;

      completedThisPeriod.forEach((g) => {
        checkNewPage(7);
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'normal');
        doc.text(g.name, 18, y + 4);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(`Completed in ${formatDuration(g.days)}`, pageWidth - 17, y + 4, { align: 'right' });
        y += 7;
      });
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(17, 24, 39);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SafeSpend — Private & Offline', 14, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  const fileName = `safespend_${new Date().toISOString().split('T')[0]}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1];
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const fileUri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'SafeSpend Report', url: fileUri.uri, dialogTitle: 'Save or share your report' });
  } else {
    doc.save(fileName);
  }
};
