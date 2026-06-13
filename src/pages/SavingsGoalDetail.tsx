import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, X } from 'lucide-react';
import { getAllGoals, getGoalTransactions, deleteGoal, addGoalTransaction } from '../db/savingsGoals';
import type { SavingsGoal, SavingsTransaction } from '../db/savingsGoals';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';

const SavingsGoalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [showForm, setShowForm] = useState<'deposit' | 'withdrawal' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    const [goals, tx] = await Promise.all([getAllGoals(), getGoalTransactions(id)]);
    setGoal(goals.find((g) => g.id === id) || null);
    setTransactions(tx);
  };

  useEffect(() => { load(); }, [id]);

  if (!goal) return null;

  const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return; }
    if (showForm === 'withdrawal' && parsed > goal.currentAmount) {
      setError('Cannot withdraw more than current savings');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await addGoalTransaction(goal.id, parsed, showForm!, note.trim());
      setAmount('');
      setNote('');
      setShowForm(null);
      await load();
    } catch {
      setError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    await deleteGoal(goal.id);
    navigate('/savings-goals');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{goal.emoji}</span>
          <h1 className="text-lg font-semibold">{goal.name}</h1>
        </div>
        <button onClick={handleDeleteGoal} className="text-red-400">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Add/withdraw modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                {showForm === 'deposit' ? 'Add Money' : 'Withdraw Money'}
              </h2>
              <button onClick={() => { setShowForm(null); setError(''); setAmount(''); setNote(''); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-gray-400 font-light">RF</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-4xl font-bold text-white text-center w-40 outline-none placeholder-gray-700"
                  autoFocus
                />
              </div>
              {showForm === 'withdrawal' && (
                <p className="text-gray-500 text-xs mt-1">
                  Available: {formatCurrency(goal.currentAmount, currency)}
                </p>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-2">Note (optional)</p>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Salary savings, phone purchase..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full font-bold py-3.5 rounded-2xl disabled:opacity-50 ${
                showForm === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : showForm === 'deposit' ? 'Add to Goal' : 'Withdraw'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Progress card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ backgroundColor: goal.color + '25' }}
          >
            {goal.emoji}
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(goal.currentAmount, currency)}</p>
          <p className="text-gray-500 text-sm mt-1">
            of {formatCurrency(goal.targetAmount, currency)} goal
          </p>

          <div className="h-3 bg-gray-800 rounded-full overflow-hidden mt-4">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-gray-500">{pct.toFixed(0)}% complete</span>
            {isComplete ? (
              <span className="text-white">🎉 Goal reached!</span>
            ) : (
              <span className="text-gray-500">{formatCurrency(remaining, currency)} to go</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm('deposit')}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold py-3.5 rounded-2xl"
          >
            <Plus size={18} />
            Add Money
          </button>
          <button
            onClick={() => setShowForm('withdrawal')}
            disabled={goal.currentAmount <= 0}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3.5 rounded-2xl disabled:opacity-40"
          >
            <Minus size={18} />
            Withdraw
          </button>
        </div>

        {/* History */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">History</p>
          {transactions.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500 text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 ${
                    i < transactions.length - 1 ? 'border-b border-gray-800' : ''
                  }`}
                >
                  <div>
                    <p className="text-white text-sm">{tx.note || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal')}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsGoalDetail;
