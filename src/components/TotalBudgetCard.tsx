import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';
import type { TotalBudget } from '../db/totalBudget';
import type { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/currency';

interface TotalBudgetCardProps {
  totalBudget: TotalBudget;
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}

const TotalBudgetCard = ({
  totalBudget,
  transactions,
  categories,
  currency,
}: TotalBudgetCardProps) => {
  const navigate = useNavigate();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const relevantTx = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const date = new Date(t.date);
    if (totalBudget.period === 'monthly') {
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    }
    return date >= weekAgo;
  });

  const totalSpent = relevantTx.reduce((sum, t) => sum + t.amount, 0);
  const totalPercent = Math.min((totalSpent / totalBudget.amount) * 100, 100);
  const isOverTotal = totalSpent > totalBudget.amount;
  const remaining = totalBudget.amount - totalSpent;

  const getCategorySpent = (categoryId: string): number =>
    relevantTx
      .filter((t) => t.category === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;

  const getCategoryEmoji = (id: string) =>
    categories.find((c) => c.id === id)?.emoji || '📦';

  const overBudgetCategories = totalBudget.allocations.filter((a) => {
    const spent = getCategorySpent(a.categoryId);
    return spent > a.amount;
  });

  return (
    <div className="mx-4 mt-4">
      <div
        className={`bg-gray-900 rounded-2xl border p-4 ${
          isOverTotal ? 'border-red-500/40' : 'border-gray-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">Total Budget</p>
            <p className="text-gray-500 text-xs capitalize">{totalBudget.period}</p>
          </div>
          <button
            onClick={() => navigate('/total-budget')}
            className="flex items-center gap-1 text-emerald-400 text-xs"
          >
            Edit <ChevronRight size={14} />
          </button>
        </div>

        {/* Over budget alert */}
        {overBudgetCategories.length > 0 && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-xs font-medium">Over budget in:</p>
              <p className="text-red-300/70 text-xs mt-0.5">
                {overBudgetCategories.map((a) => {
                  const spent = getCategorySpent(a.categoryId);
                  const over = spent - a.amount;
                  return `${getCategoryName(a.categoryId)} (+${formatCurrency(over, currency)})`;
                }).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Total progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">
              {formatCurrency(totalSpent, currency)} spent
            </span>
            <span className={isOverTotal ? 'text-red-400' : 'text-gray-400'}>
              {isOverTotal
                ? `${formatCurrency(Math.abs(remaining), currency)} over`
                : `${formatCurrency(remaining, currency)} left`}
            </span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverTotal ? 'bg-red-400' : totalPercent >= 75 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${totalPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-600">0</span>
            <span className="text-gray-500 font-medium">
              {formatCurrency(totalBudget.amount, currency)}
            </span>
          </div>
        </div>

        {/* Category allocations */}
        {totalBudget.allocations.length > 0 && (
          <div className="space-y-2.5">
            {totalBudget.allocations.map((alloc) => {
              const spent = getCategorySpent(alloc.categoryId);
              const pct = Math.min((spent / alloc.amount) * 100, 100);
              const isOver = spent > alloc.amount;
              const isWarn = pct >= 75 && !isOver;

              return (
                <div key={alloc.categoryId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{getCategoryEmoji(alloc.categoryId)}</span>
                      <span className="text-gray-300 text-xs">
                        {getCategoryName(alloc.categoryId)}
                      </span>
                      {isOver && (
                        <span className="text-red-400 text-xs">⚠️</span>
                      )}
                    </div>
                    <span className={`text-xs ${isOver ? 'text-red-400' : 'text-gray-400'}`}>
                      {formatCurrency(spent, currency)} / {formatCurrency(alloc.amount, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? 'bg-red-400' : isWarn ? 'bg-yellow-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalBudgetCard;
