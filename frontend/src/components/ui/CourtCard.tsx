'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Court } from '@/lib/api/courts.api';

export function CourtCard({ court }: { court: Court }) {
  // Determine gradient border colors structurally mapped natively against Category overrides
  const isChampionship = court.category === 'CHAMPIONSHIP';

  return (
    <Link href={`/courts/${court.id}`}>
      <div 
        className={`group flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1 ${
          isChampionship 
            ? 'border-amber-500/20 shadow-amber-500/5' 
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Visual Header / Image Placeholder */}
        <div className="h-44 sm:h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          {court.imageUrl ? (
            <Image
              src={court.imageUrl}
              alt={court.name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full relative group">
              <Image
                src={court.category === 'CHAMPIONSHIP' ? '/images/courts/championship-fallback.jpg' : '/images/courts/standard-fallback.jpg'} 
                alt={court.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Subtle glass overlay to maintain the premium feel */}
              <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 sm:top-4 sm:left-4 sm:right-auto">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${
              court.status === 'ACTIVE' 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {court.status === 'ACTIVE' ? 'Active' : 'Maintenance'}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${
              court.category === 'CHAMPIONSHIP' 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                : 'bg-green-500/10 text-green-500 border-green-500/20'
            }`}>
              {court.category === 'CHAMPIONSHIP' ? 'Championship' : 'Standard'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-green-500 transition-colors">
              {court.name}
            </h3>
            <span className="shrink-0 text-sm font-black text-green-500 italic">RM {court.pricePerHour}/hr</span>
          </div>
          
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed">
            Experience premium Pickleball on our professional {court.category.toLowerCase()} courts.
          </p>

          <div className="mt-auto pt-6 flex items-center justify-between gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              View Schedule
            </span>
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
