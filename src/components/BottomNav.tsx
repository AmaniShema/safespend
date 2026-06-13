import { Home, BarChart2, Plus, Search, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Plus, label: 'Add', path: '/add' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 py-3 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isAdd = label === 'Add';
          if (isAdd) {
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="bg-white rounded-full p-4 -mt-6 shadow-lg shadow-white/20"
              >
                <Icon size={22} className="text-black" />
              </button>
            );
          }
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-3"
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-gray-500'}
              />
              <span
                className={`text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
