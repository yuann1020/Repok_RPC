'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';

// Formatter helpers
const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function BookingsHistoryPage() {
  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMyBookings(),
  });

  // Base components for rendering Status Badges
  const renderStatusBadge = (status: string, type: 'general' | 'payment') => {
    let classes = "";
    if (status === 'CONFIRMED' || status === 'PAID') classes = "bg-green-500/10 text-green-400 border-green-500/30";
    if (status === 'CONFIRMED' || status === 'PAID' || status === 'COMPLETED') classes = "bg-green-500/10 text-green-400 border-green-500/30";
    else if (status === 'PENDING' || status === 'UPCOMING') classes = "bg-blue-500/10 text-blue-400 border-blue-500/30";
    else if (status === 'FAILED' || status === 'CANCELLED') classes = "bg-red-500/10 text-red-400 border-red-500/30";
    else if (status === 'UNPAID') classes = "bg-slate-700/50 text-slate-300 border-slate-600";
    else classes = "bg-slate-800 text-slate-400 border-slate-700";

    return (
      <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${classes}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Bookings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">View and manage your court reservations.</p>
        </div>
      </div>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center font-medium">
          Failed to load bookings. Please try again later.
        </div>
      )}

      {!isLoading && !isError && (!bookings || bookings.length === 0) && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center py-32 opacity-100 backdrop-blur-md">
          <span className="text-5xl mb-4">📅</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-300 uppercase">No Reservations Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6 max-w-sm text-center font-medium">You haven&apos;t made any bookings yet. Start playing today!</p>
          <Link href="/courts" className="bg-green-500 text-white hover:bg-green-400 transition-all font-black tracking-[0.1em] px-8 py-3.5 rounded-xl text-xs uppercase shadow-lg hover:shadow-green-500/20">
            BROWSE COURTS
          </Link>
        </div>
      )}

      {/* 3. Render Bookings Grid */}
      {!isLoading && !isError && bookings && bookings.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking: any) => {
            
            const needsPayment = booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'FAILED';
            
            const groupedCourts = Array.from(new Set(booking.items.map((item: any) => item.court?.name)));

            return (
              <div key={booking.id} className="flex flex-col bg-slate-900/40 backdrop-blur-3xl rounded-2xl overflow-hidden border border-white/10 transition-all hover:border-white/20 shadow-xl">
                
                {/* Header */}
                <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">REF</span>
                     <span className="text-xs font-mono font-bold text-slate-300">{booking.bookingReference}</span>
                   </div>
                   <div className="flex gap-2">
                     {renderStatusBadge(booking.status, 'general')}
                     {renderStatusBadge(booking.paymentStatus, 'payment')}
                   </div>
                </div>

                {/* Main Content */}
                <div className="p-6 flex flex-col md:flex-row gap-8 justify-between">
                  <div className="space-y-6 flex-1">
                     
                     <div className="flex gap-4">
                       <span className="text-3xl text-green-500 opacity-80">📍</span>
                       <div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 block mb-1">Courts</span>
                         <span className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">{groupedCourts.join(', ') || 'N/A'}</span>
                       </div>
                     </div>

                     <div className="flex gap-4">
                       <span className="text-3xl text-green-500 opacity-80">🕒</span>
                       <div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 block mb-1">Duration</span>
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                           {booking.items.length > 0 ? (
                             `${formatDateLabel(booking.items[0].startTime)} • ${booking.items.length} Hour(s)`
                           ) : 'N/A'}
                         </span>
                         <div className="mt-3 flex flex-wrap gap-2">
                           {booking.items.map((item: any) => (
                             <span key={item.id} className="px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                               {formatTimeLabel(item.startTime)} - {formatTimeLabel(item.endTime)}
                             </span>
                           ))}
                         </div>
                       </div>
                     </div>

                  </div>

                  <div className="md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-8 flex flex-col justify-between items-start md:items-end min-w-[200px]">
                     <div className="mb-6 md:mb-0">
                       <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-500 block md:text-right mb-1">Total Amount</span>
                       <span className="text-3xl font-black text-slate-900 dark:text-white">RM {parseFloat(booking.totalAmount).toFixed(0)}</span>
                     </div>
                     
                     <div className="w-full flex justify-end gap-3 mt-4">
                       <Link 
                         href={`/bookings/${booking.id}`} 
                         className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 w-full text-center md:w-auto shadow-sm"
                       >
                         DETAILS
                       </Link>

                       {needsPayment && (
                         <Link 
                           href={`/payments/${booking.id}`} 
                           className="px-5 py-2.5 bg-green-500 text-white hover:bg-green-400 transition-all rounded-xl text-[10px] font-black tracking-[0.15em] uppercase w-full text-center shadow-lg shadow-green-500/20 md:w-auto"
                         >
                           PAY NOW
                         </Link>
                       )}
                     </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
