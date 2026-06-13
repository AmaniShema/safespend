import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';

const EMOJI_OPTIONS = ['🎯','📱','🏠','🚗','✈️','🎓','💍','👶','🏥','🛡️','💻','🎉','🏖️','📦'];
const COLOR_OPTIONS = ['#10b981','#3b82f6','#f97316','#a855f7','#eab308','#ef4444','#06b6d4','#ec4899'];

const SavingsGoals = () => {
  const navigate = useNavigate();
  const { goals, addGoal, isLoading } = useSavingsGoals();
  const { currency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter a goal name'); return; }
    const parsed = parseFloat(target);
    if (!target || isNaN(parsed) || parsed <= 0) { setError('Enter a valid target amount'); return; }
    setIsSaving(true);
    setError('');
    try {
      await addGoal({ name: name.trim(), emoji, color, targetAmount: parsed });
      setShowForm(false);
      setName('');
      setTarget('');
      setEmoji('🎯');
      setColor(COLOR_OPTIONS[0]);
    } catch {
      setError('Failed to create goal');
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
        <h1 className="text-lg font-semibold">Savings Goals</h1>
        <button onClick={() => setShowForm(true)} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Savings Goal</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Goal Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Phone, Emergency Fund..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Target Amount</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RF</span>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
              />
            </div>

            <p className="text-gray-400 text-sm mb-2">Icon</p>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-xl transition-colors ${
                    emoji === e ? 'bg-white/20 border border-white' : 'bg-gray-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <p className="text-gray-400 text-sm mb-2">Color</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOR_OPTIONS.map((c) => (
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
              {isSaving ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <p className="text-gray-500 text-sm text-center mt-8">Loading...</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-400 text-sm">No savings goals yet</p>
            <p className="text-gray-600 text-xs mt-1">Tap + to set your first goal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              return (
                <button
                  key={goal.id}
                  onClick={() => navigate(`/savings-goals/${goal.id}`)}
                  className="w-full bg-gray-900 rounded-2xl border border-gray-800 p-4 text-left hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: goal.color + '25' }}
                      >
                        {goal.emoji}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{goal.name}</p>
                        <p className="text-gray-500 text-xs">
                          {formatCurrency(goal.currentAmount, currency)} of {formatCurrency(goal.targetAmount, currency)}
                        </p>
                      </div>
                    </div>
                    {isComplete && <span className="text-2xl">🎉</span>}
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5 text-right">{pct.toFixed(0)}% complete</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
