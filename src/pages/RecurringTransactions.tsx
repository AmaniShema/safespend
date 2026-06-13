import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, Pause, Play } from 'lucide-react';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useCategories } from '../hooks/useCategories';
import { useCurrency } from '../hooks/useCurrency';
import { getAllAccounts, getDefaultAccountId } from '../db/accounts';
import { formatCurrency } from '../utils/currency';
import type { Account } from '../types';

const RecurringTransactions = () => {
  const navigate = useNavigate();
  const { recurring, addRecurring, toggleActive, removeRecurring, isLoading } = useRecurringTransactions();
  const { categories } = useCategories();
  const { currency } = useCurrency();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [selectedAccountId, setSelectedAccountId] = useState('default');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const accs = await getAllAccounts();
      setAccounts(accs);
      const defaultId = await getDefaultAccountId();
      setSelectedAccountId(defaultId);
    };
    load();
  }, []);

  const displayCategories = type === 'expense'
    ? categories.filter((c) => c.id !== 'salary')
    : categories;

  const openCreateForm = () => {
    setName('');
    setAmount('');
    setType('expense');
    setSelectedCategory('food');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter a name'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return; }

    setIsSaving(true);
    setError('');
    try {
      await addRecurring({
        name: name.trim(),
        amount: parsed,
        type,
        category: selectedCategory,
        accountId: selectedAccountId,
        frequency,
        nextDueDate: new Date(startDate).toISOString(),
      });
      setShowForm(false);
    } catch {
      setError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryInfo = (id: string) => categories.find((c) => c.id === id);
  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || 'Default';

  const active = recurring.filter((r) => r.isActive);
  const paused = recurring.filter((r) => !r.isActive);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Recurring Transactions</h1>
        <button onClick={openCreateForm} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Recurring Transaction</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Netflix, Salary..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Type</p>
            <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700 mb-4">
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

            <p className="text-gray-400 text-sm mb-2">Amount</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RF</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
              />
            </div>

            <p className="text-gray-400 text-sm mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                    selectedCategory === cat.id
                      ? 'border-white bg-white/10 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs text-center leading-tight">
                    {cat.name.length > 8 ? cat.name.substring(0, 7) + '…' : cat.name}
                  </span>
                </button>
              ))}
            </div>

            {accounts.length > 1 && (
              <>
                <p className="text-gray-400 text-sm mb-2">Account</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                        selectedAccountId === acc.id
                          ? 'border-white bg-white/10 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-gray-400 text-sm mb-2">Frequency</p>
            <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700 mb-4">
              <button
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  frequency === 'weekly' ? 'bg-white/20 text-white' : 'text-gray-500'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  frequency === 'monthly' ? 'bg-white/20 text-white' : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Starting</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4"
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Create Recurring Transaction'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Active {active.length > 0 && `(${active.length})`}
          </p>

          {isLoading ? (
            <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
          ) : active.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-3xl mb-2">🔁</p>
              <p className="text-gray-400 text-sm">No recurring transactions yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to add rent, salary, subscriptions...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((r) => {
                const cat = getCategoryInfo(r.category);
                const dueDate = new Date(r.nextDueDate);
                const isDue = dueDate <= new Date();
                return (
                  <div key={r.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: (cat?.color || '#6b7280') + '25' }}
                        >
                          {cat?.emoji || '🔁'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{r.name}</p>
                          <p className="text-gray-500 text-xs capitalize">
                            {r.frequency} • {getAccountName(r.accountId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${r.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, currency)}
                        </span>
                        <button onClick={() => toggleActive(r.id)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                          <Pause size={14} />
                        </button>
                        <button onClick={() => removeRecurring(r.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${isDue ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {isDue ? 'Due now' : `Next: ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {paused.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Paused ({paused.length})</p>
            <div className="space-y-2">
              {paused.map((r) => {
                const cat = getCategoryInfo(r.category);
                return (
                  <div key={r.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg opacity-50">{cat?.emoji || '🔁'}</span>
                      <div>
                        <p className="text-gray-400 text-sm font-medium">{r.name}</p>
                        <p className="text-gray-600 text-xs">{formatCurrency(r.amount, currency)} • {r.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(r.id)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                        <Play size={14} />
                      </button>
                      <button onClick={() => removeRecurring(r.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-gray-600 text-xs px-1">
          💡 When a recurring transaction is due, you'll see it on the Home screen. Tap "Add Now" to review and confirm it.
        </p>
      </div>
    </div>
  );
};

export default RecurringTransactions;
