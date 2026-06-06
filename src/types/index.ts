export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
  createdAt: string;
  accountId: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isSystem: boolean;
  isDaily: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'mobile' | 'bank' | 'savings' | 'other';
  currency: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
}

export type TransactionCategory = string;
