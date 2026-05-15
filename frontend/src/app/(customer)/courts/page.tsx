'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courtsApi } from '@/lib/api/courts.api';
import { CourtCard } from '@/components/ui/CourtCard';

export default function CourtsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: courts, isLoading, isError } = useQuery({
    queryKey: ['courts', selectedCategory, selectedStatus],
    queryFn: () => courtsApi.getAllCourts({
      category: selectedCategory || undefined,
      status: selectedStatus || undefined,
    }),
    retry: 1,
    staleTime: 60000,
  });

  const courtList = Array.isArray(courts) ? courts : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-slate-200 dark:border-slate-800 pb-5 sm:pb-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reserve a Court
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Filter and find the perfect court for your next game.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="input-premium w-full min-h-11 py-3 px-4 text-xs font-bold ring-offset-bg-main"
          >
            <option value="">All Categories</option>
            <option value="STANDARD">Standard</option>
            <option value="CHAMPIONSHIP">Championship</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="input-premium w-full min-h-11 py-3 px-4 text-xs font-bold ring-offset-bg-main"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-6 rounded-xl text-center font-bold">
          Failed to load courts. Please try again.
        </div>
      )}

      {!isLoading && !isError && courtList.length === 0 && (
        <div className="bg-slate-100 dark:bg-slate-900/30 backdrop-blur-3xl border border-slate-200 dark:border-white/10 border-dashed rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center px-6 py-20 sm:py-32 opacity-100 shadow-xl transition-all text-center">
          <span className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-green-500">
            Courts
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-300">No Courts Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            Try adjusting your filters to find available slots.
          </p>
        </div>
      )}

      {!isLoading && !isError && courtList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courtList.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  );
}
