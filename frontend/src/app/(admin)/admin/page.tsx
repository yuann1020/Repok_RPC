'use client';

import Link from 'next/link';

export default function AdminDashboardOverview() {

  const NAV_CARDS = [
    {
      href: '/admin/courts',
      accent: '#4ade80',
      delay: 'animate-fade-up',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="8" width="24" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M14 8v16M2 16h24" stroke="currentColor" strokeWidth="1.4" opacity=".55"/>
          <circle cx="14" cy="16" r="2.5" fill="currentColor" opacity=".35"/>
        </svg>
      ),
      label: 'Courts',
      sublabel: 'STANDARD',
      desc: 'Full operational control of court inventory and settings.',
    },
    {
      href: '/admin/availabilities',
      accent: '#eab308',
      delay: 'animate-fade-up-delay-1',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M14 8v6.5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Availabilities',
      sublabel: 'SLOT SCHEDULING',
      desc: 'Create time slots for courts and easily block or open them.',
    },
    {
      href: '/admin/bookings',
      accent: '#38bdf8',
      delay: 'animate-fade-up-delay-2',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="5" width="22" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M9 5V2.5M19 5V2.5M3 12h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 17h5M8 21h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".6"/>
        </svg>
      ),
      label: 'Bookings',
      sublabel: 'BOOKINGS HUB',
      desc: 'Inspect all reservations, filter by status, date, and court.',
    },
    {
      href: '/admin/payments',
      accent: '#a78bfa',
      delay: 'animate-fade-up-delay-3',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="7" width="24" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M2 13h24" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="7.5" cy="18.5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="18.5" r="1.5" fill="currentColor" opacity=".5"/>
        </svg>
      ),
      label: 'Payments',
      sublabel: 'PAYMENT LEDGER',
      desc: 'Audit transaction logs and verify payment proofs.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">

      {/* ── Page Header ───────────────────────────── */}
      <div className="animate-fade-up" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1.75rem' }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-green-500 font-bold mb-2">
          ADMIN › OVERVIEW
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
          Command <span className="text-green-500">Center</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium max-w-lg">
          Full operational control of courts, schedules, bookings, and transactions.
        </p>
      </div>

      {/* ── Quick-access Cards ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {NAV_CARDS.map(({ href, accent, delay, icon, label, sublabel, desc }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-start gap-5 p-6 rounded-2xl backdrop-blur-md cursor-pointer transition-all duration-200 ${delay}`}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(-3px)';
              el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px ${accent}22`;
              el.style.borderColor = `${accent}35`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'var(--shadow-card)';
              el.style.borderColor = 'var(--card-border)';
            }}
          >
            {/* Icon container */}
            <div
              className="shrink-0 flex items-center justify-center w-14 h-14 rounded-xl transition-colors duration-200"
              style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}20` }}
            >
              {icon}
            </div>

            {/* Text */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-1 justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  {label}
                </h3>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>
                  {sublabel}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                {desc}
              </p>

              <div className="flex items-center gap-1 mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 group-hover:text-green-500">
                Manage
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="transition-transform duration-150 group-hover:translate-x-0.5">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick stat strip ─────────────────────── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl animate-fade-up-delay-3 border border-slate-200 dark:border-slate-800"
        style={{ background: 'var(--card-border)' }}
      >
        {[
          { label: 'System Status',  value: 'Operational', color: '#4ade80' },
          { label: 'Data Region',    value: 'MYT (UTC+8)',  color: '#94a3b8' },
          { label: 'Panel Version',  value: 'v1.0',         color: '#94a3b8' },
          { label: 'Environment',    value: 'Production',   color: '#eab308' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-1 px-5 py-4 bg-white dark:bg-slate-900">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">{label}</span>
            <span className="text-sm font-black" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
