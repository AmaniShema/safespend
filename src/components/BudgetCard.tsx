import { Trash2 } from 'lucide-react';
import type { Budget } from '../types';
import { formatCurrency } from '../utils/currency';

interface BudgetCardProps {
  budget: Budget;
  currency: string;
  onDelete?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#a855f7',
  rent: '#eab308',
  travel: '#06b6d4',
  health: '#ef4444',
  entertainment: '#ec4899',
  salary: '#10b981',
  other: '#6b7280',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  shopping: '🛍️',
  rent: '🏠',
  travel: '✈️',
  health: '❤️',
  entertainment: '🎬',
  salary: '💰',
  other: '···',
};

const BudgetCard = ({ budget, currency, onDelete }: BudgetCardProps) => {
  const percent = Math.min((budget.spent / budget.limit) * 100, 100);
  const isOver = budget.spent >= budget.limit;
  const isWarning = percent >= 75 && !isOver;
  const remaining = budget.limit - budget.spent;
  const color = CATEGORY_COLORS[budget.category] || '#6b7280';

  const barColor = isOver
    ? '#ef4444'
    : isWarning
    ? '#eab308'
    : '#10b981';

  return (
    <div
      className={`bg-gray-900 rounded-2xl p-4 border ${
        isOver
          ? 'border-red-500/40'
          : isWarning
          ? 'border-yellow-500/40'
          : 'border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CATEGORY_EMOJIS[budget.category] || '···'}</span>
          <div>
            <p className="text-white font-semibold text-sm capitalize">
              {budget.category}
            </p>
            <p className="text-gray-500 text-xs capitalize">{budget.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOver && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-medium">
              Over limit
            </span>
          )}
          {isWarning && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
              75% used
            </span>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget.id)}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">
          {formatCurrency(budget.spent, currency)} spent
        </span>
        <span
          className={`text-xs font-medium ${
            isOver ? 'text-red-400' : 'text-gray-400'
          }`}
        >
          {isOver
            ? `${formatCurrency(Math.abs(remaining), currency)} over`
            : `${formatCurrency(remaining, currency)} left`}
        </span>
      </div>

      {/* Limit */}
      <div className="mt-1 text-right">
        <span className="text-gray-600 text-xs">
          Limit: {formatCurrency(budget.limit, currency)}
        </span>
      </div>

      {/* Circular indicator */}
      <div className="mt-2 flex items-center justify-end">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="#1f2937"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={barColor}
            strokeWidth="3"
            strokeDasharray={`${(percent / 100) * 88} 88`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
          <text
            x="18" y="22"
            textAnchor="middle"
            fill={barColor}
            fontSize="8"
            fontWeight="bold"
          >
            {Math.round(percent)}%
          </text>
        </svg>
      </div>
    </div>
  );
};

export default BudgetCard;
