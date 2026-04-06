import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: readonly string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Weekly Planner', icon: '\u25A6', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/reconcile', label: 'Reconciliation', icon: '\u2713', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/history', label: 'History', icon: '\u25F7', roles: ['MEMBER', 'MANAGER', 'ADMIN'] },
  { to: '/team', label: 'Team Dashboard', icon: '\u2981', roles: ['MANAGER', 'ADMIN'] },
  { to: '/admin/rcdo', label: 'RCDO Admin', icon: '\u2699', roles: ['ADMIN'] },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-accent font-mono tracking-tight">ST6</span>
            <span className="text-[10px] text-muted font-mono uppercase tracking-widest">v3</span>
          </div>
          <p className="text-xs text-muted mt-0.5">Weekly Commits</p>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 min-h-[44px] rounded text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-accent/10 text-accent border-l-2 border-l-accent -ml-px'
                    : 'text-muted hover:text-primary hover:bg-primary/5 border-l-2 border-l-transparent -ml-px'
                }`
              }
            >
              <span className="font-mono text-xs w-4 text-center" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold font-mono shrink-0">
              {user ? getInitials(user.displayName) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-primary truncate">{user?.displayName}</div>
              <div className="text-[11px] text-muted truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 min-h-[44px] text-xs text-muted hover:text-danger transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
