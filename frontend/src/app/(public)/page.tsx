'use client';

import Link from 'next/link';
import { AnnouncementsFeed } from '@/components/ui/AnnouncementsFeed';
import { useAuthStore } from '@/store/auth-store';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Instant Booking',
    desc: 'Select your slots, confirm, and receive your booking reference in seconds.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2.5 12h3M18.5 12h3M12 2.5v3M12 18.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Live Availability',
    desc: 'Real-time court schedules, updated to the minute as bookings come in.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 9h20M7 14h3M15 14h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".65"/>
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Simple, fast checkout with a full payment history always at your fingertips.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2 6h6l-5 3.5 2 6-5-4-5 4 2-6L4 9h6l2-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Premium Courts',
    desc: 'Indoor and outdoor championship-grade pickleball facilities, year-round.',
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col min-h-screen text-white relative overflow-hidden">
      <AnnouncementsFeed variant="section" />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-36 relative">

        {/* Atmosphere layers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {/* Primary green spotlight */}
          <div style={{
            position: 'absolute', top: '-10%', left: '50%',
            transform: 'translateX(-50%)',
            width: '800px', height: '600px',
            background: 'radial-gradient(ellipse, rgba(74,222,128,0.12) 0%, rgba(16,185,129,0.04) 45%, transparent 70%)',
            borderRadius: '50%',
          }} />
          {/* Amber right accent */}
          <div style={{
            position: 'absolute', top: '30%', right: '-5%',
            width: '400px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(251,191,36,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          {/* Deep left echo */}
          <div style={{
            position: 'absolute', bottom: '5%', left: '-5%',
            width: '350px', height: '350px',
            background: 'radial-gradient(ellipse, rgba(56,189,248,0.04) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        {/* Eyebrow */}
        <div className="relative z-10 animate-fade-up">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-green-400 mb-7"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            Premium Pickleball Experience
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 animate-fade-up-delay-1">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] max-w-3xl">
            <span
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #34d399 40%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              REPOK
            </span>
            <br />
            <span className="text-slate-100">PICKLEBALL CLUB</span>
          </h1>
        </div>

        {/* Sub */}
        <div className="relative z-10 animate-fade-up-delay-2">
          <p className="mt-6 text-slate-400 max-w-md text-base leading-relaxed font-medium">
            Book championship courts, track your reservations, and manage everything from one premium dashboard.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-4 justify-center relative z-10 animate-fade-up-delay-2">
          {user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin' : '/courts'}
              className="font-black text-[12px] uppercase tracking-[0.15em] text-slate-900 px-8 py-4 rounded-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                boxShadow: '0 4px 28px rgba(74,222,128,0.35)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 36px rgba(74,222,128,0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 28px rgba(74,222,128,0.35)';
              }}
            >
              {user.role === 'ADMIN' ? 'Open Admin Console' : 'Browse Courts'}
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="font-black text-[12px] uppercase tracking-[0.15em] text-slate-900 px-8 py-4 rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                  boxShadow: '0 4px 28px rgba(74,222,128,0.35)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 36px rgba(74,222,128,0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 28px rgba(74,222,128,0.35)';
                }}
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="font-black text-[12px] uppercase tracking-[0.15em] text-slate-300 hover:text-white px-8 py-4 rounded-xl transition-all"
                style={{
                  border: '1px solid rgba(51,65,85,0.7)',
                  background: 'rgba(15,23,42,0.4)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(71,85,105,0.9)';
                  e.currentTarget.style.background  = 'rgba(30,41,59,0.6)';
                  e.currentTarget.style.transform   = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.7)';
                  e.currentTarget.style.background  = 'rgba(15,23,42,0.4)';
                  e.currentTarget.style.transform   = 'translateY(0)';
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Divider ───────────────────────────────── */}
      <div className="relative mx-6 max-w-5xl mx-auto w-full px-6">
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(51,65,85,0.6), transparent)' }} />
      </div>

      {/* ── Features ──────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-bold mb-3">Why Repok</p>
          <h2 className="text-2xl font-black text-white tracking-tight">Built for Serious Players</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div
              key={title}
              className={`group flex items-start gap-4 p-6 rounded-2xl transition-all duration-200 ${
                i === 0 ? 'animate-fade-up' :
                i === 1 ? 'animate-fade-up-delay-1' :
                i === 2 ? 'animate-fade-up-delay-2' :
                'animate-fade-up-delay-3'
              }`}
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(51,65,85,0.5)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
                style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}
              >
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer
        className="py-8 px-6"
        style={{ borderTop: '1px solid rgba(51,65,85,0.35)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-black text-sm tracking-widest text-[#4ade80] uppercase">
            Repok
          </span>
          <p className="text-[10px] text-slate-700 tracking-wider font-medium">
            © {new Date().getFullYear()} Repok Pickleball Club · All rights reserved
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-700 tracking-widest uppercase font-bold">Malaysia</span>
              <span className="text-slate-800">·</span>
              <span className="text-[10px] text-slate-700 tracking-widest uppercase font-bold">Kuala Lumpur</span>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] opacity-60">
              Developed by Louis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
