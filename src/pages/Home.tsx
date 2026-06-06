import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import StatsRow from '../components/StatsRow';
import TransactionList from '../components/TransactionList';
import BudgetCard from '../components/BudgetCard';
import TotalBudgetCard from '../components/TotalBudgetCard';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useCurrency } from '../hooks/useCurrency';
import { useCategories } from '../hooks/useCategories';
import { useTotalBudget } from '../hooks/useTotalBudget';

const Home = () => {
  const navigate = useNavigate();
  const { transactions, totalBalance, isLoading } = useTransactions();
  const { budgets } = useBudgets();
  const { currency } = useCurrency();
  const { categories } = useCategories();
  const { totalBudget } = useTotalBudget();

  const alertBudgets = budgets.filter(
    (b) => (b.spent / b.limit) * 100 >= 75
  );

  const topCategory =
    transactions.length > 0
      ? Object.entries(
          transactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
              return acc;
            }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
      : 'N/A';

  const topCategoryName = categories.find((c) => c.id === topCategory)?.name || topCategory;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="flex items-center justify-between p-4 pb-0">
        <h1 className="text-xl font-bold text-white">SafeSpend</h1>
        <span className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <BalanceCard
        totalBalance={totalBalance}
        weeklyChange={0}
        weeklyChangePercent={0}
        currency={currency}
      />

      <StatsRow
        dailyBudget={15000}
        dailySpent={0}
        topCategory={topCategoryName}
        savingsPercent={32}
        currency={currency}
      />

      {/* Total budget overview */}
      {totalBudget && (
        <TotalBudgetCard
          totalBudget={totalBudget}
          transactions={transactions}
          categories={categories}
          currency={currency}
        />
      )}

      {/* Category budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-semibold">Budget Alerts</h3>
            <button
              onClick={() => navigate('/budgets')}
              className="text-emerald-400 text-sm"
            >
              Manage
            </button>
          </div>
          <div className="space-y-3">
            {alertBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mx-4 mt-6 text-center text-gray-500 text-sm">
          Loading...
        </div>
      ) : (
        <TransactionList
          transactions={transactions.slice(0, 10)}
          currency={currency}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
