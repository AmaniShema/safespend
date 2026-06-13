import { RefreshCw, Clock, TrendingDown, Calendar } from 'lucide-react';
import type { ConsumptionRecord } from '../db/tracker';
import { formatCurrency } from '../utils/currency';

interface ConsumptionCardProps {
  record: ConsumptionRecord;
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: 'text-orange-400 bg-orange-500/10',
  health: 'text-red-400 bg-red-500/10',
  rent: 'text-yellow-400 bg-yellow-500/10',
  other: 'text-gray-400 bg-gray-500/10',
};

const getUrgencyColor = (
  daysSince: number,
  averageDays: number | null
): string => {
  if (!averageDays) return 'text-gray-400';
  const ratio = daysSince / averageDays;
  if (ratio >= 1) return 'text-red-400';
  if (ratio >= 0.75) return 'text-yellow-400';
  return 'text-white';
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const ConsumptionCard = ({ record, currency }: ConsumptionCardProps) => {
  const urgencyColor = getUrgencyColor(
    record.daysSinceLastPurchase,
    record.averageDays
  );
  const categoryStyle =
    CATEGORY_COLORS[record.category] || CATEGORY_COLORS.other;
  const totalPurchases = record.purchases.length;
  const totalSpent = record.purchases.reduce((s, p) => s + p.amount, 0);
  const isDue =
    record.averageDays !== null &&
    record.daysSinceLastPurchase >= record.averageDays;

  return (
    <div
      className={`bg-gray-900 rounded-2xl border p-4 ${
        isDue ? 'border-red-500/40' : 'border-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${categoryStyle.split(' ')[1]}`}>
            <RefreshCw size={14} className={categoryStyle.split(' ')[0]} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm capitalize">
              {record.itemName}
            </p>
            <p className="text-gray-500 text-xs capitalize">
              {record.category}
            </p>
          </div>
        </div>

        {isDue && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-medium">
            Due now
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <Clock size={10} className="text-gray-500" />
            <p className="text-gray-500 text-xs">Since last</p>
          </div>
          <p className={`text-sm font-bold ${urgencyColor}`}>
            {record.daysSinceLastPurchase}d
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown size={10} className="text-gray-500" />
            <p className="text-gray-500 text-xs">Avg cycle</p>
          </div>
          <p className="text-sm font-bold text-white">
            {record.averageDays !== null ? `${record.averageDays}d` : 'N/A'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <RefreshCw size={10} className="text-gray-500" />
            <p className="text-gray-500 text-xs">Bought</p>
          </div>
          <p className="text-sm font-bold text-white">{totalPurchases}x</p>
        </div>
      </div>

      {/* Progress bar */}
      {record.averageDays !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Cycle progress</span>
            <span className={urgencyColor}>
              {Math.min(
                Math.round(
                  (record.daysSinceLastPurchase / record.averageDays) * 100
                ),
                100
              )}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isDue
                  ? 'bg-red-400'
                  : record.daysSinceLastPurchase / record.averageDays >= 0.75
                  ? 'bg-yellow-400'
                  : 'bg-white'
              }`}
              style={{
                width: `${Math.min(
                  (record.daysSinceLastPurchase / record.averageDays) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-800">
        <div className="flex items-center gap-1">
          <Calendar size={11} className="text-gray-500" />
          <span className="text-gray-500 text-xs">
            Last: {formatDate(record.lastPurchaseDate)}
          </span>
        </div>
        {record.estimatedNextDate && (
          <span className="text-gray-500 text-xs">
            Next ~{formatDate(record.estimatedNextDate)}
          </span>
        )}
      </div>

      {/* Total spent */}
      <div className="mt-2 text-right">
        <span className="text-gray-600 text-xs">
          Total spent: {formatCurrency(totalSpent, currency)}
        </span>
      </div>
    </div>
  );
};

export default ConsumptionCard;
