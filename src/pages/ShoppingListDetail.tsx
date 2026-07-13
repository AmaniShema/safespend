import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Check, ShoppingCart, Trash2 } from 'lucide-react';
import { useShoppingList } from '../hooks/useShoppingList';
import { useCurrency } from '../hooks/useCurrency';
import { getAllShoppingLists } from '../db/shoppingList';
import type { ShoppingList, ShoppingItem } from '../db/shoppingList';
import { addTransaction } from '../db/transactions';
import { formatCurrency } from '../utils/currency';

const SKIP_REASONS = [
  'Too expensive',
  'Out of stock',
  'Changed my mind',
  'Already have it',
  'Other',
];

const ShoppingListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { getItems, addItem, buyItem, skipItem, resetItem, removeItem, completeList } = useShoppingList();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPlanned, setItemPlanned] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Buy modal
  const [buyingItem, setBuyingItem] = useState<ShoppingItem | null>(null);
  const [actualAmount, setActualAmount] = useState('');

  // Skip modal
  const [skippingItem, setSkippingItem] = useState<ShoppingItem | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [isAddingToTransactions, setIsAddingToTransactions] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [allLists, listItems] = await Promise.all([
      getAllShoppingLists(),
      getItems(id),
    ]);
    setList(allLists.find((l) => l.id === id) || null);
    setItems(listItems);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAddItem = async () => {
    if (!itemName.trim()) return;
    const parsed = parseFloat(itemPlanned);
    if (!itemPlanned || isNaN(parsed) || parsed <= 0) return;
    setIsSavingItem(true);
    await addItem({ listId: id!, name: itemName.trim(), plannedAmount: parsed });
    setItemName('');
    setItemPlanned('');
    setShowAddItem(false);
    setIsSavingItem(false);
    await load();
  };

  const handleBuy = async () => {
    if (!buyingItem) return;
    const parsed = parseFloat(actualAmount);
    if (isNaN(parsed) || parsed < 0) return;
    await buyItem(buyingItem.id, parsed || buyingItem.plannedAmount);
    setBuyingItem(null);
    setActualAmount('');
    await load();
  };

  const handleSkip = async () => {
    if (!skippingItem) return;
    const reason = skipReason === 'Other' ? customReason : skipReason;
    if (!reason.trim()) return;
    await skipItem(skippingItem.id, reason.trim());
    setSkippingItem(null);
    setSkipReason('');
    setCustomReason('');
    await load();
  };

  const handleAddToTransactions = async () => {
    if (!list) return;
    const boughtItems = items.filter((i) => i.status === 'bought');
    if (boughtItems.length === 0) return;
    setIsAddingToTransactions(true);
    try {
      for (const item of boughtItems) {
        await addTransaction({
          amount: item.actualAmount || item.plannedAmount,
          type: 'expense',
          category: list.categoryId,
          note: item.name,
          date: list.date,
          accountId: list.accountId,
        });
      }
      await completeList(list.id);
      setDoneMsg(`${boughtItems.length} item${boughtItems.length > 1 ? 's' : ''} added to transactions!`);
      setTimeout(() => navigate('/shopping'), 2000);
    } catch {
      setDoneMsg('Failed to add transactions');
    } finally {
      setIsAddingToTransactions(false);
    }
  };

  if (!list) return null;

  const pendingItems = items.filter((i) => i.status === 'pending');
  const boughtItems = items.filter((i) => i.status === 'bought');
  const skippedItems = items.filter((i) => i.status === 'skipped');
  const totalPlanned = items.reduce((sum, i) => sum + i.plannedAmount, 0);
  const totalActual = boughtItems.reduce((sum, i) => sum + (i.actualAmount || i.plannedAmount), 0);
  const isCompleted = list.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{list.name}</h1>
          <p className="text-gray-500 text-xs">
            {new Date(list.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {!isCompleted && (
          <button onClick={() => setShowAddItem(true)} className="text-white">
            <Plus size={24} />
          </button>
        )}
        {isCompleted && <div className="w-6" />}
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 p-4">
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-gray-500 text-xs">Planned</p>
          <p className="text-white font-bold text-sm mt-0.5">{formatCurrency(totalPlanned, currency)}</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-gray-500 text-xs">Actual</p>
          <p className={`font-bold text-sm mt-0.5 ${totalActual > totalPlanned ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(totalActual, currency)}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-gray-500 text-xs">Left</p>
          <p className="text-gray-300 font-bold text-sm mt-0.5">{pendingItems.length} items</p>
        </div>
      </div>

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Add Item</h2>
              <button onClick={() => setShowAddItem(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Rice 5kg, Cooking oil..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-3 placeholder-gray-600"
              autoFocus
            />
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RWF</span>
              <input
                type="number"
                value={itemPlanned}
                onChange={(e) => setItemPlanned(e.target.value)}
                placeholder="Planned price"
                className="bg-transparent text-white flex-1 outline-none font-bold"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={isSavingItem}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSavingItem ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Buy modal */}
      {buyingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold">Confirm Purchase</h2>
              <button onClick={() => { setBuyingItem(null); setActualAmount(''); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">{buyingItem.name}</p>
            <p className="text-gray-400 text-sm mb-2">
              Actual price (planned: {formatCurrency(buyingItem.plannedAmount, currency)})
            </p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RWF</span>
              <input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder={String(buyingItem.plannedAmount)}
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
                autoFocus
              />
            </div>
            <p className="text-gray-600 text-xs mb-4">Leave empty to use planned price</p>
            <button
              onClick={handleBuy}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl"
            >
              Confirm Bought
            </button>
          </div>
        </div>
      )}

      {/* Skip modal */}
      {skippingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold">Why skipping?</h2>
              <button onClick={() => { setSkippingItem(null); setSkipReason(''); setCustomReason(''); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">{skippingItem.name}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SKIP_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSkipReason(r)}
                  className={`p-3 rounded-xl border text-sm text-left transition-colors ${
                    skipReason === r ? 'border-white bg-white/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {skipReason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
                autoFocus
              />
            )}
            <button
              onClick={handleSkip}
              disabled={!skipReason || (skipReason === 'Other' && !customReason.trim())}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-40"
            >
              Skip Item
            </button>
          </div>
        </div>
      )}

      <div className="px-4 space-y-4">
        {/* Pending items */}
        {pendingItems.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
              To Buy ({pendingItems.length})
            </p>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-gray-500 text-xs">{formatCurrency(item.plannedAmount, currency)}</p>
                    </div>
                    {!isCompleted && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setBuyingItem(item); setActualAmount(''); }}
                          className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          Bought
                        </button>
                        <button
                          onClick={() => { setSkippingItem(item); setSkipReason(''); }}
                          className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-lg border border-gray-700"
                        >
                          Skip
                        </button>
                        <button onClick={() => { removeItem(item.id); load(); }} className="text-gray-600 hover:text-red-400 p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bought items */}
        {boughtItems.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
              Bought ({boughtItems.length})
            </p>
            <div className="space-y-2">
              {boughtItems.map((item) => {
                const actual = item.actualAmount || item.plannedAmount;
                const diff = actual - item.plannedAmount;
                return (
                  <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-white flex-shrink-0" />
                        <div>
                          <p className="text-gray-300 text-sm font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-white text-xs font-semibold">{formatCurrency(actual, currency)}</span>
                            {diff !== 0 && (
                              <span className={`text-xs ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {diff > 0 ? '+' : ''}{formatCurrency(diff, currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isCompleted && (
                        <button
                          onClick={() => { resetItem(item.id); load(); }}
                          className="text-gray-600 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skipped items */}
        {skippedItems.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
              Skipped ({skippedItems.length})
            </p>
            <div className="space-y-2">
              {skippedItems.map((item) => (
                <div key={item.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm line-through">{item.name}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{item.skipReason}</p>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => { resetItem(item.id); load(); }}
                        className="text-gray-600 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <ShoppingCart size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No items yet</p>
            <p className="text-gray-600 text-xs mt-1">Tap + to add items to your list</p>
          </div>
        )}
      </div>

      {/* Bottom action */}
      {!isCompleted && boughtItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800">
          {doneMsg ? (
            <p className="text-center text-white font-medium py-3">{doneMsg}</p>
          ) : (
            <button
              onClick={handleAddToTransactions}
              disabled={isAddingToTransactions}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {isAddingToTransactions ? 'Adding...' : `Add ${boughtItems.length} item${boughtItems.length > 1 ? 's' : ''} to transactions`}
            </button>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center justify-center gap-2 py-2">
            <Check size={16} className="text-white" />
            <p className="text-white text-sm font-medium">Shopping completed — added to transactions</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListDetail;
