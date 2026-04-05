import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  roles: readonly string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Weekly Planner', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/reconcile', label: 'Reconciliation', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/history', label: 'History', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/team', label: 'Team Dashboard', roles: ['MANAGER', 'ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside aria-label="Sidebar" className="w-64 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-white font-sans">ST6</h2>
        <p className="text-xs text-gray-400 font-mono">Weekly Commits</p>
      </div>

      <nav aria-label="Main navigation" className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-sm text-white truncate">{user?.displayName}</div>
        <div className="text-xs text-gray-400 truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="mt-2 text-xs text-gray-400 hover:text-danger transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
