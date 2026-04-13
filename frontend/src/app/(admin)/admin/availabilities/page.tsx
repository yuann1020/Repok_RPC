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
  });

  const { data: slots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['admin-availability', selectedCourtId, viewDate],
    queryFn: () => availabilityApi.getAvailability(selectedCourtId, viewDate),
    enabled: !!selectedCourtId && !!viewDate,
  });

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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 uppercase italic">
            Availability <span className="text-green-500">Manager</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your court availability and block specific time slots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] shrink-0">
            Choose Court
          </span>
          <select
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
            disabled={isCourtsLoading}
            className="input-premium px-4 py-2.5 text-sm font-bold min-w-[210px] cursor-pointer"
          >
            <option value="" disabled>Select court...</option>
            {courts?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content ─────────────────────────── */}
      {!selectedCourtId ? (
        <div className="flex flex-col items-center justify-center p-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
          <span className="text-4xl mb-4">🎾</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">No Court Selected</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Pick a court from the list above to manage its slots.</p>
        </div>
      ) : (
        <div className="card-premium p-8 space-y-8 h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <SectionHeader accent="#4ade80" label="Choose Date" />
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
              <p className="text-slate-500 font-medium">No slots found for this date. Check system configuration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {slots.map((slot: any) => (
                <div
                  key={slot.id}
                  className={`flex flex-col p-5 rounded-2xl border transition-all ${
                    slot.isAvailable
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className={`font-mono font-black text-lg ${slot.isAvailable ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                      {formatTimeLabel(slot.startTime)}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${slot.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500'}`} />
                  </div>

                  <button
                    disabled={pendingToggleId === slot.id}
                    onClick={() => toggleMutation.mutate({ id: slot.id, isAvailable: !slot.isAvailable })}
                    className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      slot.isAvailable
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10'
                        : 'bg-green-500 text-slate-950 hover:bg-green-400'
                    }`}
                  >
                    {pendingToggleId === slot.id ? '...' : (slot.isAvailable ? 'BLOCK' : 'UNBLOCK')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
