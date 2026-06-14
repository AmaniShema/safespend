import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import CategoryItems from './pages/CategoryItems';
import TotalBudget from './pages/TotalBudget';
import EditTransaction from './pages/EditTransaction';
import SavingsGoals from './pages/SavingsGoals';
import SavingsGoalDetail from './pages/SavingsGoalDetail';
import HouseholdFund from './pages/HouseholdFund';
import RecurringTransactions from './pages/RecurringTransactions';
import DebtTracker from './pages/DebtTracker';
import LockScreen from './components/LockScreen';
import { isBiometricEnabled, isBiometricAvailable } from './utils/biometric';
import { getSetting } from './db/settings';

const App = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    // Apply saved theme on startup
    getSetting('theme').then((saved) => {
      const t = saved || 'dark';
      document.documentElement.classList.add(t);
    });

    const checkLock = async () => {
      if (!Capacitor.isNativePlatform()) { setLockChecked(true); return; }
      try {
        const [enabled, available] = await Promise.all([
          isBiometricEnabled(),
          isBiometricAvailable(),
        ]);
        setIsLocked(enabled && available);
      } catch {
        setIsLocked(false);
      } finally {
        setLockChecked(true);
      }
    };
    checkLock();
  }, []);

  if (!lockChecked) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:categoryId" element={<CategoryItems />} />
        <Route path="/total-budget" element={<TotalBudget />} />
        <Route path="/edit-transaction/:id" element={<EditTransaction />} />
        <Route path="/savings-goals" element={<SavingsGoals />} />
        <Route path="/savings-goals/:id" element={<SavingsGoalDetail />} />
        <Route path="/household" element={<HouseholdFund />} />
        <Route path="/recurring" element={<RecurringTransactions />} />
        <Route path="/debts" element={<DebtTracker />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
