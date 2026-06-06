import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Database,
  Shield,
  Download,
  Calendar,
  FileText,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useCurrency } from '../hooks/useCurrency';
import { CURRENCIES } from '../utils/currency';
import { getAllTransactions } from '../db/transactions';
import { getAllAccounts } from '../db/accounts';
import { getAllCategories } from '../db/categories';
import { isBiometricEnabled, setBiometricEnabled, isBiometricAvailable } from '../utils/biometric';
import { exportToPdf } from '../utils/exportPdf';
import {
  getReportSchedule,
  setReportSchedule,
  generateManualReport,
  type ReportSchedule,
} from '../utils/reportScheduler';

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
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [schedule, setSchedule] = useState<ReportSchedule>('monthly');
  const [showManualPicker, setShowManualPicker] = useState(false);
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
      if (transactions.length === 0) {
        setExportMsg('No transactions to export');
        return;
      }
      const accounts = await getAllAccounts();
      const cats = await getAllCategories();
      await exportToPdf(transactions, currency, accounts, cats);
      setExportMsg('Export successful!');
    } catch {
      setExportMsg('Export failed. Try again.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const handleManualReport = async (
    period: 'this_month' | 'last_month' | 'this_week'
  ) => {
    setShowManualPicker(false);
    setIsExporting(true);
    setExportMsg('');
    try {
      await generateManualReport(currency, period);
      setExportMsg('Report generated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setExportMsg(msg);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
  const selectedSchedule = SCHEDULE_OPTIONS.find((s) => s.value === schedule);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="p-4 pb-0">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Currency picker */}
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

      {/* Schedule picker */}
      {showSchedulePicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-gray-900 rounded-t-2xl w-full p-4 border-t border-gray-800">
            <h2 className="text-white font-semibold mb-4">Report Schedule</h2>
            <div className="space-y-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleScheduleSelect(opt.value)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{opt.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                  {schedule === opt.value && (
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSchedulePicker(false)}
              className="w-full mt-4 py-3 text-gray-400 text-sm"
            >
              Cancel
            </button>
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
                <button
                  key={p.value}
                  onClick={() => handleManualReport(p.value)}
                  className="w-full p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors text-left text-white text-sm font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowManualPicker(false)}
              className="w-full mt-4 py-3 text-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 mt-2">
        {/* Reports */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
            Reports
          </p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setShowSchedulePicker(true)}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Auto Report Schedule</p>
                  <p className="text-gray-500 text-xs">{selectedSchedule?.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm">{selectedSchedule?.label}</span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </button>

            <button
              onClick={() => setShowManualPicker(true)}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Generate Report</p>
                  <p className="text-gray-500 text-xs">
                    {isExporting ? 'Generating...' : 'Choose a time period'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>

            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Download size={18} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm">Export All Data</p>
                  <p className="text-gray-500 text-xs">Full transaction history as PDF</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          {exportMsg && (
            <p className={`text-xs mt-2 px-1 ${exportMsg.includes('fail') || exportMsg.includes('No') ? 'text-red-400' : 'text-emerald-400'}`}>
              {exportMsg}
            </p>
          )}
        </div>

        {/* Categories */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Categories</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button onClick={() => navigate("/categories")} className="w-full flex items-center justify-between p-4">
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
            <button onClick={() => navigate("/accounts")} className="w-full flex items-center justify-between p-4">
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
            <button onClick={() => navigate("/budgets")} className="w-full flex items-center justify-between p-4">
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

        {/* Data Management */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
            Data Management
          </p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800">
            <button
              onClick={() => setShowCurrencyPicker(true)}
              className="w-full flex items-center justify-between p-4"
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
          </div>
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

        {/* Security */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">Security</p>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Biometric Lock</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {biometricAvailable ? "Fingerprint / PIN protection" : "Not available on this device"}
                </p>
              </div>
              <button
                disabled={!biometricAvailable}
                onClick={async () => {
                  const next = !biometricEnabled;
                  await setBiometricEnabled(next);
                  setBiometricState(next);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  biometricEnabled ? "bg-emerald-500" : "bg-gray-700"
                } disabled:opacity-40`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  biometricEnabled ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
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
