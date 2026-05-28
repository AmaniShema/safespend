import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import StatsRow from '../components/StatsRow';
import TransactionList from '../components/TransactionList';
import { useTransactions } from '../hooks/useTransactions';

const CURRENCY = 'RWF';

const Home = () => {
  const { transactions, totalBalance, isLoading } = useTransactions();

  const topCategory = transactions.length > 0
    ? Object.entries(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
    : 'N/A';

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="flex items-center justify-between p-4 pb-0">
        <h1 className="text-xl font-bold text-white">SafeSpend</h1>
        <span className="text-gray-500 text-sm">May 2026</span>
      </div>

      <BalanceCard
        totalBalance={totalBalance}
        weeklyChange={0}
        weeklyChangePercent={0}
        currency={CURRENCY}
      />

      <StatsRow
        dailyBudget={15000}
        dailySpent={0}
        topCategory={topCategory}
        savingsPercent={32}
        currency={CURRENCY}
      />

      {isLoading ? (
        <div className="mx-4 mt-6 text-center text-gray-500 text-sm">
          Loading...
        </div>
      ) : (
        <TransactionList
          transactions={transactions.slice(0, 10)}
          currency={CURRENCY}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
