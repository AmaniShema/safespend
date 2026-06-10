import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Car, Home, Utensils, Plane, Heart, Tv, ArrowDownCircle, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { deleteTransaction } from '../db/transactions';

interface TransactionListProps {
  transactions: Transaction[];
  currency?: string;
  categoryMap?: Record<string, { name: string; emoji: string }>;
  onRefresh?: () => void;
}

const defaultIcons: Record<string, ReactNode> = {
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

const defaultColors: Record<string, string> = {
  food: 'bg-orange-500/20 text-orange-400',
  transport: 'bg-blue-500/20 text-blue-400',
  shopping: 'bg-purple-500/20 text-purple-400',
  rent: 'bg-yellow-500/20 text-yellow-400',
  travel: 'bg-cyan-500/20 text-cyan-400',
  health: 'bg-red-500/20 text-red-400',
  entertainment: 'bg-pink-500/20 text-pink-400',
  salary: 'bg-emerald-500/20 text-emerald-400',
  daily: 'bg-indigo-500/20 text-indigo-400',
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

const TransactionList = ({
  transactions,
  currency = 'RWF',
  categoryMap = {},
  onRefresh,
}: TransactionListProps) => {
  const navigate = useNavigate();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedTx) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selectedTx.id);
      setSelectedTx(null);
      setShowDeleteConfirm(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryStyle = (category: string): string => {
    return defaultColors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const getCategoryIcon = (category: string): ReactNode => {
    return defaultIcons[category] || <MoreHorizontal size={16} />;
  };

  const getCategoryEmoji = (category: string): string => {
    return categoryMap[category]?.emoji || '';
  };

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
      {/* Action sheet */}
      {selectedTx && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full border-t border-gray-800">
            {/* Transaction preview */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{selectedTx.note}</p>
                  <p className="text-gray-400 text-sm capitalize">
                    {categoryMap[selectedTx.category]?.name || selectedTx.category} • {formatDate(selectedTx.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${selectedTx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(selectedTx.amount, currency)}
                  </span>
                  <button onClick={() => setSelectedTx(null)}>
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  navigate(`/edit-transaction/${selectedTx.id}`);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Pencil size={18} className="text-emerald-400" />
                <span className="text-white text-sm font-medium">Edit Transaction</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={18} className="text-red-400" />
                <span className="text-red-400 text-sm font-medium">Delete Transaction</span>
              </button>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full p-3 text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && selectedTx && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
            <p className="text-white font-semibold text-center mb-2">Delete Transaction?</p>
            <p className="text-gray-400 text-sm text-center mb-6">
              "{selectedTx.note}" — {formatCurrency(selectedTx.amount, currency)} will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setSelectedTx(null); }}
                className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Recent Transactions</h3>
        <button
          onClick={() => navigate('/transactions')}
          className="text-emerald-400 text-sm"
        >
          View All
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {transactions.map((tx, index) => {
          const isIncome = tx.type === 'income';
          const emoji = getCategoryEmoji(tx.category);
          const iconStyle = getCategoryStyle(tx.category);
          const icon = emoji
            ? <span className="text-sm">{emoji}</span>
            : getCategoryIcon(tx.category);

          return (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors ${
                index !== transactions.length - 1 ? 'border-b border-gray-800' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.note}</p>
                <p className="text-gray-500 text-xs mt-0.5 capitalize">
                  {categoryMap[tx.category]?.name || tx.category} • {formatDate(tx.date)}
                </p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;
