import { useState } from 'react';
import { Check, ChevronRight, Database, Shield, Download } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useCurrency } from '../hooks/useCurrency';
import { CURRENCIES } from '../utils/currency';
import { getAllTransactions } from '../db/transactions';

const Settings = () => {
  const { currency, setCurrency } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const handleCurrencySelect = async (code: string) => {
    await setCurrency(code);
    setShowCurrencyPicker(false);
  };

  const handleExport = async () => {
    try {
      const transactions = await getAllTransactions();
      const csv = [
        'ID,Amount,Type,Category,Note,Date',
        ...transactions.map((t) =>
          `${t.id},${t.amount},${t.type},${t.category},"${t.note}",${t.date}`
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safespend_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg('Export successful!');
      setTimeout(() => setExportMsg(''), 3000);
    } catch {
      setExportMsg('Export failed');
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="p-4 pb-0">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Currency picker modal */}
      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Select Currency</h2>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCurrencySelect(c.code)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 font-mono text-sm w-8">{c.symbol}</span>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{c.code}</p>
                      <p className="text-gray-400 text-xs">{c.name}</p>
                    </div>
                  </div>
                  {currency === c.code && (
                    <Check size={16} className="text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCurrencyPicker(false)}
              className="w-full mt-4 py-3 text-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 mt-2">
        {/* Data Management */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
            Data Management
          </p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setShowCurrencyPicker(true)}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Database size={18} className="text-gray-400" />
                <span className="text-white text-sm">Base Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {selectedCurrency?.code} ({selectedCurrency?.symbol})
                </span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Download size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Export Data</p>
                  <p className="text-gray-500 text-xs">Download as CSV</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          {exportMsg && (
            <p className="text-emerald-400 text-xs mt-2 px-1">{exportMsg}</p>
          )}
        </div>

        {/* Privacy */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
            Privacy
          </p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={18} className="text-emerald-400" />
              <span className="text-white text-sm font-medium">Privacy Dashboard</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500 text-xs uppercase">Storage</p>
                <p className="text-emerald-400 text-sm font-bold mt-1">100% Offline</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500 text-xs uppercase">Exposure</p>
                <p className="text-emerald-400 text-sm font-bold mt-1">0% Cloud</p>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
            About
          </p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">App</span>
              <span className="text-white text-sm">SafeSpend</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Version</span>
              <span className="text-white text-sm">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Built by</span>
              <span className="text-white text-sm">Amani Shema</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
