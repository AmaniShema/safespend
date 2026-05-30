import jsPDF from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { Transaction } from '../types';
import { formatCurrency } from './currency';

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  food: [249, 115, 22],
  transport: [59, 130, 246],
  shopping: [168, 85, 247],
  rent: [234, 179, 8],
  travel: [6, 182, 212],
  health: [239, 68, 68],
  entertainment: [236, 72, 153],
  salary: [16, 185, 129],
  other: [107, 114, 128],
};

export const exportToPdf = async (
  transactions: Transaction[],
  currency: string
): Promise<void> => {
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

  // Header background
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // App title
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SafeSpend', 14, 18);

  // Subtitle
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Report', 14, 28);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })}`,
    14,
    35
  );

  y = 55;

  // Summary section
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Summary cards
  const cardW = (pageWidth - 28 - 8) / 3;

  // Income card
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(14, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.text('INCOME', 14 + cardW / 2, y + 7, { align: 'center' });
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalIncome, currency), 14 + cardW / 2, y + 16, { align: 'center' });

  // Expense card
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

  // Balance card
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

  // Transactions title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Transactions', 14, y);
  y += 8;

  // Table header
  doc.setFillColor(31, 41, 55);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', 17, y + 5.5);
  doc.text('NOTE', 50, y + 5.5);
  doc.text('CATEGORY', 110, y + 5.5);
  doc.text('AMOUNT', pageWidth - 17, y + 5.5, { align: 'right' });
  y += 10;

  // Rows
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
    doc.setFontSize(8);
    doc.text(date, 17, y + 4.5);

    const note = t.note.length > 30 ? t.note.substring(0, 28) + '...' : t.note;
    doc.text(note, 50, y + 4.5);

    // Category badge
    const color = CATEGORY_COLORS[t.category] || [107, 114, 128];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(108, y + 0.5, 30, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(t.category.toUpperCase(), 123, y + 4.5, { align: 'center' });

    // Amount
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      t.type === 'income' ? 16 : 220,
      t.type === 'income' ? 185 : 38,
      t.type === 'income' ? 129 : 38
    );
    const prefix = t.type === 'income' ? '+' : '-';
    doc.text(
      `${prefix}${formatCurrency(t.amount, currency)}`,
      pageWidth - 17,
      y + 4.5,
      { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');

    y += 9;
  });

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

  // Save and share
  const fileName = `safespend_${new Date().toISOString().split('T')[0]}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1];
    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    const fileUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });
    await Share.share({
      title: 'SafeSpend Report',
      url: fileUri.uri,
      dialogTitle: 'Save or share your report',
    });
  } else {
    doc.save(fileName);
  }
};
