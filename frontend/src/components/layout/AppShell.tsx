import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import { SidebarContent } from './Sidebar';

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuLocationKey, setMenuLocationKey] = useState<string | null>(null);
  const mobileOpen = menuLocationKey !== null && menuLocationKey === location.key;

  const setMobileOpen = (open: boolean) => {
    setMenuLocationKey(open ? location.key : null);
  };

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuLocationKey(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] shadow-2xl animate-slide-right"
          >
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Cerrar menú"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg lg:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </button>
              <Link to="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <Logo />
              </Link>
            </div>
            <Avatar name={user?.name ?? 'Usuario'} size="sm" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
