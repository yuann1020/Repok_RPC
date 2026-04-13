'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const NAV_ITEMS = [
    { href: '/admin',               label: 'Overview',       icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8"/></svg>) },
    { href: '/admin/courts',        label: 'Courts',         icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4v9M1 8.5h14" stroke="currentColor" strokeWidth="1.2" opacity=".6"/></svg>) },
    { href: '/admin/availabilities', label: 'Availabilities', icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>) },
    { href: '/admin/bookings',      label: 'Bookings',       icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 3V1.5M11 3V1.5M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
    { href: '/admin/payments',      label: 'Payments',       icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 7h14" stroke="currentColor" strokeWidth="1.3"/><circle cx="4.5" cy="10" r="1" fill="currentColor"/></svg>) },
    { href: '/admin/users',         label: 'Users',          icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 8a3 3 0 100-6 3 3 0 000 6ZM2 14.5c0-3 3-4.5 6-4.5s6 1.5 6 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { href: '/admin/announcements', label: 'Messages',       icon: (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.2a1.2 1.2 0 011.2 1.2v.55a4.7 4.7 0 012.78 3.98l.18 1.82c.03.26.15.5.34.69l.78.78a.9.9 0 01-.64 1.54H3.36a.9.9 0 01-.64-1.54l.78-.78a1.42 1.42 0 00.34-.69l.18-1.82a4.7 4.7 0 012.78-3.98V3.4A1.2 1.2 0 018 2.2ZM6.2 13.05a1.8 1.8 0 003.6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  ];

  const [isClient, setIsClient] = useState(false);

  // Poll for pending payments specifically for the notification badge
  const { data: pendingPayments } = useQuery({
    queryKey: ['admin-payments-pending'],
    queryFn: () => adminApi.getAllPayments({ status: 'PENDING_REVIEW' }),
    enabled: isClient && !!user && user.role === 'ADMIN',
    refetchInterval: 15000, 
  });
  
  const pendingCount = pendingPayments?.length || 0;

  useEffect(() => {
    setIsClient(true);
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [user, router]);

  if (!isClient || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="flex min-h-screen text-slate-300 font-sans">

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col animate-fade-up"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,9,23,0.98) 100%)',
          borderRight: '1px solid rgba(51,65,85,0.5)',
          boxShadow: '1px 0 0 rgba(74,222,128,0.04), 2px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Brand */}
        <div className="px-7 pt-8 pb-10">
          <div className="flex items-center gap-2.5">
            <span className="font-black text-[#4ade80] text-xl tracking-[0.12em] uppercase">
              Repok
            </span>
            {/* Live indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1 font-semibold">
            Admin Console
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            // Exact match for dashboard, prefix match for sub-pages
            const isActive = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-150 ${
                  isActive
                    ? 'text-green-400 bg-green-500/10 border border-green-500/15 shadow-[0_0_12px_rgba(74,222,128,0.06)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-green-400' : 'text-slate-400'}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>
                
                {label === 'Payments' && pendingCount > 0 ? (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {pendingCount}
                  </span>
                ) : isActive ? (
                  <span className="ml-auto w-1 h-4 rounded-full bg-green-400/70" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Footer — user + logout */}
        <div className="px-3 pb-7 pt-4" style={{ borderTop: '1px solid rgba(51,65,85,0.35)' }}>
          <div className="px-4 py-3 mb-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Signed in as</p>
            <p className="text-xs text-slate-300 font-mono mt-0.5 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { useAuthStore.getState().logout(); router.push('/login'); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M7 11l4-3-4-3M1 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Terminate Session
          </button>
          <p className="mt-6 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60 text-center">
            Developed by Louis
          </p>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 min-w-0">
        {children}
      </main>
    </div>
  );
}
