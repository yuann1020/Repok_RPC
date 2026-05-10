'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';

const NAV_LINKS = [
  { href: '/courts', label: 'Courts' },
  { href: '/bookings', label: 'My Bookings' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/contact', label: 'Contact' },
  { href: '/location', label: 'Location' },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileNavOpen]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    setIsMobileNavOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 group" aria-label="Repok home">
            <span className="text-xl font-black text-[#4ade80] uppercase tracking-wider italic">
              Repok
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => {
              const isActive = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-black uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'text-green-400'
                      : 'text-slate-400 hover:text-green-400'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <div className="max-w-[220px] text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Profile
                  </p>
                  <p className="truncate text-xs font-bold text-slate-200">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-slate-400 transition-colors hover:border-red-400/30 hover:text-red-400"
                  title="Logout"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-green-500 px-5 py-2 text-xs font-black uppercase tracking-widest text-slate-950 shadow-lg shadow-green-500/20 transition-all hover:bg-green-400"
              >
                Login
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-slate-100 transition-colors hover:border-green-400/40 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/60 md:hidden"
            aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-customer-navigation"
          >
            {isMobileNavOpen ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMobileNavOpen && (
        <div id="mobile-customer-navigation" className="fixed inset-x-0 top-16 z-50 h-[calc(100vh-4rem)] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileNavOpen(false)}
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/60">
            <div className="mb-5 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
                  Navigation
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Repok Pickleball Club
                </p>
              </div>
            </div>

            <nav className="space-y-2" aria-label="Mobile primary navigation">
              {NAV_LINKS.map((link) => {
                const isActive = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition-colors ${
                      isActive
                        ? 'border-green-400/40 bg-green-400/10 text-green-300'
                        : 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-green-400/30 hover:text-green-300'
                    }`}
                  >
                    {link.label}
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-5">
              {user ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-start gap-3">
                    <UserCircleIcon className="mt-0.5 h-8 w-8 shrink-0 text-green-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                        Profile
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-white">{user.email}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {user.role}
                      </p>
                    </div>
                  </div>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="mt-4 flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200 transition-colors hover:border-green-400/30 hover:text-green-300"
                    >
                      Admin Console
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-300 transition-colors hover:bg-red-500/15"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-2xl bg-green-500 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
