import { formatCurrency } from '../utils/currency';

interface StatsRowProps {
  dailyBudget: number;
  dailySpent: number;
  topCategory: string;
  savingsPercent: number;
  hasIncome: boolean;
  currency?: string;
}

const StatsRow = ({
  dailyBudget,
  dailySpent,
  topCategory,
  savingsPercent,
  hasIncome,
  currency = 'RWF',
}: StatsRowProps) => {
  const hasDailyBudget = dailyBudget > 0;
  const budgetProgress = hasDailyBudget ? Math.min((dailySpent / dailyBudget) * 100, 100) : 0;
  const isOverBudget = hasDailyBudget && dailySpent > dailyBudget;
  const isPositiveSavings = savingsPercent >= 0;

  return (
    <div className="flex gap-3 px-4 mt-4 overflow-x-auto pb-1">
      {/* Daily Budget */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 min-w-[140px] flex-1">
        <p className="text-gray-400 text-xs mb-1">Daily Budget</p>
        {hasDailyBudget ? (
          <>
            <p className="text-white font-bold text-base">
              {formatCurrency(dailyBudget, currency)}
            </p>
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverBudget ? 'bg-red-400' : 'bg-blue-400'
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {formatCurrency(dailySpent, currency)} spent today
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-500 font-bold text-base">—</p>
            <p className="text-gray-600 text-xs mt-1">Set a total budget</p>
          </>
        )}
      </div>

      {/* Top Category */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 min-w-[130px] flex-1">
        <p className="text-gray-400 text-xs mb-1">Top Category</p>
        <p className="text-white font-bold text-base capitalize">
          {topCategory === 'N/A' ? 'No data' : topCategory}
        </p>
        <p className="text-gray-500 text-xs mt-1">This month</p>
      </div>

      {/* Savings */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 min-w-[110px] flex-1">
        <p className="text-gray-400 text-xs mb-1">Savings Rate</p>
        {hasIncome ? (
          <>
            <p className={`font-bold text-base ${isPositiveSavings ? 'text-emerald-400' : 'text-red-400'}`}>
              {savingsPercent}%
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {isPositiveSavings ? 'On track' : 'Overspending'}
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-500 font-bold text-base">—</p>
            <p className="text-gray-600 text-xs mt-1">No income yet</p>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsRow;
