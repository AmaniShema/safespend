import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import BottomNav from '../components/BottomNav';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/currency';

const CURRENCY = 'RWF';

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

const Analytics = () => {
  const { transactions, totalBalance } = useTransactions();

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryData = Object.entries(
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayStr = date.toISOString().split('T')[0];
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(dayStr))
      .reduce((sum, t) => sum + t.amount, 0);
    return { day: dayLabel, spent };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="p-4 pb-0">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-gray-400 text-sm">Last 30 days</p>
      </div>

      {/* Summary row */}
      <div className="flex gap-3 px-4 mt-4">
        <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Income</p>
          <p className="text-emerald-400 font-bold text-base">
            +{formatCurrency(totalIncome, CURRENCY)}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Expenses</p>
          <p className="text-red-400 font-bold text-base">
            -{formatCurrency(totalExpenses, CURRENCY)}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Balance</p>
          <p className={`font-bold text-base ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(totalBalance, CURRENCY)}
          </p>
        </div>
      </div>

      {/* Donut chart */}
      <div className="mx-4 mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <h2 className="text-white font-semibold mb-4">Spending Distribution</h2>
        {categoryData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No expense data yet</p>
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryData.map((entry) => {
                const percent = totalExpenses > 0
                  ? ((entry.value / totalExpenses) * 100).toFixed(0)
                  : '0';
                return (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#6b7280' }}
                    />
                    <span className="text-gray-400 text-xs capitalize">{entry.name}</span>
                    <span className="text-gray-500 text-xs ml-auto">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Weekly bar chart */}
      <div className="mx-4 mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <h2 className="text-white font-semibold mb-4">Weekly Spending</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barSize={24}>
              <XAxis
                dataKey="day"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value) => [formatCurrency(Number(value) || 0, CURRENCY), 'Spent']}
              />
              <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown list */}
      {categoryData.length > 0 && (
        <div className="mx-4 mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <h2 className="text-white font-semibold mb-4">By Category</h2>
          <div className="space-y-3">
            {categoryData.map((entry) => {
              const percent = totalExpenses > 0
                ? (entry.value / totalExpenses) * 100
                : 0;
              return (
                <div key={entry.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm capitalize">{entry.name}</span>
                    <span className="text-white text-sm font-medium">
                      {formatCurrency(entry.value, CURRENCY)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: CATEGORY_COLORS[entry.name] || '#6b7280',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Analytics;
