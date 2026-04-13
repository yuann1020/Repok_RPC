'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';
import { paymentsApi } from '@/lib/api/payments.api';

// Formatter helpers
const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export default function PaymentGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params?.bookingId as string;

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  // 1. Fetch booking details
  const { data: booking, isLoading: isBookingLoading, isError: isBookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId),
    enabled: !!bookingId,
  });

  // 2. Fetch specific nested payment operations 
  const { data: payment, isLoading: isPaymentLoading } = useQuery({
    queryKey: ['payment', bookingId],
    queryFn: async () => {
      try {
        return await paymentsApi.getPaymentForBooking(bookingId);
      } catch (err: any) {
         if (err.response?.status === 404) return null;
         throw err;
      }
    },
    enabled: !!bookingId,
    retry: 0,
  });

  // --- MUTATIONS ---
  const initiateMutation = useMutation({
    mutationFn: () => paymentsApi.initiatePayment(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    }
  });

  const uploadProofMutation = useMutation({
    mutationFn: () => paymentsApi.uploadProof(payment.id, proofBase64!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to upload receipt. Please try again.')
  });

  if (isBookingLoading) return (
    <div className="flex justify-center flex-col items-center py-32 space-y-4">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading transaction...</p>
    </div>
  );

  if (isBookingError || !booking) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center font-medium">
      Failed to locate the booking. It may have been deleted or does not exist.
    </div>
  );

  // Status Checkers
  const isPaid = booking.paymentStatus === 'PAID';
  const isPendingReview = booking.paymentStatus === 'PENDING_REVIEW';
  const isFailed = booking.paymentStatus === 'FAILED';
  const hasPaymentRecord = payment !== null && payment !== undefined;

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header */}
      <div className="text-center pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Secure Checkout</h1>
        <p className="text-slate-400">Complete your transaction using TNG eWallet.</p>
        
        <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
           <span className="px-4 py-1.5 border border-slate-700 bg-slate-900 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300">
             # {booking.bookingReference}
           </span>
           <span className={`px-4 py-1.5 border rounded-full text-xs font-bold uppercase tracking-widest ${
             isPaid ? 'border-green-500/30 bg-green-500/10 text-green-400' : 
             isPendingReview ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
             isFailed ? 'border-red-500/30 bg-red-500/10 text-red-400' : 
             'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
           }`}>
             {booking.paymentStatus.replace('_', ' ')}
           </span>
        </div>
      </div>

      {/* 2. Order Summary Dashboard */}
      <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-3xl shadow-xl">
        <h3 className="text-xl font-bold text-slate-100 mb-6 uppercase tracking-wider text-[13px]">Reservation Subtotals</h3>
        
        <div className="space-y-4 mb-8">
           {booking.items.map((item: any, idx: number) => (
             <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 gap-4">
                <div>
                  <h4 className="font-bold text-green-400">{item.court?.name || 'Pickleball Court'}</h4>
                  <p className="text-sm font-semibold tracking-wide text-slate-400">{formatDateLabel(item.startTime)}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{formatTimeLabel(item.startTime)} - {formatTimeLabel(item.endTime)}</p>
                </div>
                <div className="text-right">
                   <span className="text-lg font-black text-white">RM {parseFloat(item.price).toFixed(2)}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-800 border-dashed">
          <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
          <span className="text-4xl font-extrabold text-white">RM <span className="text-green-400">{parseFloat(booking.totalAmount).toFixed(2)}</span></span>
        </div>
      </div>

      {/* 3. Transaction Control Center */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-3xl text-center shadow-xl">
        
        {isPaid ? (
           <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95 fill-mode-forwards duration-500">
             <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mb-2">
               <span className="text-4xl text-green-400">✓</span>
             </div>
             <h3 className="text-2xl font-black text-white">Payment Approved!</h3>
             <p className="text-slate-400 max-w-sm">Your payment was reviewed and verified. Your booking is officially locked.</p>
             <button onClick={() => router.push('/bookings')} className="mt-4 bg-slate-800 hover:bg-slate-700 transition-colors text-white font-bold py-3 px-8 rounded-xl tracking-wider text-sm border border-slate-600">
               VIEW MY BOOKINGS
             </button>
           </div>
           
        ) : isPendingReview ? (
           <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95 fill-mode-forwards duration-500">
             <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/50 rounded-full flex items-center justify-center mb-2">
               <span className="text-4xl text-amber-400">?</span>
             </div>
             <h3 className="text-2xl font-black text-white">Verification Pending...</h3>
             <p className="text-slate-400 max-w-sm leading-relaxed">Your payment receipt has been successfully received. We are manually reviewing it.</p>
             <button disabled className="mt-4 bg-amber-500/10 transition-colors text-amber-400 font-bold py-3 px-8 rounded-xl tracking-wider text-[11px] border border-amber-500/20 uppercase opacity-70">
               WAITING FOR ADMIN
             </button>
           </div>
           
        ) : isPaymentLoading ? (
           <div className="py-8"><div className="animate-spin mx-auto rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400"></div></div>
           
        ) : (
           <div className="py-2">
              {!hasPaymentRecord || isFailed ? (
                 <div className="flex flex-col items-center gap-6">
                    {isFailed && (
                       <p className="text-red-400 text-sm font-semibold p-4 bg-red-500/10 rounded-xl border border-red-500/20 max-w-lg mb-4">
                         Your previously uploaded receipt was rejected. Please try again.
                       </p>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Pay?</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-2 text-sm leading-relaxed">Click below to generate your unique payment session and reveal the official QR code.</p>
                    <button 
                      onClick={() => initiateMutation.mutate()}
                      disabled={initiateMutation.isPending}
                      className={`w-full max-w-xs py-4 rounded-xl font-black tracking-wider text-[11px] uppercase text-slate-900 transition-all ${
                         initiateMutation.isPending ? 'bg-green-600 opacity-60 cursor-not-allowed' : 'bg-green-400 hover:bg-green-300 hover:shadow-[0_0_20px_rgba(7ade80,0.4)]'
                      }`}
                    >
                      {initiateMutation.isPending ? 'GENERATING SECURE LINK...' : 'INITIATE PAYMENT'}
                    </button>
                 </div>
              ) : (
                 <div className="flex flex-col items-center gap-8 animate-in slide-in-from-bottom-2 duration-500">
                    
                    {/* Step 1 */}
                    <div className="border border-white/10 bg-slate-900/80 p-6 rounded-2xl w-full max-w-md shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-6 justify-center">
                         <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 text-green-400 font-black flex items-center justify-center">1</div>
                         <h3 className="text-lg font-bold text-white uppercase tracking-wider">Scan & Pay</h3>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-4 mx-auto w-48 h-48 sm:w-64 sm:h-64 overflow-hidden border-4 border-slate-200 pointer-events-none select-none">
                         {/* Fallback to text if missing image, but user drops image in public/tng-qr.jpg */}
                         <img src="/tng-qr.jpg" alt="TNG QR Code" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                         <span className="text-slate-500 font-bold absolute text-sm empty:hidden -z-10 bg-slate-100 w-48 h-48 flex items-center justify-center rounded-lg text-center p-4">Please upload tng-qr.jpg into /public directory.</span>
                      </div>
                      <p className="text-slate-400 text-sm">Please pay <span className="font-bold text-green-400">RM {parseFloat(booking.totalAmount).toFixed(2)}</span> accurately to the provided TNG wallet.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="border border-white/10 bg-slate-900/80 p-6 rounded-2xl w-full max-w-md shadow-2xl relative backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-6 justify-center">
                         <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 font-black flex items-center justify-center">2</div>
                         <h3 className="text-lg font-bold text-white uppercase tracking-wider">Upload Receipt</h3>
                      </div>
                      
                      <label className="block w-full border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-green-400 hover:bg-slate-900/50 transition-all cursor-pointer relative group">
                        <input type="file" accept="image/*" onChange={handleFileDrop} className="hidden" />
                        {proofBase64 ? (
                           <div className="flex flex-col items-center">
                              <img src={proofBase64} alt="Proof preview" className="w-32 h-32 object-cover rounded-lg border-2 border-slate-500 mb-3 group-hover:scale-105 transition-transform" />
                              <span className="text-sm text-green-400 font-bold truncate max-w-[200px]">{proofFile?.name}</span>
                              <span className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Click to change</span>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl opacity-50 block transition-transform group-hover:-translate-y-2">📸</span>
                              <span className="text-sm font-bold text-slate-300">Browse or drop an image here</span>
                              <span className="text-xs text-slate-500">Supports JPG, PNG</span>
                           </div>
                        )}
                      </label>
                      
                      <button 
                        onClick={() => uploadProofMutation.mutate()}
                        disabled={uploadProofMutation.isPending || !proofBase64}
                        className={`w-full mt-6 py-4 rounded-xl font-black tracking-wider text-[11px] uppercase transition-all ${
                           uploadProofMutation.isPending || !proofBase64 
                           ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                           : 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        }`}
                      >
                        {uploadProofMutation.isPending ? 'UPLOADING...' : 'SUBMIT RECEIPT FOR REVIEW'}
                      </button>
                    </div>

                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
