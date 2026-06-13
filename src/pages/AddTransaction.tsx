import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Clock, ChevronDown } from 'lucide-react';
import { addTransaction } from '../db/transactions';
import { getLastPurchase, TRACKED_CATEGORIES } from '../db/tracker';
import { getAllAccounts, getDefaultAccountId } from '../db/accounts';
import { getAllCategories } from '../db/categories';
import type { Account, Category } from '../types';

const daysBetween = (dateStr: string): number => {
  const past = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return Math.round((now - past) / (1000 * 60 * 60 * 24));
};

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { prefillAmount?: number; prefillNote?: string; prefillType?: 'income' | 'expense' } | null) || null;
  const [type, setType] = useState<'expense' | 'income'>(prefill?.prefillType || 'expense');
  const [amount, setAmount] = useState(prefill?.prefillAmount ? String(prefill.prefillAmount) : '');
  const [selectedCategory, setSelectedCategory] = useState<string>(prefill?.prefillType === 'income' ? 'salary' : 'food');
  const [note, setNote] = useState(prefill?.prefillNote || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastPurchaseHint, setLastPurchaseHint] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [allAccounts, allCategories] = await Promise.all([
        getAllAccounts(),
        getAllCategories(),
      ]);
      setAccounts(allAccounts);
      setCategories(allCategories);
      const defaultId = await getDefaultAccountId();
      setSelectedAccountId(defaultId);
    };
    load();
  }, []);

  useEffect(() => {
    const check = async () => {
      if (
        note.trim().length < 2 ||
        !TRACKED_CATEGORIES.includes(selectedCategory) ||
        type !== 'expense'
      ) {
        setLastPurchaseHint(null);
        return;
      }
      const last = await getLastPurchase(note, selectedCategory);
      if (last) {
        const days = daysBetween(last.date);
        if (days === 0) setLastPurchaseHint('You bought this today');
        else if (days === 1) setLastPurchaseHint('You last bought this yesterday');
        else setLastPurchaseHint(`You last bought this ${days} days ago`);
      } else {
        setLastPurchaseHint(null);
      }
    };
    const timeout = setTimeout(check, 400);
    return () => clearTimeout(timeout);
  }, [note, selectedCategory, type]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const displayCategories = type === 'expense'
    ? categories.filter((c) => c.id !== 'salary')
    : categories;

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
        category: selectedCategory,
        note: note.trim() || selectedCategory,
        date: new Date(date).toISOString(),
        accountId: selectedAccountId,
      });
      navigate('/');
    } catch {
      setError('Failed to save transaction');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="text-gray-400">
          <X size={24} />
        </button>
        <h1 className="text-lg font-semibold">Add Transaction</h1>
        <div className="w-6" />
      </div>

      {showAccountPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Select Account</h2>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => { setSelectedAccountId(acc.id); setShowAccountPicker(false); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span className="text-white text-sm">{acc.name}</span>
                    {acc.isDefault && <span className="text-yellow-400 text-xs">Default</span>}
                  </div>
                  {selectedAccountId === acc.id && <Check size={16} className="text-emerald-400" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAccountPicker(false)} className="w-full mt-4 py-3 text-gray-400 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Type toggle */}
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-gray-500'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'
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

        {/* Account selector */}
        {accounts.length > 1 && (
          <div>
            <p className="text-gray-400 text-sm mb-2">Account</p>
            <button
              onClick={() => setShowAccountPicker(true)}
              className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedAccount?.color || '#10b981' }} />
                <span className="text-white text-sm">{selectedAccount?.name || 'Default'}</span>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </div>
        )}

        {/* Category */}
        <div>
          <p className="text-gray-400 text-sm mb-3">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                  selectedCategory === cat.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">
                  {cat.name.length > 10 ? cat.name.substring(0, 9) + '…' : cat.name}
                </span>
                {cat.isDaily && (
                  <span className="text-indigo-400 text-xs leading-none">random</span>
                )}
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
          {lastPurchaseHint && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Clock size={12} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">{lastPurchaseHint}</p>
            </div>
          )}
          {TRACKED_CATEGORIES.includes(selectedCategory) && type === 'expense' && (
            <p className="text-gray-600 text-xs mt-1.5 px-1">
              💡 Cycle tracking active for this category
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
