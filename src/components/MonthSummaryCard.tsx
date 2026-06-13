import { formatCurrency } from '../utils/currency';

interface MonthSummaryCardProps {
  income: number;
  expenses: number;
  currency?: string;
}

const MonthSummaryCard = ({ income, expenses, currency = 'RWF' }: MonthSummaryCardProps) => {
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <div className="mx-4 mt-4">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">This Month</p>
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Income</p>
          <p className="text-emerald-400 font-bold text-sm">
            {formatCurrency(income, currency)}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Expenses</p>
          <p className="text-red-400 font-bold text-sm">
            {formatCurrency(expenses, currency)}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Remaining</p>
          <p className={`font-bold text-sm ${isPositive ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(net, currency)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthSummaryCard;
