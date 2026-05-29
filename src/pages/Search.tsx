import { useState, useMemo } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import TransactionList from '../components/TransactionList';
import { useTransactions } from '../hooks/useTransactions';
import { useCurrency } from '../hooks/useCurrency';

const FILTERS = ['All', 'Income', 'Expense'];

const Search = () => {
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const results = useMemo(() => {
    return transactions.filter((t) => {
      const matchesQuery =
        query.trim() === '' ||
        t.note.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase()) ||
        t.amount.toString().includes(query);

      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Income' && t.type === 'income') ||
        (activeFilter === 'Expense' && t.type === 'expense');

      return matchesQuery && matchesFilter;
    });
  }, [transactions, query, activeFilter]);

  const total = results.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="p-4 space-y-3">
        {/* Search input */}
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <SearchIcon size={18} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions..."
            className="bg-transparent text-white flex-1 outline-none text-sm placeholder-gray-600"
            autoFocus
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')}>
              <X size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {query.trim() !== '' || activeFilter !== 'All' ? (
        <div className="px-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-400 text-sm">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            <p className={`text-sm font-semibold ${total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {total >= 0 ? '+' : ''}{total.toLocaleString()} {currency}
            </p>
          </div>
          <TransactionList transactions={results} currency={currency} />
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Quick filters
          </p>
          {['food', 'transport', 'shopping', 'salary', 'rent'].map((cat) => (
            <button
              key={cat}
              onClick={() => setQuery(cat)}
              className="w-full text-left px-4 py-3 bg-gray-900 rounded-xl border border-gray-800 text-gray-300 text-sm capitalize hover:border-gray-600 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Search;
