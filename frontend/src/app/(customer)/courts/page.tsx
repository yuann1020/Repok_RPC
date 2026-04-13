'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courtsApi } from '@/lib/api/courts.api';
import { CourtCard } from '@/components/ui/CourtCard';

export default function CourtsPage() {
  // Check states for UI filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: courts, isLoading, isError } = useQuery({
    queryKey: ['courts', selectedCategory, selectedStatus],
    queryFn: () => courtsApi.getAllCourts({
      category: selectedCategory || undefined,
      status: selectedStatus || undefined,
    }),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reserve a Court</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Filter and find the perfect court for your next game.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-premium py-2 px-4 text-xs font-bold ring-offset-bg-main"
          >
            <option value="">All Categories</option>
            <option value="STANDARD">Standard</option>
            <option value="CHAMPIONSHIP">Championship</option>
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-premium py-2 px-4 text-xs font-bold ring-offset-bg-main"
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

      {/* Empty State */}
      {!isLoading && !isError && courts?.length === 0 && (
        <div className="bg-slate-100 dark:bg-slate-900/30 backdrop-blur-3xl border border-slate-200 dark:border-white/10 border-dashed rounded-3xl flex flex-col items-center justify-center py-32 opacity-100 shadow-xl transition-all">
          <span className="text-5xl mb-4">🏟️</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-300">No Courts Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Try adjusting your filters to find available slots.</p>
        </div>
      )}

      {/* Render Court Grid */}
      {!isLoading && !isError && courts && courts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  );
}
