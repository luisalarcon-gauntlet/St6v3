import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-accent focus:text-primary focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>
      <Sidebar />
      <main id="main-content" className="flex-1 p-6 overflow-auto" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
