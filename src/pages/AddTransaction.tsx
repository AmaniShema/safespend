import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Clock } from 'lucide-react';
import type { TransactionCategory } from '../types';
import { addTransaction } from '../db/transactions';
import { getLastPurchase, TRACKED_CATEGORIES } from '../db/tracker';

const categories: { value: TransactionCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'rent', label: 'Rent', emoji: '🏠' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'health', label: 'Health', emoji: '❤️' },
  { value: 'entertainment', label: 'Fun', emoji: '🎬' },
  { value: 'salary', label: 'Salary', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '···' },
];

const daysBetween = (dateStr: string): number => {
  const past = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return Math.round((now - past) / (1000 * 60 * 60 * 24));
};

const AddTransaction = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastPurchaseHint, setLastPurchaseHint] = useState<string | null>(null);

  // Check last purchase when note or category changes
  useEffect(() => {
    const check = async () => {
      if (
        note.trim().length < 2 ||
        !TRACKED_CATEGORIES.includes(category) ||
        type !== 'expense'
      ) {
        setLastPurchaseHint(null);
        return;
      }

      const last = await getLastPurchase(note, category);
      if (last) {
        const days = daysBetween(last.date);
        if (days === 0) {
          setLastPurchaseHint('You bought this today');
        } else if (days === 1) {
          setLastPurchaseHint('You last bought this yesterday');
        } else {
          setLastPurchaseHint(`You last bought this ${days} days ago`);
        }
      } else {
        setLastPurchaseHint(null);
      }
    };

    const timeout = setTimeout(check, 400);
    return () => clearTimeout(timeout);
  }, [note, category, type]);

  const handleSave = async (): Promise<void> => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await addTransaction({
        amount: parsed,
        type,
        category,
        note: note.trim() || category,
        date: new Date(date).toISOString(),
      });
      navigate('/');
    } catch {
      setError('Failed to save transaction');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="text-gray-400">
          <X size={24} />
        </button>
        <h1 className="text-lg font-semibold">Add Transaction</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Type toggle */}
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'expense'
                ? 'bg-red-500/20 text-red-400'
                : 'text-gray-500'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-500'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl text-gray-400 font-light">RF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-5xl font-bold text-white text-center w-48 outline-none placeholder-gray-700"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Category */}
        <div>
          <p className="text-gray-400 text-sm mb-3">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                  category === cat.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Note</p>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Cooking gas, Electricity bill..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors placeholder-gray-700"
          />

          {/* Last purchase hint */}
          {lastPurchaseHint && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Clock size={12} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">{lastPurchaseHint}</p>
            </div>
          )}

          {/* Tracker notice */}
          {TRACKED_CATEGORIES.includes(category) && type === 'expense' && (
            <p className="text-gray-600 text-xs mt-1.5 px-1">
              💡 Cycle tracking is active for this category
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Date</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Check size={20} />
          {isSaving ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </div>
  );
};

export default AddTransaction;
