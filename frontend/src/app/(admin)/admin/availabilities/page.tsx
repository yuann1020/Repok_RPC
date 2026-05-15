'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courtsApi } from '@/lib/api/courts.api';
import { availabilityApi } from '@/lib/api/availability.api';
import { PickleballLoader } from '@/components/ui/PickleballLoader';

const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Subcomponents ─────────────────────────────────────────────────

function SectionHeader({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="section-accent" style={{ background: accent }} />
      <span className="text-[11px] font-black text-white uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

function StatBadge({ count, label, color }: { count: number; label: string; color: string }) {
  const styles: Record<string, string> = {
    slate:  'bg-slate-800/60 text-slate-400 border-slate-700/60',
    green:  'bg-green-500/10 text-green-400 border-green-500/25',
    red:    'bg-red-500/10   text-red-400   border-red-500/25',
  };
  return (
    <span className={`badge ${styles[color]}`}>
      <span className="font-black mr-1">{count}</span>
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AdminAvailabilitiesManager() {
  const queryClient = useQueryClient();

  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [viewDate,        setViewDate]         = useState<string>(() => new Date().toISOString().split('T')[0]);

  const { data: courts, isLoading: isCourtsLoading } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => courtsApi.getAllCourts(),
    staleTime: 60000,
  });

  const { data: slots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['admin-availability', selectedCourtId, viewDate],
    queryFn: () => availabilityApi.getAvailability(selectedCourtId, viewDate, { includeUnavailable: true }),
    enabled: !!selectedCourtId && !!viewDate,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const courtList = Array.isArray(courts) ? courts : [];
  const selectedCourt = courtList.find((court) => court.id === selectedCourtId);
  const totalSlots     = slots?.length ?? 0;
  const availableSlots = slots?.filter((s: any) => s.isAvailable).length ?? 0;
  const blockedSlots   = totalSlots - availableSlots;

  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      setPendingToggleId(id);
      return availabilityApi.updateSlotStatus(id, isAvailable);
    },
    onSettled: () => setPendingToggleId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-availability', selectedCourtId, viewDate] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-up">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Court Availability
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Select a court and date, then block or reopen individual booking slots.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] shrink-0">
            Step 1: Court
          </span>
          <select
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
            disabled={isCourtsLoading}
            className="input-premium min-w-full cursor-pointer px-4 py-2.5 text-sm font-bold sm:min-w-[240px]"
          >
            <option value="" disabled>Select court...</option>
            {courtList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content ─────────────────────────── */}
      {!selectedCourtId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-10 text-center sm:p-16">
          <h3 className="text-xl font-black text-white">Choose a court to begin</h3>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            After selecting a court, choose the day and tap any slot to block or reopen it.
          </p>
        </div>
      ) : (
        <div className="card-premium flex h-full flex-col space-y-8 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <SectionHeader accent="#4ade80" label="Step 2: Date" />
              <h2 className="mt-2 text-xl font-black text-white">{selectedCourt?.name || 'Selected court'}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  type="date"
                  value={viewDate}
                  onChange={e => setViewDate(e.target.value)}
                  className="input-premium px-4 py-2.5 font-mono text-sm min-w-[170px]"
                />
                <div className="flex items-center gap-2">
                  <StatBadge count={totalSlots}     label="Total"   color="slate" />
                  <StatBadge count={availableSlots} label="Open"    color="green" />
                  <StatBadge count={blockedSlots}   label="Blocked" color="red"   />
                </div>
              </div>
            </div>
          </div>

          {isSlotsLoading ? (
            <div className="flex justify-center py-20">
              <PickleballLoader />
            </div>
          ) : !slots || slots.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 font-medium">No slots were found for this date. Try another date or refresh after slot generation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <SectionHeader accent="#fbbf24" label="Step 3: Manage Slots" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {slots.map((slot: any) => (
                  <div
                    key={slot.id}
                    className={`flex flex-col rounded-2xl border p-5 transition-all ${
                      slot.isAvailable
                        ? 'border-slate-800 bg-slate-900 shadow-sm'
                        : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <span className={`font-mono text-lg font-black ${slot.isAvailable ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {formatTimeLabel(slot.startTime)}
                        </span>
                        <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.16em] ${slot.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          {slot.isAvailable ? 'Open' : 'Blocked'}
                        </p>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${slot.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500'}`} />
                    </div>

                    <button
                      disabled={pendingToggleId === slot.id}
                      onClick={() => toggleMutation.mutate({ id: slot.id, isAvailable: !slot.isAvailable })}
                      className={`w-full rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                        slot.isAvailable
                          ? 'bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400'
                          : 'bg-green-500 text-slate-950 hover:bg-green-400'
                      }`}
                    >
                      {pendingToggleId === slot.id ? 'Saving...' : (slot.isAvailable ? 'Block Slot' : 'Open Slot')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
