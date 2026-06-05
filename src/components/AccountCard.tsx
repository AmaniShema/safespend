import { Trash2, Star } from 'lucide-react';
import type { Account } from '../types';
import { formatCurrency } from '../utils/currency';

interface AccountCardProps {
  account: Account;
  balance: number;
  onDelete?: (id: string) => void;
}

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵',
  mobile: '📱',
  bank: '🏦',
  savings: '🏧',
  other: '💼',
};

const AccountCard = ({ account, balance, onDelete }: AccountCardProps) => {
  const isNegative = balance < 0;

  return (
    <div
      className="rounded-2xl p-4 border border-gray-800 bg-gray-900 relative overflow-hidden"
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: account.color }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ACCOUNT_ICONS[account.type]}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold text-sm">{account.name}</p>
                {account.isDefault && (
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <p className="text-gray-500 text-xs capitalize">{account.type}</p>
            </div>
          </div>

          {!account.isDefault && onDelete && (
            <button
              onClick={() => onDelete(account.id)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <p
          className={`text-2xl font-bold ${
            isNegative ? 'text-red-400' : 'text-white'
          }`}
        >
          {formatCurrency(balance, account.currency)}
        </p>
        <p className="text-gray-500 text-xs mt-1">{account.currency}</p>
      </div>
    </div>
  );
};

export default AccountCard;
