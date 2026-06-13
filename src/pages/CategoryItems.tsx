import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { getAllCategories } from '../db/categories';
import {
  getBudgetItemsByCategory,
  addBudgetItem,
  deleteBudgetItem,
  type BudgetItem,
} from '../db/budgetItems';
import { getAllTransactions } from '../db/transactions';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';
import type { Category, Transaction } from '../types';

const CategoryItems = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!categoryId) return;
    const [cats, budgetItems, txs] = await Promise.all([
      getAllCategories(),
      getBudgetItemsByCategory(categoryId),
      getAllTransactions(),
    ]);
    setCategory(cats.find((c) => c.id === categoryId) || null);
    setItems(budgetItems);
    setTransactions(txs.filter((t) => t.category === categoryId && t.type === 'expense'));
  };

  useEffect(() => { load(); }, [categoryId]);

  const getItemSpent = (itemName: string): number => {
    return transactions
      .filter((t) => t.note.toLowerCase().includes(itemName.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalPlanned = items.reduce((sum, i) => sum + i.plannedAmount, 0);
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter item name'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter valid amount'); return; }
    setIsSaving(true);
    setError('');
    try {
      await addBudgetItem({
        categoryId: categoryId!,
        name: name.trim(),
        plannedAmount: parsed,
      });
      setName('');
      setAmount('');
      setShowForm(false);
      await load();
    } catch {
      setError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBudgetItem(id);
    await load();
  };

  if (!category) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <h1 className="text-lg font-semibold">{category.name}</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Add Budget Item</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Item Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rice, Salt, Cooking Gas..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Planned Amount</p>
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

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Planned</span>
            <span className="text-white font-bold">{formatCurrency(totalPlanned, currency)}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Spent</span>
            <span className={`font-bold ${totalSpent > totalPlanned && totalPlanned > 0 ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
          {totalPlanned > 0 && (
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${totalSpent > totalPlanned ? 'bg-red-400' : 'bg-white'}`}
                style={{ width: `${Math.min((totalSpent / totalPlanned) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Daily expenses notice */}
        {category.isDaily && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
            <p className="text-indigo-400 text-sm font-medium">🎲 Daily Expenses</p>
            <p className="text-indigo-300/70 text-xs mt-1">
              This category catches random and unexpected spending. Add items here to plan for common unplanned purchases.
            </p>
          </div>
        )}

        {/* Items list */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Budget Items {items.length > 0 && `(${items.length})`}
          </p>

          {items.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-2xl mb-2">{category.emoji}</p>
              <p className="text-gray-400 text-sm">No items planned yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to add items like Rice, Salt...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const spent = getItemSpent(item.name);
                const pct = item.plannedAmount > 0
                  ? Math.min((spent / item.plannedAmount) * 100, 100)
                  : 0;
                const isOver = spent > item.plannedAmount;
                const isWarn = pct >= 75 && !isOver;

                return (
                  <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${isOver ? 'text-red-400' : 'text-gray-400'}`}>
                          {formatCurrency(spent, currency)} / {formatCurrency(item.plannedAmount, currency)}
                        </span>
                        <button onClick={() => handleDelete(item.id)}>
                          <Trash2 size={13} className="text-gray-600 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOver ? 'bg-red-400' : isWarn ? 'bg-yellow-400' : 'bg-white'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600 text-xs">
                        {pct.toFixed(0)}% used
                      </span>
                      {isOver && (
                        <span className="text-red-400 text-xs">
                          +{formatCurrency(spent - item.plannedAmount, currency)} over
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent transactions in this category */}
        {transactions.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              Recent Spending
            </p>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {transactions.slice(0, 5).map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 ${
                    i < Math.min(transactions.length, 5) - 1 ? 'border-b border-gray-800' : ''
                  }`}
                >
                  <div>
                    <p className="text-white text-sm">{tx.note}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-red-400 text-sm font-medium">
                    -{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryItems;
