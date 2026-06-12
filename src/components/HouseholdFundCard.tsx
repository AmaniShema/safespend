import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import type { Contributor } from '../db/household';
import { formatCurrency } from '../utils/currency';

interface HouseholdFundCardProps {
  contributors: Contributor[];
  totalFund: number;
  currency: string;
}

const HouseholdFundCard = ({ contributors, totalFund, currency }: HouseholdFundCardProps) => {
  const navigate = useNavigate();
  const active = contributors.filter((c) => c.status === 'active');

  return (
    <div className="mx-4 mt-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Users size={15} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Household Fund</p>
              <p className="text-gray-500 text-xs">
                {active.length} contributor{active.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/household')}
            className="flex items-center gap-1 text-emerald-400 text-xs"
          >
            Manage <ChevronRight size={14} />
          </button>
        </div>

        <p className="text-2xl font-bold text-white mb-3">
          {formatCurrency(totalFund, currency)}
        </p>

        <div className="space-y-1.5">
          {active.map((c) => {
            const pct = totalFund > 0 ? (c.amount / totalFund) * 100 : 0;
            return (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{pct.toFixed(0)}%</span>
                  <span className="text-gray-300 font-medium">
                    {formatCurrency(c.amount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HouseholdFundCard;
