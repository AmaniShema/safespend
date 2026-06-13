import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import StatsRow from '../components/StatsRow';
import TransactionList from '../components/TransactionList';
import BudgetCard from '../components/BudgetCard';
import TotalBudgetCard from '../components/TotalBudgetCard';
import HouseholdFundCard from '../components/HouseholdFundCard';
import MonthSummaryCard from '../components/MonthSummaryCard';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useCurrency } from '../hooks/useCurrency';
import { useCategories } from '../hooks/useCategories';
import { useTotalBudget } from '../hooks/useTotalBudget';
import { useHousehold } from '../hooks/useHousehold';

const Home = () => {
  const navigate = useNavigate();
  const { transactions, totalBalance, isLoading, refresh } = useTransactions();
  const { budgets } = useBudgets();
  const { currency } = useCurrency();
  const { categories } = useCategories();
  const { totalBudget } = useTotalBudget();
  const { contributors, totalFund } = useHousehold();

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, { name: c.name, emoji: c.emoji }])
  );

  const activeContributors = contributors.filter((c) => c.status === 'active');

  const alertBudgets = budgets.filter(
    (b) => (b.spent / b.limit) * 100 >= 75
  );

  const now = new Date();
  const todayStr = now.toDateString();

  const topCategoryId = transactions.length > 0
    ? Object.entries(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
    : 'N/A';

  const topCategoryName = categoryMap[topCategoryId]?.name || topCategoryId;

  // Daily budget derived from total budget
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let dailyBudget = 0;
  if (totalBudget) {
    dailyBudget = totalBudget.period === 'monthly'
      ? totalBudget.amount / daysInMonth
      : totalBudget.amount / 7;
  }

  // Today's spending
  const dailySpent = transactions
    .filter((t) => t.type === 'expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // This month's income/expenses for savings rate
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = thisMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpenses = thisMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const hasIncome = monthIncome > 0;
  const savingsPercent = hasIncome
    ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="flex items-center justify-between p-4 pb-0">
        <h1 className="text-xl font-bold text-white">SafeSpend</h1>
        <span className="text-gray-500 text-sm">
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {activeContributors.length > 0 ? (
        <HouseholdFundCard
          contributors={contributors}
          totalFund={totalFund}
          currency={currency}
        />
      ) : (
        <BalanceCard
          totalBalance={totalBalance}
          weeklyChange={0}
          weeklyChangePercent={0}
          currency={currency}
        />
      )}

      <MonthSummaryCard
        income={monthIncome}
        expenses={monthExpenses}
        currency={currency}
      />

      <StatsRow
        dailyBudget={dailyBudget}
        dailySpent={dailySpent}
        topCategory={topCategoryName}
        savingsPercent={savingsPercent}
        hasIncome={hasIncome}
        currency={currency}
      />

      {totalBudget && (
        <TotalBudgetCard
          totalBudget={totalBudget}
          transactions={transactions}
          categories={categories}
          currency={currency}
        />
      )}

      {alertBudgets.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-semibold">Budget Alerts</h3>
            <button onClick={() => navigate('/budgets')} className="text-emerald-400 text-sm">
              Manage
            </button>
          </div>
          <div className="space-y-3">
            {alertBudgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mx-4 mt-6 text-center text-gray-500 text-sm">Loading...</div>
      ) : (
        <TransactionList
          transactions={transactions.slice(0, 10)}
          currency={currency}
          categoryMap={categoryMap}
          onRefresh={refresh}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
