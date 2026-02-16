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
    { to: '/snipe', label: 'Snipe', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/my-searches', label: 'My Searches', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' },
    { to: '/saved-deals', label: 'Saved Deals', icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z' },
    { to: '/sellers', label: 'Sellers', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { to: '/market', label: 'Market', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
    { to: '/sets', label: 'Sets', icon: 'M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122' },
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
