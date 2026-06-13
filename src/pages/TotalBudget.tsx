import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTotalBudget } from '../hooks/useTotalBudget';
import { useCategories } from '../hooks/useCategories';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';
import type { CategoryAllocation } from '../db/totalBudget';

const TotalBudget = () => {
  const navigate = useNavigate();
  const { totalBudget, save, remove } = useTotalBudget();
  const { categories } = useCategories();
  const { currency } = useCurrency();

  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (totalBudget) {
      setAmount(String(totalBudget.amount));
      setPeriod(totalBudget.period);
      setAllocations(totalBudget.allocations);
    }
  }, [totalBudget]);

  const totalAmount = parseFloat(amount) || 0;
  const allocatedTotal = allocations.reduce((s, a) => s + a.amount, 0);
  const unallocated = totalAmount - allocatedTotal;
  const isOverAllocated = allocatedTotal > totalAmount;

  const handleAddAllocation = () => {
    const parsed = parseFloat(allocationAmount);
    if (!selectedCategory || !allocationAmount || isNaN(parsed) || parsed <= 0) return;
    if (parsed > unallocated + (allocations.find(a => a.categoryId === selectedCategory)?.amount || 0)) {
      setError('Amount exceeds remaining budget');
      return;
    }
    setError('');
    setAllocations((prev) => {
      const existing = prev.find((a) => a.categoryId === selectedCategory);
      if (existing) {
        return prev.map((a) =>
          a.categoryId === selectedCategory ? { ...a, amount: parsed } : a
        );
      }
      return [...prev, { categoryId: selectedCategory, amount: parsed }];
    });
    setAllocationAmount('');
    setSelectedCategory('');
    setShowAddAllocation(false);
  };

  const handleRemoveAllocation = (categoryId: string) => {
    setAllocations((prev) => prev.filter((a) => a.categoryId !== categoryId));
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid total budget');
      return;
    }
    if (isOverAllocated) {
      setError('Allocations exceed total budget');
      return;
    }
    setIsSaving(true);
    try {
      await save({ amount: parsed, period, allocations });
      navigate(-1);
    } catch {
      setError('Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;

  const getCategoryEmoji = (id: string) =>
    categories.find((c) => c.id === id)?.emoji || '📦';

  const unallocatedCategories = categories.filter(
    (c) => !allocations.find((a) => a.categoryId === c.id) && c.id !== 'salary'
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Total Budget</h1>
        {totalBudget && (
          <button onClick={remove} className="text-red-400">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Period */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Budget Period</p>
          <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
            <button
              onClick={() => setPeriod('monthly')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                period === 'monthly' ? 'bg-white/20 text-white' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                period === 'weekly' ? 'bg-white/20 text-white' : 'text-gray-500'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Total amount */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Total Budget Amount</p>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <span className="text-gray-400 font-medium text-lg">RF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-white text-2xl font-bold flex-1 outline-none"
            />
          </div>
        </div>

        {/* Budget overview */}
        {totalAmount > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex justify-between mb-3">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-white font-bold">{formatCurrency(totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-400 text-sm">Allocated</span>
              <span className={`font-bold ${isOverAllocated ? 'text-red-400' : 'text-white'}`}>
                {formatCurrency(allocatedTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-400 text-sm">Unallocated</span>
              <span className={`font-bold ${unallocated < 0 ? 'text-red-400' : 'text-white'}`}>
                {formatCurrency(Math.abs(unallocated), currency)}
                {unallocated < 0 ? ' over' : ' free'}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverAllocated ? 'bg-red-400' : 'bg-white'
                }`}
                style={{ width: `${Math.min((allocatedTotal / totalAmount) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Allocations */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-400 text-sm">Category Allocations</p>
            {unallocatedCategories.length > 0 && totalAmount > 0 && (
              <button
                onClick={() => setShowAddAllocation(true)}
                className="flex items-center gap-1 text-white text-sm"
              >
                <Plus size={16} />
                Add
              </button>
            )}
          </div>

          {allocations.length === 0 ? (
            <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500 text-sm">No allocations yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Set your total budget first, then allocate to categories
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allocations.map((alloc) => {
                const pct = totalAmount > 0 ? (alloc.amount / totalAmount) * 100 : 0;
                return (
                  <div key={alloc.categoryId} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryEmoji(alloc.categoryId)}</span>
                        <span className="text-white text-sm font-medium">
                          {getCategoryName(alloc.categoryId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          {formatCurrency(alloc.amount, currency)}
                        </span>
                        <button onClick={() => handleRemoveAllocation(alloc.categoryId)}>
                          <Trash2 size={14} className="text-gray-600 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add allocation modal */}
        {showAddAllocation && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
            <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
              <p className="text-white font-semibold mb-4">Allocate to Category</p>

              <p className="text-gray-400 text-sm mb-2">Category</p>
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-40 overflow-y-auto">
                {unallocatedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                      selectedCategory === cat.id
                        ? 'border-white bg-white/10'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {cat.name.length > 8 ? cat.name.substring(0, 7) + '…' : cat.name}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-gray-400 text-sm mb-2">
                Amount (max: {formatCurrency(Math.max(0, unallocated), currency)})
              </p>
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
                <span className="text-gray-400">RF</span>
                <input
                  type="number"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddAllocation(false); setError(''); }}
                  className="flex-1 py-3 text-gray-400 bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAllocation}
                  className="flex-1 py-3 bg-white text-black font-bold rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {error && !showAddAllocation && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Budget'}
        </button>
      </div>
    </div>
  );
};

export default TotalBudget;
