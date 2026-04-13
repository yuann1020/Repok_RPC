'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { courtsApi } from '@/lib/api/courts.api';
import { availabilityApi } from '@/lib/api/availability.api';
import { bookingsApi } from '@/lib/api/bookings.api';

// Format helper turning UTC ISOs into human-readable 24H times locally
const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params?.id as string;

  // Track the selected date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Track selected active slot IDs
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState<string>('');

  // 1. Fetch Court Info
  const { 
    data: court, 
    isLoading: isCourtLoading, 
    isError: isCourtError 
  } = useQuery({
    queryKey: ['court', courtId],
    queryFn: () => courtsApi.getCourtById(courtId),
    enabled: !!courtId,
  });

  // 2. Fetch specific Availability matrices
  const { 
    data: slots, 
    isLoading: isSlotsLoading, 
    isError: isSlotsError 
  } = useQuery({
    queryKey: ['availability', courtId, selectedDate],
    queryFn: () => availabilityApi.getAvailability(courtId, selectedDate),
    enabled: !!courtId && !!selectedDate,
  });

  // Toggle Logic
  const handleSlotToggle = (slotId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    
    // Clear booking error if present
    if (bookingError) setBookingError('');
    
    setSelectedSlots((prev) => 
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const bookingMutation = useMutation({
    mutationFn: () => bookingsApi.createBooking({ availabilityIds: selectedSlots }),
    onSuccess: (data) => {
      // Redirect to specific payment detail view
      router.push(`/payments/${data.id}`);
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Server validation failed.';
      setBookingError(Array.isArray(message) ? message[0] : message);
    }
  });

  const handleCheckout = () => {
    setBookingError('');
    bookingMutation.mutate();
  };

  if (isCourtLoading) return (
    <div className="flex justify-center items-center py-32">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
    </div>
  );

  if (isCourtError || !court) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center font-medium max-w-lg mx-auto mt-10">
      Failed to locate the court information.
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
      
      {/* 1. Court Presentational Dashboard */}
      <div className="flex flex-col bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className={`h-32 w-full flex items-center justify-center opacity-80 ${court.category === 'CHAMPIONSHIP' ? 'bg-gradient-to-r from-yellow-600/30 to-amber-900/50' : 'bg-gradient-to-r from-green-600/30 to-emerald-900/50'}`}>
           <span className="text-3xl font-black tracking-widest text-slate-700 uppercase opacity-60">
             {court.courtType}
           </span>
        </div>

        <div className="p-8 pb-10">
          <div className="flex justify-between items-start">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-4xl font-extrabold text-slate-50">{court.name}</h1>
                 { court.status === 'MAINTENANCE' && (
                   <span className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full text-xs font-bold tracking-widest uppercase">Maintenance</span>
                 )}
                 <span className={`px-3 py-1 border rounded-full text-xs font-bold tracking-widest uppercase ${court.category === 'CHAMPIONSHIP' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                   {court.category}
                 </span>
               </div>
               
               <div className="flex flex-wrap gap-2 mt-4">
                 <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Facilities:</span>
                 {court.facilities.map((fac, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded">{fac}</span>
                 ))}
               </div>
             </div>

             <div className="text-right bg-slate-950 px-6 py-4 rounded-xl border border-slate-800">
               <span className="block text-sm text-slate-400 uppercase font-semibold tracking-wider">Per Hour</span>
               <span className="text-3xl font-black text-green-400">RM {parseFloat(court.pricePerHour).toFixed(0)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Schedule Slicer */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-green-500 rounded-full inline-block shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            Select Available Times
          </h2>

          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlots([]); // Clear slots when date changes
            }}
            className="input-premium px-4 py-3 shadow-inner font-mono text-lg"
          />
        </div>

        {/* Schedule Grid */}
        {isSlotsLoading && (
          <div className="animate-pulse flex flex-wrap gap-4 py-8">
             {[...Array(10)].map((_, i) => <div key={i} className="h-16 w-32 bg-slate-800 rounded-xl"></div>)}
          </div>
        )}

        {isSlotsError && (
          <div className="text-red-400 text-sm">Failed to load schedule for this date.</div>
        )}

        {!isSlotsLoading && !isSlotsError && slots?.length === 0 && (
          <div className="p-12 text-center border overflow-hidden border-white/5 border-dashed rounded-2xl bg-slate-900/40 backdrop-blur-2xl text-slate-400">
            No schedule slots are currently available for {selectedDate}.
          </div>
        )}

        {/* 3. Render 1-Hour Time Matrix Grids */}
        {!isSlotsLoading && slots && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
            {slots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  disabled={!slot.isAvailable}
                  onClick={() => handleSlotToggle(slot.id, slot.isAvailable)}
                  className={`
                    relative flex flex-col justify-center items-center py-4 px-2 rounded-xl transition-all border outline-none duration-200 shadow-sm
                    ${!slot.isAvailable 
                        ? 'bg-slate-950/80 border-slate-800/30 opacity-40 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-green-500 border-green-400 shadow-[0_0_15px_rgba(7ade80,0.5)]' 
                          : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-800 cursor-pointer backdrop-blur-3xl'
                    }
                  `}
                >
                  <span className={`font-mono text-lg font-bold tracking-tight ${isSelected ? 'text-slate-900' : slot.isAvailable ? 'text-slate-100' : 'text-slate-600 line-through'}`}>
                    {formatTimeLabel(slot.startTime)}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-2 text-slate-900 text-[10px] font-black">✓</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Booking Summary Bar */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between z-50 animate-in slide-in-from-bottom-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           {bookingError && (
             <div className="w-full bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold tracking-wide text-center mb-4 md:hidden animate-in fade-in zoom-in-95">
               {bookingError}
             </div>
           )}

           <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
             <div>
               <span className="text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-widest block">Selected Duration</span>
               <span className="text-2xl md:text-3xl font-black text-white">{selectedSlots.length} <span className="text-green-400 text-lg md:text-xl font-bold">Hours</span></span>
             </div>
             {bookingError && (
               <div className="hidden md:block max-w-lg bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold tracking-wide animate-in fade-in zoom-in-95">
                 ⚠️ {bookingError}
               </div>
             )}
           </div>
           
           <button 
             onClick={handleCheckout}
             disabled={bookingMutation.isPending}
             className={`mt-4 md:mt-0 w-full md:w-auto px-10 py-4 rounded-xl font-bold tracking-wider text-slate-900 transition-all focus:outline-none ${
                bookingMutation.isPending 
                  ? 'bg-green-600 cursor-not-allowed opacity-80' 
                  : 'bg-green-400 hover:bg-green-300 hover:shadow-[0_0_20px_rgba(7ade80,0.4)]'
              }`}
           >
             {bookingMutation.isPending ? 'PROCESSING...' : 'PROCEED TO CHECKOUT ➔'}
           </button>
        </div>
      )}

    </div>
  );
}
