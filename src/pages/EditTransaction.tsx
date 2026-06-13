import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Check, Clock, ChevronDown } from 'lucide-react';
import { getAllTransactions, updateTransaction } from '../db/transactions';
import { getLastPurchase, TRACKED_CATEGORIES } from '../db/tracker';
import { getAllAccounts } from '../db/accounts';
import { getAllCategories } from '../db/categories';
import type { Account, Category } from '../types';

const daysBetween = (dateStr: string): number => {
  const past = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return Math.round((now - past) / (1000 * 60 * 60 * 24));
};

const EditTransaction = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastPurchaseHint, setLastPurchaseHint] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('default');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [allTx, allAccounts, allCategories] = await Promise.all([
        getAllTransactions(),
        getAllAccounts(),
        getAllCategories(),
      ]);
      const tx = allTx.find((t) => t.id === id);
      if (tx) {
        setType(tx.type);
        setAmount(String(tx.amount));
        setSelectedCategory(tx.category);
        setNote(tx.note);
        setDate(tx.date.split('T')[0]);
        setSelectedAccountId(tx.accountId || 'default');
      }
      setAccounts(allAccounts);
      setCategories(allCategories);
      setIsLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    const check = async () => {
      if (note.trim().length < 2 || !TRACKED_CATEGORIES.includes(selectedCategory) || type !== 'expense') {
        setLastPurchaseHint(null);
        return;
      }
      const last = await getLastPurchase(note, selectedCategory);
      if (last && last.id !== id) {
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
  }, [note, selectedCategory, type, id]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const displayCategories = type === 'expense'
    ? categories.filter((c) => c.id !== 'salary')
    : categories;

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await updateTransaction(id!, {
        amount: parsed,
        type,
        category: selectedCategory,
        note: note.trim() || selectedCategory,
        date: new Date(date).toISOString(),
        accountId: selectedAccountId,
      });
      navigate(-1);
    } catch {
      setError('Failed to update transaction');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <X size={24} />
        </button>
        <h1 className="text-lg font-semibold">Edit Transaction</h1>
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
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span className="text-white text-sm">{acc.name}</span>
                  </div>
                  {selectedAccountId === acc.id && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAccountPicker(false)} className="w-full mt-4 py-3 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-gray-500'}`}
          >Expense</button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'}`}
          >Income</button>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl text-gray-400 font-light">RF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-5xl font-bold text-white text-center w-48 outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

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

        <div>
          <p className="text-gray-400 text-sm mb-3">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                  selectedCategory === cat.id
                    ? 'border-white bg-white/10 text-white'
                    : 'border-gray-800 bg-gray-900 text-gray-400'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">
                  {cat.name.length > 10 ? cat.name.substring(0, 9) + '…' : cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Note</p>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-white transition-colors"
          />
          {lastPurchaseHint && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Clock size={12} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">{lastPurchaseHint}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Date</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check size={20} />
          {isSaving ? 'Saving...' : 'Update Transaction'}
        </button>
      </div>
    </div>
  );
};

export default EditTransaction;
