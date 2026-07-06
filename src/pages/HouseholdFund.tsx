import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, UserMinus, UserCheck, Pencil, ArrowRightCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useHousehold } from '../hooks/useHousehold';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currency';
import { formatMonth } from '../db/household';
import type { Contributor } from '../db/household';

const MONTHS = Array.from({ length: 15 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i + 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const HouseholdFund = () => {
  const navigate = useNavigate();
  const {
    members, contributions, currentMonth, totalFund,
    addPerson, toggleStatus, removePerson,
    addMonthContribution, editContribution, markRecorded, removeContribution,
    isLoading,
  } = useHousehold();
  const { currency } = useCurrency();

  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [showContribForm, setShowContribForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Contributor | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribMonth, setContribMonth] = useState(currentMonth);
  const [contribNote, setContribNote] = useState('');
  const [isSavingContrib, setIsSavingContrib] = useState(false);
  const [contribError, setContribError] = useState('');

  const [editingContribId, setEditingContribId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const activeMembers = members.filter((m) => m.status === 'active');
  const leftMembers = members.filter((m) => m.status === 'left');

  const getMemberContributions = (memberId: string) =>
    contributions.filter((c) => c.contributorId === memberId)
      .sort((a, b) => b.month.localeCompare(a.month));

  const getMemberTotal = (memberId: string) =>
    contributions.filter((c) => c.contributorId === memberId)
      .reduce((sum, c) => sum + c.amount, 0);

  const getCurrentMonthContrib = (memberId: string) =>
    contributions.find((c) => c.contributorId === memberId && c.month === currentMonth);

  const handleAddMember = async () => {
    if (!newName.trim()) return;
    setIsSavingMember(true);
    await addPerson(newName.trim());
    setNewName('');
    setShowAddMember(false);
    setIsSavingMember(false);
  };

  const openContribForm = (member: Contributor) => {
    setSelectedMember(member);
    setContribAmount('');
    setContribMonth(currentMonth);
    setContribNote('');
    setContribError('');
    setShowContribForm(true);
  };

  const handleAddContrib = async () => {
    const parsed = parseFloat(contribAmount);
    if (!contribAmount || isNaN(parsed) || parsed <= 0) {
      setContribError('Enter a valid amount');
      return;
    }
    const existing = contributions.find(
      (c) => c.contributorId === selectedMember!.id && c.month === contribMonth
    );
    if (existing) {
      setContribError(`${selectedMember!.name} already has a contribution for ${formatMonth(contribMonth)}`);
      return;
    }
    setIsSavingContrib(true);
    setContribError('');
    await addMonthContribution(selectedMember!.id, parsed, contribMonth, contribNote.trim());
    setShowContribForm(false);
    setIsSavingContrib(false);
  };

  const handleRecordAsIncome = async (contribId: string, member: Contributor, amount: number) => {
    await markRecorded(contribId, true);
    navigate('/add', {
      state: {
        prefillAmount: amount,
        prefillNote: `Household contribution — ${member.name}`,
        prefillType: 'income',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Household Fund</h1>
        <button onClick={() => setShowAddMember(true)} className="text-white">
          <Plus size={24} />
        </button>
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Add Member</h2>
              <button onClick={() => setShowAddMember(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SHEMA, Malik, Sam..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
              autoFocus
            />
            <button
              onClick={handleAddMember}
              disabled={isSavingMember}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSavingMember ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      )}

      {/* Add contribution modal */}
      {showContribForm && selectedMember && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">
                Add Contribution — {selectedMember.name}
              </h2>
              <button onClick={() => setShowContribForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Month</p>
            <select
              value={contribMonth}
              onChange={(e) => setContribMonth(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>

            <p className="text-gray-400 text-sm mb-2">Amount</p>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3 mb-4">
              <span className="text-gray-400">RWF</span>
              <input
                type="number"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-white flex-1 outline-none text-lg font-bold"
                autoFocus
              />
            </div>

            <p className="text-gray-400 text-sm mb-2">Note (optional)</p>
            <input
              type="text"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              placeholder="e.g. salary, bonus..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-white mb-4 placeholder-gray-600"
            />

            {contribError && <p className="text-red-400 text-sm mb-3">{contribError}</p>}

            <button
              onClick={handleAddContrib}
              disabled={isSavingContrib}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSavingContrib ? 'Saving...' : 'Add Contribution'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Total fund overview */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Household Fund</p>
          <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalFund, currency)}</p>
          <p className="text-gray-500 text-xs mt-1">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''} •{' '}
            {formatMonth(currentMonth)}
          </p>
        </div>

        {/* Active members */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Members {activeMembers.length > 0 && `(${activeMembers.length})`}
          </p>

          {isLoading ? (
            <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
          ) : activeMembers.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-3xl mb-2">🏡</p>
              <p className="text-gray-400 text-sm">No members yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to add the first one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMembers.map((member) => {
                const memberContribs = getMemberContributions(member.id);
                const memberTotal = getMemberTotal(member.id);
                const thisMonthContrib = getCurrentMonthContrib(member.id);
                const isExpanded = expandedMember === member.id;

                return (
                  <div key={member.id} className="bg-gray-900 rounded-xl border border-gray-800">
                    {/* Member header */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-gray-500 text-xs">
                            Total: {formatCurrency(memberTotal, currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openContribForm(member)}
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus size={12} />
                            Add Month
                          </button>
                          <button
                            onClick={() => toggleStatus(member.id)}
                            className="text-gray-500 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-yellow-500/10"
                          >
                            <UserMinus size={14} />
                          </button>
                          <button
                            onClick={() => removePerson(member.id)}
                            className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                            className="text-gray-500 hover:text-white p-1.5 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* This month contribution */}
                      {thisMonthContrib ? (
                        <div className="mt-2">
                          {editingContribId === thisMonthContrib.id ? (
                            <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">RWF</span>
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  className="bg-transparent text-white flex-1 outline-none font-bold"
                                  autoFocus
                                />
                              </div>
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="w-full bg-gray-700 rounded-lg p-2 text-white text-sm outline-none placeholder-gray-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingContribId(null)}
                                  className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    const parsed = parseFloat(editAmount);
                                    if (!isNaN(parsed) && parsed > 0) {
                                      await editContribution(thisMonthContrib.id, parsed, editNote);
                                      setEditingContribId(null);
                                    }
                                  }}
                                  className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : thisMonthContrib.recorded ? (
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                              <div>
                                <span className="text-emerald-400 text-xs">✓ Recorded as income</span>
                                <p className="text-white text-sm font-semibold">{formatCurrency(thisMonthContrib.amount, currency)}</p>
                              </div>
                              <button
                                onClick={() => markRecorded(thisMonthContrib.id, false)}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs"
                              >
                                <RotateCcw size={12} /> Undo
                              </button>
                            </div>
                          ) : (
                            <div className="bg-gray-800 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-white font-semibold">{formatCurrency(thisMonthContrib.amount, currency)}</p>
                                  <p className="text-gray-500 text-xs">{formatMonth(thisMonthContrib.month)}{thisMonthContrib.note ? ` • ${thisMonthContrib.note}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingContribId(thisMonthContrib.id);
                                      setEditAmount(String(thisMonthContrib.amount));
                                      setEditNote(thisMonthContrib.note);
                                    }}
                                    className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => removeContribution(thisMonthContrib.id)}
                                    className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRecordAsIncome(thisMonthContrib.id, member, thisMonthContrib.amount)}
                                className="w-full flex items-center justify-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-medium py-2 rounded-lg hover:bg-white/20 transition-colors"
                              >
                                <ArrowRightCircle size={13} />
                                Record as income
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => openContribForm(member)}
                          className="w-full mt-2 py-2 border border-dashed border-gray-700 text-gray-500 text-xs rounded-xl hover:border-gray-500 hover:text-gray-300 transition-colors"
                        >
                          + Add {formatMonth(currentMonth)} contribution
                        </button>
                      )}
                    </div>

                    {/* Contribution history */}
                    {isExpanded && memberContribs.length > 0 && (
                      <div className="border-t border-gray-800 p-3">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">History</p>
                        <div className="space-y-2">
                          {memberContribs.map((c) => (
                            <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                              <div>
                                <p className="text-gray-300 text-sm">{formatMonth(c.month)}</p>
                                {c.note && <p className="text-gray-600 text-xs">{c.note}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium">{formatCurrency(c.amount, currency)}</span>
                                {c.recorded && <span className="text-emerald-400 text-xs">✓</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Left members */}
        {leftMembers.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              No Longer Contributing ({leftMembers.length})
            </p>
            <div className="space-y-2">
              {leftMembers.map((m) => (
                <div key={m.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-3 flex items-center justify-between">
                  <p className="text-gray-400 text-sm line-through">{m.name}</p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(m.id)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                      <UserCheck size={14} />
                    </button>
                    <button onClick={() => removePerson(m.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-600 text-xs px-1">
          💡 Each member can have one contribution per month. Tap "Add Month" to record a new month's contribution — amounts can vary each month.
        </p>
      </div>
    </div>
  );
};

export default HouseholdFund;
