import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import StatsRow from '../components/StatsRow';
import TransactionList from '../components/TransactionList';
import type { Transaction } from '../types';

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    amount: 84200,
    type: 'expense',
    category: 'food',
    note: 'Market groceries',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    amount: 450000,
    type: 'income',
    category: 'salary',
    note: 'Monthly salary',
    date: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    amount: 15400,
    type: 'expense',
    category: 'transport',
    note: 'Moto taxi',
    date: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="flex items-center justify-between p-4 pb-0">
        <h1 className="text-xl font-bold text-white">SafeSpend</h1>
        <span className="text-gray-500 text-sm">May 2026</span>
      </div>

      <BalanceCard
        totalBalance={450000}
        weeklyChange={12500}
        weeklyChangePercent={2.4}
        currency="RWF"
      />

      <StatsRow
        dailyBudget={15000}
        dailySpent={8500}
        topCategory="Food"
        savingsPercent={32}
        currency="RWF"
      />

      <TransactionList
        transactions={sampleTransactions}
        currency="RWF"
      />

      <BottomNav />
    </div>
  );
};

export default Home;
