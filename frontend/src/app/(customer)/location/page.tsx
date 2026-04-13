'use client';

import Link from 'next/link';

export default function LocationPage() {
  const ADDRESS = "Lot 1136 Jalan Rentap, Light Industrial Estate 96100 Sarikei, Sarawak";
  const MAP_QUERY = encodeURIComponent(ADDRESS);
  const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
  
  // High-end grayscale embed URL (standard iframe embed with search query)
  const EMBED_URL = `https://maps.google.com/maps?q=${MAP_QUERY}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-up">
      
      {/* ── Page Header ───────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-green-500 font-bold">Discovery › Location</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            Find <span className="text-green-500">Us</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Visit our championship-grade facilities in the heart of Sarikei&apos;s Light Industrial Estate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Location Details ──────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium p-8 space-y-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Facility Address</span>
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                {ADDRESS}
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</span>
                 <a 
                   href={GOOGLE_MAPS_URL}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group flex items-center justify-between p-4 bg-green-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-green-400 shadow-lg shadow-green-500/20"
                 >
                   Get Directions
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                     <path d="M5 12h14M12 5l7 7-7 7"/>
                   </svg>
                 </a>
              </div>

              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Public Transport</span>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Located in the Light Industrial area, easily accessible via major transit routes in Sarikei.
                 </p>
              </div>
            </div>
          </div>

          {/* Secondary Info Card */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Need Help?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              If you have trouble finding us, please refer to your booking confirmation email for site-specific arrival instructions.
            </p>
          </div>
        </div>

        {/* ── Map Container ─────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video lg:aspect-auto lg:h-full min-h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-slate-200 dark:bg-slate-800/50">
            {/* Overlay Gradient */}
            <div className="absolute inset-0 pointer-events-none z-10 border-[1px] border-white/10 rounded-3xl shadow-inner" />
            
            {/* Grayscale Map Filter Layer */}
            <div className="w-full h-full grayscale-[0.2] contrast-[1.1] brightness-[0.95] dark:invert-[0.9] dark:hue-rotate-180 transition-all duration-700 group-hover:grayscale-0">
              <iframe
                title="Repok Pickleball Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={EMBED_URL}
                allowFullScreen
              />
            </div>
            
            {/* Interactive Status Overlay */}
            <div className="absolute top-6 right-6 z-20">
               <span className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Facility Status</span>
               </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
