'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  const NAV_LINKS = [
    { href: '/courts', label: 'Courts' },
    { href: '/bookings', label: 'My Bookings' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/contact', label: 'Contact' },
    { href: '/location', label: 'Location' },
];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-black text-[#4ade80] uppercase tracking-wider italic">
                Repok
              </span>
            </Link>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-green-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{user.email}</p>
                  </div>
                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-xl bg-green-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-up">
        {children}
      </main>

      {/* ── Simple Footer ─────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Repok Pickleball Club. Premium Experience.
          </p>
          <p className="mt-1 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60">
            Developed by Louis
          </p>
        </div>
      </footer>
    </div>
  );
}
