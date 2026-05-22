export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'rent'
  | 'travel'
  | 'health'
  | 'entertainment'
  | 'salary'
  | 'other';
