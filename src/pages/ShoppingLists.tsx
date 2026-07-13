import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { useShoppingList } from '../hooks/useShoppingList';
import { useCategories } from '../hooks/useCategories';
import { getAllAccounts, getDefaultAccountId } from '../db/accounts';
import { useEffect } from 'react';
import type { Account } from '../types';

const ShoppingLists = () => {
  const navigate = useNavigate();
  const { lists, createList, removeList, isLoading } = useShoppingList();
  const { categories } = useCategories();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccount, setSelectedAccount] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllAccounts().then(setAccounts);
    getDefaultAccountId().then(setSelectedAccount);
  }, []);

  const activeLists = lists.filter((l) => l.status === 'active');
  const completedLists = lists.filter((l) => l.status === 'completed');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Enter a list name'); return; }
    setIsSaving(true);
    setError('');
    try {
      const list = await createList({ name: name.trim(), date, accountId: selectedAccount, categoryId: selectedCategory });
      setShowForm(false);
      setName('');
      navigate(`/shopping/${list.id}`);
    } catch {
      setError('Failed to create list');
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
        <h1 className="text-lg font-semibold">Shopping Lists</h1>
        <button onClick={() => setShowForm(true)} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Shopping List</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">List Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Groceries, Market run..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Date</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4"
            />

            <p className="text-gray-400 text-sm mb-2">Category (for transactions)</p>
            <div className="grid grid-cols-4 gap-2 mb-4 max-h-36 overflow-y-auto">
              {categories.filter((c) => c.id !== 'salary').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                    selectedCategory === cat.id ? 'border-white bg-white/10' : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs text-gray-400 text-center leading-tight">
                    {cat.name.length > 7 ? cat.name.substring(0, 6) + '…' : cat.name}
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
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                        selectedAccount === acc.id ? 'border-white bg-white/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={isSaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Active {activeLists.length > 0 && `(${activeLists.length})`}
          </p>
          {isLoading ? (
            <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
          ) : activeLists.length === 0 ? (
            <div className="text-center py-10 bg-gray-900 rounded-2xl border border-gray-800">
              <ShoppingCart size={36} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No shopping lists yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to plan your next shopping trip</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigate(`/shopping/${list.id}`)}
                  className="w-full bg-gray-900 rounded-xl border border-gray-800 p-4 text-left hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{list.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(list.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-lg">Active</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeList(list.id); }}
                        className="text-gray-600 hover:text-red-400 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {completedLists.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              Completed ({completedLists.length})
            </p>
            <div className="space-y-2">
              {completedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigate(`/shopping/${list.id}`)}
                  className="w-full bg-gray-900/50 rounded-xl border border-gray-800/50 p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 font-medium">{list.name}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(list.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-gray-600" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeList(list.id); }}
                        className="text-gray-600 hover:text-red-400 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingLists;
