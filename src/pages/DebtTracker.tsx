import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useDebts } from '../hooks/useDebts';
import { useCurrency } from '../hooks/useCurrency';
import { getDebtPayments } from '../db/debts';
import type { Debt, DebtPayment } from '../db/debts';
import { formatCurrency } from '../utils/currency';

const DebtTracker = () => {
  const navigate = useNavigate();
  const { debts, owedToMe, iOwe, totalOwedToMe, totalIOwe, isLoading, addDebt, makePayment, removeDebt, reopen } = useDebts();
  const { currency } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState<'owed_to_me' | 'i_owe'>('owed_to_me');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [isPaySaving, setIsPaySaving] = useState(false);
  const [payError, setPayError] = useState('');

  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, DebtPayment[]>>({});

  const handleSave = async () => {
    if (!personName.trim()) { setError('Enter a name'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return; }
    setIsSaving(true);
    setError('');
    try {
      await addDebt({ personName: personName.trim(), originalAmount: parsed, direction, description: description.trim() });
      setShowForm(false);
      setPersonName('');
      setAmount('');
      setDescription('');
    } catch {
      setError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!payingDebt) return;
    const parsed = parseFloat(payAmount);
    if (!payAmount || isNaN(parsed) || parsed <= 0) { setPayError('Enter a valid amount'); return; }
    if (parsed > payingDebt.remainingAmount) { setPayError(`Max: ${formatCurrency(payingDebt.remainingAmount, currency)}`); return; }
    setIsPaySaving(true);
    setPayError('');
    try {
      await makePayment(payingDebt.id, parsed, payNote.trim());
      setPayments((prev) => { const next = { ...prev }; delete next[payingDebt.id]; return next; });
      setPayingDebt(null);
      setPayAmount('');
      setPayNote('');
    } catch {
      setPayError('Failed to record payment');
    } finally {
      setIsPaySaving(false);
    }
  };

  const toggleExpand = async (debtId: string) => {
    if (expandedDebt === debtId) { setExpandedDebt(null); return; }
    setExpandedDebt(debtId);
    if (!payments[debtId]) {
      const p = await getDebtPayments(debtId);
      setPayments((prev) => ({ ...prev, [debtId]: p }));
    }
  };

  const settledDebts = debts.filter((d) => d.isSettled);

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const pct = Math.round(((debt.originalAmount - debt.remainingAmount) / debt.originalAmount) * 100);
    const isExpanded = expandedDebt === debt.id;
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white text-sm font-medium">{debt.personName}</p>
              {debt.description && <p className="text-gray-500 text-xs mt-0.5">{debt.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-white text-sm font-semibold">{formatCurrency(debt.remainingAmount, currency)}</p>
                <p className="text-gray-500 text-xs">of {formatCurrency(debt.originalAmount, currency)}</p>
              </div>
              <button
                onClick={() => setPayingDebt(debt)}
                className="bg-white text-black text-xs font-bold px-2.5 py-1.5 rounded-lg"
              >
                Pay
              </button>
              <button onClick={() => removeDebt(debt.id)} className="text-gray-600 hover:text-red-400 p-1 rounded">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-xs">{pct}% paid</span>
            <button onClick={() => toggleExpand(debt.id)} className="text-gray-500 text-xs flex items-center gap-1">
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {isExpanded ? 'Hide' : 'History'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-800 px-3 pb-3">
            {(payments[debt.id] || []).length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-3">No payments yet</p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {(payments[debt.id] || []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">{p.note || 'Payment'}</p>
                      <p className="text-gray-600 text-xs">
                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-white text-xs font-medium">
                      -{formatCurrency(p.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Debt Tracker</h1>
        <button onClick={() => { setShowForm(true); setError(''); }} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {/* Add Debt modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Debt / IOU</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Direction</p>
            <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700 mb-4">
              <button
                onClick={() => setDirection('owed_to_me')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${direction === 'owed_to_me' ? 'bg-white/20 text-white' : 'text-gray-500'}`}
              >
                Owed to Me
              </button>
              <button
                onClick={() => setDirection('i_owe')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${direction === 'i_owe' ? 'bg-white/20 text-white' : 'text-gray-500'}`}
              >
                I Owe
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Person Name</p>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Malik, Sam, Aunt Grace..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />

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

            <p className="text-gray-400 text-sm mb-2">Description (optional)</p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Borrowed for transport, Lunch..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Add Debt'}
            </button>
          </div>
        </div>
      )}

      {/* Record Payment modal */}
      {payingDebt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                Record Payment — {payingDebt.personName}
              </h2>
              <button onClick={() => { setPayingDebt(null); setPayError(''); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              Remaining: <span className="text-white font-semibold">{formatCurrency(payingDebt.remainingAmount, currency)}</span>
            </p>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-gray-400">RF</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-4xl font-bold text-white text-center w-40 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-2">Note (optional)</p>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="e.g. Cash, MoMo transfer..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
            />

            {/* Quick settle button */}
            <button
              onClick={() => setPayAmount(String(payingDebt.remainingAmount))}
              className="w-full mb-3 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-white hover:text-white transition-colors"
            >
              Settle Full Amount ({formatCurrency(payingDebt.remainingAmount, currency)})
            </button>

            {payError && <p className="text-red-400 text-sm mb-3">{payError}</p>}

            <button
              onClick={handlePayment}
              disabled={isPaySaving}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isPaySaving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Summary cards */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Owed to Me</p>
            <p className="text-white font-bold text-lg">{formatCurrency(totalOwedToMe, currency)}</p>
            <p className="text-gray-500 text-xs">{owedToMe.length} outstanding</p>
          </div>
          <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">I Owe</p>
            <p className="text-white font-bold text-lg">{formatCurrency(totalIOwe, currency)}</p>
            <p className="text-gray-500 text-xs">{iOwe.length} outstanding</p>
          </div>
        </div>

        {/* Owed to me */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Owed to Me {owedToMe.length > 0 && `(${owedToMe.length})`}
          </p>
          {isLoading ? (
            <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
          ) : owedToMe.length === 0 ? (
            <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500 text-sm">Nobody owes you money</p>
            </div>
          ) : (
            <div className="space-y-2">
              {owedToMe.map((debt) => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
        </div>

        {/* I owe */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            I Owe {iOwe.length > 0 && `(${iOwe.length})`}
          </p>
          {iOwe.length === 0 ? (
            <div className="text-center py-6 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500 text-sm">You don't owe anyone</p>
            </div>
          ) : (
            <div className="space-y-2">
              {iOwe.map((debt) => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
        </div>

        {/* Settled */}
        {settledDebts.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              Settled ({settledDebts.length})
            </p>
            <div className="space-y-2">
              {settledDebts.map((debt) => (
                <div key={debt.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">{debt.personName}</p>
                    <p className="text-gray-600 text-xs">
                      {formatCurrency(debt.originalAmount, currency)} • Settled
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => reopen(debt.id)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                      <RotateCcw size={13} />
                    </button>
                    <button onClick={() => removeDebt(debt.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtTracker;
