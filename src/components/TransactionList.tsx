import { ShoppingCart, Car, Home, Utensils, Plane, Heart, Tv, ArrowDownCircle, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';

interface TransactionListProps {
  transactions: Transaction[];
  currency?: string;
}

const categoryIcons: Record<string, ReactNode> = {
  food: <Utensils size={16} />,
  transport: <Car size={16} />,
  shopping: <ShoppingCart size={16} />,
  rent: <Home size={16} />,
  travel: <Plane size={16} />,
  health: <Heart size={16} />,
  entertainment: <Tv size={16} />,
  salary: <ArrowDownCircle size={16} />,
  other: <MoreHorizontal size={16} />,
};

const categoryColors: Record<string, string> = {
  food: 'bg-orange-500/20 text-orange-400',
  transport: 'bg-blue-500/20 text-blue-400',
  shopping: 'bg-purple-500/20 text-purple-400',
  rent: 'bg-yellow-500/20 text-yellow-400',
  travel: 'bg-cyan-500/20 text-cyan-400',
  health: 'bg-red-500/20 text-red-400',
  entertainment: 'bg-pink-500/20 text-pink-400',
  salary: 'bg-emerald-500/20 text-emerald-400',
  other: 'bg-gray-500/20 text-gray-400',
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TransactionList = ({ transactions, currency = 'RWF' }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="mx-4 mt-6">
        <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <p className="text-gray-500 text-sm">No transactions yet.</p>
          <p className="text-gray-600 text-xs mt-1">Tap + to add your first one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Recent Transactions</h3>
        <button className="text-emerald-400 text-sm">View All</button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {transactions.map((tx, index) => {
          const isIncome = tx.type === 'income';
          const iconStyle = categoryColors[tx.category] || categoryColors.other;
          const icon = categoryIcons[tx.category] || categoryIcons.other;

          return (
            <div
              key={tx.id}
              className={`flex items-center gap-4 p-4 ${
                index !== transactions.length - 1 ? 'border-b border-gray-800' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.note}</p>
                <p className="text-gray-500 text-xs mt-0.5 capitalize">
                  {tx.category} • {formatDate(tx.date)}
                </p>
              </div>

              <span className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;
