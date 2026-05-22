import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface BalanceCardProps {
  totalBalance: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  currency?: string;
}

const BalanceCard = ({
  totalBalance,
  weeklyChange,
  weeklyChangePercent,
  currency = 'RWF',
}: BalanceCardProps) => {
  const isPositive = weeklyChange >= 0;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mx-4 mt-4 border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm">Total Balance</p>
          <h2 className="text-4xl font-bold text-white mt-1">
            {formatCurrency(totalBalance, currency)}
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-full px-3 py-1">
          <Shield size={12} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">Offline</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp size={16} className="text-emerald-400" />
        ) : (
          <TrendingDown size={16} className="text-red-400" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{weeklyChangePercent.toFixed(1)}% this week
        </span>
        <span className="text-gray-500 text-sm">
          ({isPositive ? '+' : ''}{formatCurrency(weeklyChange, currency)})
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;
