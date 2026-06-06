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
import TotalBudget from './pages/TotalBudget';
import LockScreen from './components/LockScreen';
import { isBiometricEnabled, isBiometricAvailable } from './utils/biometric';

const App = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
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
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
        <Route path="/total-budget" element={<TotalBudget />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
