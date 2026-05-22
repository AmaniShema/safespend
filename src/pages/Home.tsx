import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import StatsRow from '../components/StatsRow';

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

      <BottomNav />
    </div>
  );
};

export default Home;
