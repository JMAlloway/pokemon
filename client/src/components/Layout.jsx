import { NavLink, Outlet } from 'react-router-dom';
import useSavedDealsStore from '../store/savedDealsStore';
import { useEffect } from 'react';

export default function Layout() {
  const { notifications, fetchDeals } = useSavedDealsStore();

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(() => fetchDeals(), 60000);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  const navLinks = [
    { to: '/', label: 'Search', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
    { to: '/my-searches', label: 'My Searches', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' },
    { to: '/saved-deals', label: 'Saved Deals', icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-bg-secondary border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-bold tracking-tight text-text-primary">
            <span className="text-accent">Poke</span>Arb
          </h1>
          <nav className="flex gap-1" role="navigation" aria-label="Main navigation">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`
                }
                end={link.to === '/'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
                {link.to === '/saved-deals' && notifications.length > 0 && (
                  <span className="bg-error text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {notifications.length}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
