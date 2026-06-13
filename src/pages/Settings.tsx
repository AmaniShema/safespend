import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ChevronRight, Database, Shield, Download, Sun, Moon,
  Calendar, FileText, Upload, AlertCircle,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useCurrency } from '../hooks/useCurrency';
import { CURRENCIES } from '../utils/currency';
import { getAllTransactions } from '../db/transactions';
import { getAllAccounts } from '../db/accounts';
import { getAllCategories } from '../db/categories';
import { getAllGoals, getAllSavingsTransactions } from '../db/savingsGoals';
import { exportToPdf } from '../utils/exportPdf';
import { exportBackup, importBackup } from '../utils/backup';
import {
  getReportSchedule,
  setReportSchedule,
  generateManualReport,
  type ReportSchedule,
} from '../utils/reportScheduler';
import {
  isBiometricEnabled,
  setBiometricEnabled,
  isBiometricAvailable,
} from '../utils/biometric';
import { useTheme } from '../hooks/useTheme';

const SCHEDULE_OPTIONS: { value: ReportSchedule; label: string; desc: string }[] = [
  { value: 'monthly', label: 'Monthly', desc: 'Auto-generate at start of each month' },
  { value: 'weekly', label: 'Weekly', desc: 'Auto-generate every 7 days' },
  { value: 'off', label: 'Off', desc: 'No automatic reports' },
];

const MANUAL_PERIODS: { value: 'this_month' | 'last_month' | 'this_week'; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_week', label: 'This Week' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState(false);
  const [schedule, setSchedule] = useState<ReportSchedule>('monthly');
  const [biometricEnabled, setBiometricState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    getReportSchedule().then(setSchedule);
    isBiometricEnabled().then(setBiometricState);
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleCurrencySelect = async (code: string) => {
    await setCurrency(code);
    setShowCurrencyPicker(false);
  };

  const handleScheduleSelect = async (value: ReportSchedule) => {
    await setReportSchedule(value);
    setSchedule(value);
    setShowSchedulePicker(false);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    setExportMsg('');
    try {
      const transactions = await getAllTransactions();
      if (transactions.length === 0) { setExportMsg('No transactions to export'); return; }
      const accounts = await getAllAccounts();
      const cats = await getAllCategories();
      const goals = await getAllGoals();
      const goalTx = await getAllSavingsTransactions();
      await exportToPdf(transactions, currency, accounts, cats, goals, goalTx);
      setExportMsg('PDF exported successfully!');
    } catch {
      setExportMsg('Export failed. Try again.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const handleManualReport = async (period: 'this_month' | 'last_month' | 'this_week') => {
    setShowManualPicker(false);
    setIsExporting(true);
    setExportMsg('');
    try {
      await generateManualReport(currency, period);
      setExportMsg('Report generated!');
    } catch (err: unknown) {
      setExportMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportMsg('');
    try {
      await exportBackup();
      setExportMsg('Backup saved successfully!');
    } catch {
      setExportMsg('Backup failed. Try again.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportMsg('');
    setImportError(false);
    try {
      const text = await file.text();
      const result = await importBackup(text);
      setImportMsg(
        `Restored: ${result.transactions} transactions, ${result.accounts} accounts, ${result.categories} categories`
      );
      setImportError(false);
    } catch (err: unknown) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed');
      setImportError(true);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportMsg(''), 6000);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
  const selectedSchedule = SCHEDULE_OPTIONS.find((s) => s.value === schedule);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="p-4 pb-0">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Currency picker */}
      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Select Currency</h2>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => handleCurrencySelect(c.code)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 font-mono text-sm w-8">{c.symbol}</span>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{c.code}</p>
                      <p className="text-gray-400 text-xs">{c.name}</p>
                    </div>
                  </div>
                  {currency === c.code && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCurrencyPicker(false)} className="w-full mt-4 py-3 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Schedule picker */}
      {showSchedulePicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Report Schedule</h2>
            <div className="space-y-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => handleScheduleSelect(opt.value)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{opt.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                  {schedule === opt.value && <Check size={16} className="text-white flex-shrink-0" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSchedulePicker(false)} className="w-full mt-4 py-3 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Manual period picker */}
      {showManualPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Generate Report For</h2>
            <div className="space-y-2">
              {MANUAL_PERIODS.map((p) => (
                <button key={p.value} onClick={() => handleManualReport(p.value)}
                  className="w-full p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors text-left text-white text-sm font-medium">
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowManualPicker(false)} className="w-full mt-4 py-3 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 mt-2">

        {/* Total Budget */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Total Budget</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate('/total-budget')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <div className="text-left">
                  <p className="text-white text-sm">Set Total Budget</p>
                  <p className="text-gray-500 text-xs">Allocate budget across categories</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Recurring Transactions */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Recurring</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate("/recurring")} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔁</span>
                <div className="text-left">
                  <p className="text-white text-sm">Recurring Transactions</p>
                  <p className="text-gray-500 text-xs">Rent, salary, subscriptions</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Household Fund */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Household</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate("/household")} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏡</span>
                <div className="text-left">
                  <p className="text-white text-sm">Household Fund</p>
                  <p className="text-gray-500 text-xs">Track shared contributions</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Savings Goals */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Savings</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate("/savings-goals")} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div className="text-left">
                  <p className="text-white text-sm">Savings Goals</p>
                  <p className="text-gray-500 text-xs">Set targets and track progress</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Categories</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate('/categories')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏷️</span>
                <div className="text-left">
                  <p className="text-white text-sm">Manage Categories</p>
                  <p className="text-gray-500 text-xs">Create custom spending categories</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Accounts */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Accounts</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate('/accounts')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏦</span>
                <div className="text-left">
                  <p className="text-white text-sm">Manage Accounts</p>
                  <p className="text-gray-500 text-xs">Cash, mobile money, bank</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Budgets */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Budgets</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate('/budgets')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div className="text-left">
                  <p className="text-white text-sm">Budget Limits</p>
                  <p className="text-gray-500 text-xs">Set spending limits per category</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Reports */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Reports</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <button onClick={() => setShowSchedulePicker(true)}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Auto Report Schedule</p>
                  <p className="text-gray-500 text-xs">{selectedSchedule?.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">{selectedSchedule?.label}</span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>
            <button onClick={() => setShowManualPicker(true)} disabled={isExporting}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Generate PDF Report</p>
                  <p className="text-gray-500 text-xs">{isExporting ? 'Generating...' : 'Choose a time period'}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button onClick={handleExportAll} disabled={isExporting}
              className="w-full flex items-center justify-between p-4 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Export All as PDF</p>
                  <p className="text-gray-500 text-xs">Full transaction history</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          {exportMsg && (
            <p className={`text-xs mt-2 px-1 ${exportMsg.includes('fail') || exportMsg.includes('No') ? 'text-red-400' : 'text-white'}`}>
              {exportMsg}
            </p>
          )}
        </div>

        {/* Backup & Recovery */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Backup & Recovery</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <button onClick={handleExportBackup} disabled={isExporting}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-white" />
                <div className="text-left">
                  <p className="text-white text-sm">Export JSON Backup</p>
                  <p className="text-gray-500 text-xs">Save all data for recovery</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
              className="w-full flex items-center justify-between p-4 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-blue-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Import JSON Backup</p>
                  <p className="text-gray-500 text-xs">{isImporting ? 'Importing...' : 'Restore from backup file'}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          {importMsg && (
            <div className={`flex items-start gap-2 mt-2 px-1 ${importError ? 'text-red-400' : 'text-white'}`}>
              {importError && <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />}
              <p className="text-xs">{importMsg}</p>
            </div>
          )}
          <p className="text-gray-600 text-xs mt-2 px-1">
            💡 Keep your JSON backup file safe. Use it to restore data after reinstalling.
          </p>
        </div>

        {/* Data Management */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Data Management</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => setShowCurrencyPicker(true)} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-gray-400" />
                <span className="text-white text-sm">Base Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{selectedCurrency?.code} ({selectedCurrency?.symbol})</span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Appearance</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon size={18} className="text-gray-400" /> : <Sun size={18} className="text-yellow-400" />}
                <div>
                  <p className="text-white text-sm font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Switch app appearance</p>
                </div>
              </div>
              <button onClick={toggleTheme} className={"w-12 h-6 rounded-full transition-colors relative " + (theme === "light" ? "bg-gray-400" : "bg-gray-700")}>
                <div className={"absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform " + (theme === "light" ? "translate-x-6" : "translate-x-0.5")} />
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Security</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Biometric Lock</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {biometricAvailable ? 'Fingerprint / PIN protection' : 'Not available on this device'}
                </p>
              </div>
              <button
                disabled={!biometricAvailable}
                onClick={async () => {
                  const next = !biometricEnabled;
                  await setBiometricEnabled(next);
                  setBiometricState(next);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${biometricEnabled ? 'bg-gray-400' : 'bg-gray-700'} disabled:opacity-40`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${biometricEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Privacy</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={18} className="text-white" />
              <span className="text-white text-sm font-medium">Privacy Dashboard</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500 text-xs uppercase">Storage</p>
                <p className="text-white text-sm font-bold mt-1">100% Offline</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500 text-xs uppercase">Exposure</p>
                <p className="text-white text-sm font-bold mt-1">0% Cloud</p>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">About</p>
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
