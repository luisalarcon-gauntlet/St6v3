import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.focus();
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-accent focus:text-primary focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-surface border-b border-border flex items-center h-14 px-4 md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary -ml-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-bold text-accent font-mono ml-2">ST6</span>
        <span className="text-[10px] text-muted font-mono uppercase tracking-widest ml-1">v3</span>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" className="flex-1 p-4 pt-[72px] md:p-8 md:pt-8 overflow-auto" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
