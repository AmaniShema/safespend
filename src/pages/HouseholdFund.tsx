import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, UserMinus, UserCheck, Pencil } from 'lucide-react';
import { useHousehold } from '../hooks/useHousehold';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';
import type { Contributor } from '../db/household';

const HouseholdFund = () => {
  const navigate = useNavigate();
  const { contributors, totalFund, addPerson, editAmount, toggleStatus, removePerson, isLoading } = useHousehold();
  const { currency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const openAddForm = () => {
    setEditingContributor(null);
    setName('');
    setAmount('');
    setError('');
    setShowForm(true);
  };

  const openEditForm = (c: Contributor) => {
    setEditingContributor(c);
    setName(c.name);
    setAmount(String(c.amount));
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!editingContributor && !name.trim()) { setError('Enter a name'); return; }
    if (!amount || isNaN(parsed) || parsed < 0) { setError('Enter a valid amount'); return; }

    setIsSaving(true);
    setError('');
    try {
      if (editingContributor) {
        await editAmount(editingContributor.id, parsed);
      } else {
        await addPerson({ name: name.trim(), amount: parsed });
      }
      setShowForm(false);
      setEditingContributor(null);
      setName('');
      setAmount('');
    } catch {
      setError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const activeContributors = contributors.filter((c) => c.status === 'active');
  const leftContributors = contributors.filter((c) => c.status === 'left');

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Household Fund</h1>
        <button onClick={openAddForm} className="text-emerald-400">
          <Plus size={24} />
        </button>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                {editingContributor ? `Edit ${editingContributor.name}` : 'Add Contributor'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingContributor(null); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {!editingContributor && (
              <>
                <p className="text-gray-400 text-sm mb-2">Name</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SHEMA, Malik, Sam..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 mb-4 placeholder-gray-600"
                  autoFocus
                />
              </>
            )}

            <p className="text-gray-400 text-sm mb-2">Contribution Amount</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RF</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
                autoFocus={!!editingContributor}
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingContributor ? 'Save Changes' : 'Add Contributor'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Total fund */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Household Fund</p>
          <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalFund, currency)}</p>
          <p className="text-gray-500 text-xs mt-1">
            {activeContributors.length} active contributor{activeContributors.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Active contributors */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Active Contributors {activeContributors.length > 0 && `(${activeContributors.length})`}
          </p>

          {isLoading ? (
            <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
          ) : activeContributors.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-3xl mb-2">🏡</p>
              <p className="text-gray-400 text-sm">No contributors yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to add the first one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeContributors.map((c) => {
                const pct = totalFund > 0 ? (c.amount / totalFund) * 100 : 0;
                return (
                  <div key={c.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-500 text-xs">{pct.toFixed(0)}% of fund</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-sm font-semibold">
                          {formatCurrency(c.amount, currency)}
                        </span>
                        <button
                          onClick={() => openEditForm(c)}
                          className="text-gray-500 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-500/10"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className="text-gray-500 hover:text-yellow-400 transition-colors p-1.5 rounded-lg hover:bg-yellow-500/10"
                          title="Mark as left"
                        >
                          <UserMinus size={14} />
                        </button>
                        <button
                          onClick={() => removePerson(c.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Left contributors */}
        {leftContributors.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              No Longer Contributing ({leftContributors.length})
            </p>
            <div className="space-y-2">
              {leftContributors.map((c) => (
                <div key={c.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium line-through">{c.name}</p>
                    <p className="text-gray-600 text-xs">Previously: {formatCurrency(c.amount, currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(c.id)}
                      className="text-gray-500 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-500/10"
                      title="Mark as active again"
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      onClick={() => removePerson(c.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-600 text-xs px-1">
          💡 Mark someone as "left" if they stop contributing — the total fund updates automatically. You can mark them active again anytime.
        </p>
      </div>
    </div>
  );
};

export default HouseholdFund;
