import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Lock } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

const EMOJI_OPTIONS = [
  '🍽️','🚗','🛍️','🏠','✈️','❤️','🎬','💰','🎲','📱',
  '🏋️','📚','🎮','🐶','☕','🍺','💊','🔧','🎓','🏦',
  '⚡','💧','🌿','🎵','👗','🚿','🧹','🎁','🍕','🚕',
];

const COLOR_OPTIONS = [
  '#f97316','#3b82f6','#a855f7','#eab308','#06b6d4',
  '#ef4444','#ec4899','#10b981','#6366f1','#14b8a6',
  '#f59e0b','#84cc16','#0ea5e9','#8b5cf6','#d946ef',
];

const Categories = () => {
  const navigate = useNavigate();
  const { categories, addCategory, removeCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter a category name'); return; }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await addCategory({ name: name.trim(), emoji, color });
      setShowForm(false);
      setName('');
      setEmoji('🎯');
      setColor(COLOR_OPTIONS[0]);
    } catch {
      setError('Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  const systemCats = categories.filter((c) => c.isSystem);
  const customCats = categories.filter((c) => !c.isSystem);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Categories</h1>
        <button onClick={() => setShowForm(true)} className="text-emerald-400">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">New Category</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-2">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, School fees..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 mb-4 placeholder-gray-600"
              autoFocus
            />

            <p className="text-gray-400 text-sm mb-2">Emoji</p>
            <div className="grid grid-cols-10 gap-1.5 mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-1.5 rounded-lg transition-colors ${
                    emoji === e ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-gray-800'
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

            {/* Preview */}
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: color + '30' }}
              >
                {emoji}
              </div>
              <p className="text-white font-medium">{name || 'Preview'}</p>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* System categories */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            System Categories
          </p>
          <div className="space-y-2">
            {systemCats.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-gray-900 rounded-xl p-3 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: cat.color + '25' }}
                  >
                    {cat.emoji}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{cat.name}</p>
                    {cat.isDaily && (
                      <p className="text-indigo-400 text-xs">Random & unexpected</p>
                    )}
                  </div>
                </div>
                <Lock size={14} className="text-gray-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Custom categories */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            My Categories {customCats.length > 0 && `(${customCats.length})`}
          </p>
          {customCats.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-3xl mb-2">🏷️</p>
              <p className="text-gray-400 text-sm">No custom categories yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap + to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customCats.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-gray-900 rounded-xl p-3 border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: cat.color + '25' }}
                    >
                      {cat.emoji}
                    </div>
                    <p className="text-white text-sm font-medium">{cat.name}</p>
                  </div>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
