import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import type { Contributor, HouseholdContribution } from '../db/household';
import { formatCurrency } from '../utils/currency';
import { formatMonth, getCurrentMonth } from '../db/household';

interface HouseholdFundCardProps {
  members: Contributor[];
  contributions: HouseholdContribution[];
  totalFund: number;
  currency: string;
}

const HouseholdFundCard = ({ members, contributions, totalFund, currency }: HouseholdFundCardProps) => {
  const navigate = useNavigate();
  const currentMonth = getCurrentMonth();
  const active = members.filter((m) => m.status === 'active');

  const getCurrentContrib = (memberId: string) =>
    contributions.find((c) => c.contributorId === memberId && c.month === currentMonth);

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
              <p className="text-gray-500 text-xs">{formatMonth(currentMonth)}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/household')}
            className="flex items-center gap-1 text-white text-xs"
          >
            Manage <ChevronRight size={14} />
          </button>
        </div>

        <p className="text-2xl font-bold text-white mb-3">
          {formatCurrency(totalFund, currency)}
        </p>

        <div className="space-y-1.5">
          {active.map((m) => {
            const contrib = getCurrentContrib(m.id);
            return (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{m.name}</span>
                <span className={contrib ? 'text-gray-300 font-medium' : 'text-gray-600'}>
                  {contrib ? formatCurrency(contrib.amount, currency) : 'Not added yet'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HouseholdFundCard;
