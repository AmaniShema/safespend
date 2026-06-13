import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import type { RecurringTransaction } from '../db/recurringTransactions';
import { formatCurrency } from '../utils/currency';
import { useCategories } from '../hooks/useCategories';

interface RecurringDueCardProps {
  dueItems: RecurringTransaction[];
  currency: string;
  onAddNow: (item: RecurringTransaction) => void;
}

const RecurringDueCard = ({ dueItems, currency, onAddNow }: RecurringDueCardProps) => {
  const navigate = useNavigate();
  const { categories } = useCategories();

  const getCategoryEmoji = (id: string) =>
    categories.find((c) => c.id === id)?.emoji || '🔁';

  if (dueItems.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-white" />
            <p className="text-white font-semibold text-sm">
              Due Now ({dueItems.length})
            </p>
          </div>
          <button
            onClick={() => navigate('/recurring')}
            className="text-gray-400 text-xs"
          >
            Manage
          </button>
        </div>

        <div className="space-y-2">
          {dueItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-800 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getCategoryEmoji(item.category)}</span>
                <div>
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{item.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                </span>
                <button
                  onClick={() => onAddNow(item)}
                  className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Add Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecurringDueCard;
