import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import BudgetCard from '../components/BudgetCard';
import { useBudgets } from '../hooks/useBudgets';
import { useCurrency } from '../hooks/useCurrency';
import type { TransactionCategory } from '../types';

const CATEGORIES: { value: TransactionCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'rent', label: 'Rent', emoji: '🏠' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'health', label: 'Health', emoji: '❤️' },
  { value: 'entertainment', label: 'Fun', emoji: '🎬' },
  { value: 'other', label: 'Other', emoji: '···' },
];

const Budgets = () => {
  const navigate = useNavigate();
  const { budgets, addOrUpdateBudget, removeBudget } = useBudgets();
  const { currency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const parsed = parseFloat(limit);
    if (!limit || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await addOrUpdateBudget({ category, limit: parsed, period });
      setShowForm(false);
      setLimit('');
      setCategory('food');
    } catch {
      setError('Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Budget Limits</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-emerald-400"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Add budget form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Set Budget Limit</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Period toggle */}
            <div className="flex bg-gray-800 rounded-xl p-1 mb-4">
              <button
                onClick={() => setPeriod('monthly')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'monthly'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'weekly'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-500'
                }`}
              >
                Weekly
              </button>
            </div>

            {/* Category */}
            <p className="text-gray-400 text-sm mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                    category === cat.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Amount */}
            <p className="text-gray-400 text-sm mb-2">Limit Amount</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400 font-medium">RF</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0"
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="p-4 space-y-3">
        {budgets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💰</p>
            <p className="text-gray-400 text-sm">No budgets set yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              Tap + to set your first spending limit.
            </p>
          </div>
        ) : (
          budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              currency={currency}
              onDelete={removeBudget}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Budgets;
