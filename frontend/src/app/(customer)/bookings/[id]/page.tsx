'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';

// Formatter helpers
const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params?.id as string;

  // 1. Fetch booking details
  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId),
    enabled: !!bookingId,
  });

  // 2. Cancellation Mutation
  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    }
  });

  if (isLoading) return (
    <div className="flex justify-center items-center py-32">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
    </div>
  );

  if (isError || !booking) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center font-medium max-w-2xl mx-auto mt-10">
      Failed to locate the booking. It may have been deleted or does not exist.
    </div>
  );

  const needsPayment = booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'FAILED';
  const isCancelled = booking.status === 'CANCELLED';
  const isPaid = booking.paymentStatus === 'PAID';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Top Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors text-slate-300">
          ←
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
             Booking Detail
             {isCancelled && <span className="text-sm px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full ml-2 uppercase tracking-wide">Cancelled</span>}
          </h2>
          <p className="text-slate-400 mt-1 font-mono tracking-wider text-sm">#{booking.bookingReference}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Details Column */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-3xl shadow-xl">
               <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Scheduled Slots</h3>
               <div className="space-y-4">
                 {booking.items.map((item: any) => (
                   <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 gap-4">
                      <div>
                        <h4 className="font-bold text-green-400 text-lg">{item.court?.name || 'Pickleball Court'}</h4>
                        <p className="text-sm font-semibold tracking-wide text-slate-300">{formatDateLabel(item.startTime)}</p>
                      </div>
                      <div className="text-right">
                         <span className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-200">
                           {formatTimeLabel(item.startTime)} - {formatTimeLabel(item.endTime)}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-3xl shadow-xl grid grid-cols-2 gap-6">
               <div>
                 <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Booking Date</span>
                 <span className="text-sm text-slate-200 font-mono">{formatDateLabel(booking.bookedAt)}</span>
               </div>
               <div>
                 <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Total Amount</span>
                 <span className="text-xl font-black text-green-400">RM {parseFloat(booking.totalAmount).toFixed(0)}</span>
               </div>
            </div>
         </div>

         {/* Sidebar Status Operations */}
         <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-3xl shadow-xl">
               <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Transaction Status</h3>
               
               <div className="space-y-6">
                 <div>
                   <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Booking</span>
                   <span className={`px-4 py-1.5 border rounded-full text-xs font-bold tracking-widest uppercase inline-block ${
                     booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                     booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                     'bg-red-500/10 text-red-400 border-red-500/30'
                   }`}>
                     {booking.status}
                   </span>
                 </div>

                 <div>
                   <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Payment</span>
                   <span className={`px-4 py-1.5 border rounded-full text-xs font-bold tracking-widest uppercase inline-block ${
                     isPaid ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                     booking.paymentStatus === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                     'bg-slate-700/50 text-slate-300 border-slate-600'
                   }`}>
                     {booking.paymentStatus}
                   </span>
                 </div>
               </div>

               {/* Actions */}
               <div className="mt-8 pt-6 border-t border-slate-800/50 space-y-3 flex flex-col">
                 {!isCancelled && needsPayment && (
                   <Link 
                     href={`/payments/${booking.id}`}
                     className="w-full text-center py-3 bg-green-500 hover:bg-green-400 transition-colors rounded-xl text-xs font-black tracking-wider text-slate-900 uppercase shadow-[0_0_15px_rgba(7ade80,0.3)]"
                   >
                     EXECUTE PAYMENT
                   </Link>
                 )}
                 
                 {/* Cancel Action */}
                 {!isCancelled && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                   <button 
                     onClick={() => { if(window.confirm('Are you sure you want to cancel this booking?')) cancelMutation.mutate(); }}
                     disabled={cancelMutation.isPending}
                     className="w-full text-center py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-colors rounded-xl text-xs font-black tracking-wider text-red-400 uppercase disabled:opacity-50"
                   >
                     {cancelMutation.isPending ? 'CANCELLING...' : 'CANCEL BOOKING'}
                   </button>
                 )}

                 {isPaid && booking.status === 'CONFIRMED' && (
                    <div className="w-full text-center p-3 text-slate-400 text-sm font-semibold border border-white/10 rounded-xl bg-slate-950/50">
                       ✓ Verified & Confirmed.
                    </div>
                 )}
               </div>
            </div>
         </div>
         
      </div>
    </div>
  );
}
