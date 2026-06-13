import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCurrency } from '../hooks/useCurrency';
import type { Account } from '../types';

const ACCOUNT_TYPES: { value: Account['type']; label: string; emoji: string }[] = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'mobile', label: 'Mobile Money', emoji: '📱' },
  { value: 'bank', label: 'Bank', emoji: '🏦' },
  { value: 'savings', label: 'Savings', emoji: '🏧' },
  { value: 'other', label: 'Other', emoji: '💼' },
];

const COLORS = [
  '#10b981', '#3b82f6', '#f97316', '#a855f7',
  '#eab308', '#ef4444', '#06b6d4', '#ec4899',
];

const Accounts = () => {
  const navigate = useNavigate();
  const { accounts, addAccount, removeAccount, makeDefault } = useAccounts();
  const { transactions } = useTransactions();
  const { currency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('cash');
  const [color, setColor] = useState(COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const getAccountBalance = (accountId: string): number => {
    return transactions
      .filter((t) => t.accountId === accountId)
      .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  };

  const totalBalance = transactions.reduce((sum, t) =>
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter an account name'); return; }
    setIsSaving(true);
    setError('');
    try {
      await addAccount({ name: name.trim(), type, currency, color, isDefault: false });
      setShowForm(false);
      setName('');
      setType('cash');
      setColor(COLORS[0]);
    } catch {
      setError('Failed to create account');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Accounts</h1>
        <button onClick={() => setShowForm(true)} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Account</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Account Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MTN Mobile Money"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Type</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                    type === t.value
                      ? 'border-white bg-white/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-xs text-gray-400">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <p className="text-gray-400 text-sm mb-2">Color</p>
            <div className="flex gap-2 mb-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-4">
          <p className="text-gray-400 text-sm">Total Balance (All Accounts)</p>
          <p className={`text-3xl font-bold mt-1 ${totalBalance < 0 ? 'text-red-400' : 'text-white'}`}>
            {totalBalance >= 0 ? '+' : ''}{totalBalance.toLocaleString()} {currency}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <p className="text-gray-500 text-xs px-1 mb-3">
          ⭐ Tap "Set Default" to make any account the default for new transactions
        </p>

        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              balance={getAccountBalance(account.id)}
              onDelete={removeAccount}
              onSetDefault={makeDefault}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;
