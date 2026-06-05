import { Trash2, Star } from 'lucide-react';
import type { Account } from '../types';
import { formatCurrency } from '../utils/currency';

interface AccountCardProps {
  account: Account;
  balance: number;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵',
  mobile: '📱',
  bank: '🏦',
  savings: '🏧',
  other: '💼',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  mobile: 'Mobile Money',
  bank: 'Bank Account',
  savings: 'Savings',
  other: 'Other',
};

const AccountCard = ({ account, balance, onDelete, onSetDefault }: AccountCardProps) => {
  const isNegative = balance < 0;

  return (
    <div className="rounded-2xl p-4 border border-gray-800 bg-gray-900 relative overflow-hidden">
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
                  <span className="flex items-center gap-0.5 bg-yellow-500/10 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
                    <Star size={9} className="fill-yellow-400" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!account.isDefault && onSetDefault && (
              <button
                onClick={() => onSetDefault(account.id)}
                className="text-xs text-gray-500 hover:text-yellow-400 transition-colors border border-gray-700 hover:border-yellow-400/50 px-2 py-1 rounded-lg"
              >
                Set Default
              </button>
            )}
            {!account.isDefault && onDelete && (
              <button
                onClick={() => onDelete(account.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <p className={`text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
          {formatCurrency(balance, account.currency)}
        </p>
        <p className="text-gray-500 text-xs mt-1">{account.currency}</p>
      </div>
    </div>
  );
};

export default AccountCard;
