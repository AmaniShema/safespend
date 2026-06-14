import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { RecurringTransaction } from '../db/recurringTransactions';
import { formatCurrency } from '../utils/currency';
import { useCategories } from '../hooks/useCategories';

interface DueNowCardProps {
  dueItems: RecurringTransaction[];
  currency: string;
  onAddNow: (item: RecurringTransaction) => void;
}

const DueNowCard = ({ dueItems, currency, onAddNow }: DueNowCardProps) => {
  const navigate = useNavigate();
  const { categories } = useCategories();

  const getCategoryInfo = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="mx-4 mt-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold text-sm">Due Now</p>
            <p className="text-gray-500 text-xs">
              {dueItems.length} recurring transaction{dueItems.length !== 1 ? 's' : ''} to add
            </p>
          </div>
          <button
            onClick={() => navigate('/recurring')}
            className="flex items-center gap-1 text-gray-400 text-xs"
          >
            Manage <ChevronRight size={13} />
          </button>
        </div>

        <div className="space-y-2">
          {dueItems.map((item) => {
            const cat = getCategoryInfo(item.category);
            return (
              <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{cat?.emoji || '🔁'}</span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DueNowCard;
