'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { walletApi } from '@/lib/api/wallet.api';

const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (value: string | number) => Number(value).toFixed(2);
const EXPIRED_BOOKING_MESSAGE =
  'This booking expired because payment was not completed within 10 minutes.';

const getRemainingMs = (expiresAt?: string | null, nowMs = Date.now()) => {
  if (!expiresAt) return null;
  return Math.max(new Date(expiresAt).getTime() - nowMs, 0);
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  if (typeof message === 'object' && message?.message) return message.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.toLowerCase().includes('expired')) {
    return EXPIRED_BOOKING_MESSAGE;
  }
  return message || 'Something went wrong. Please try again.';
}

export default function PaymentGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params?.bookingId as string;

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId),
    enabled: !!bookingId,
  });

  const paymentQuery = useQuery({
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

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet,
  });

  const initiateMutation = useMutation({
    mutationFn: () => paymentsApi.initiatePayment(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });

  const payWithWalletMutation = useMutation({
    mutationFn: () => bookingsApi.payWithWallet(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: () => {
      if (!paymentQuery.data?.id || !proofBase64) {
        throw new Error('Payment record and proof image are required');
      }
      return paymentsApi.uploadProof(paymentQuery.data.id, proofBase64);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });

  if (bookingQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-32">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Loading transaction...
        </p>
      </div>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center font-medium text-red-400">
        Failed to locate the booking. It may have been deleted or does not
        exist.
      </div>
    );
  }

  const booking = bookingQuery.data;
  const payment = paymentQuery.data;
  const wallet = walletQuery.data;
  const bookingAmount = Number(booking.totalAmount);
  const walletBalance = wallet?.balance || 0;
  const hasEnoughWalletBalance = walletBalance >= bookingAmount;
  const isPaid = booking.paymentStatus === 'PAID';
  const isPendingReview = booking.paymentStatus === 'PENDING_REVIEW';
  const isFailed = booking.paymentStatus === 'FAILED';
  const remainingMs = getRemainingMs(booking.expiresAt, nowMs);
  const isExpired =
    booking.status === 'EXPIRED' ||
    booking.paymentStatus === 'EXPIRED' ||
    (!isPaid && remainingMs !== null && remainingMs <= 0);
  const hasPaymentRecord = payment !== null && payment !== undefined;

  const handleFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="border-b border-white/10 pb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Secure Checkout
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Pay instantly with wallet credits or use manual QR as a fallback.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300">
            # {booking.bookingReference}
          </span>
          <span
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
              isPaid
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : isPendingReview
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : isExpired
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : isFailed
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            }`}
          >
            {booking.paymentStatus.replace('_', ' ')}
          </span>
        </div>

        {!isPaid && !isExpired && remainingMs !== null && (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200">
            Complete payment within {formatCountdown(remainingMs)}
          </div>
        )}

        {isExpired && (
          <div className="mx-auto mt-5 max-w-lg rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
            {EXPIRED_BOOKING_MESSAGE}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-3xl md:p-8">
        <h2 className="mb-6 text-[13px] font-bold uppercase tracking-wider text-slate-100">
          Reservation Summary
        </h2>

        <div className="mb-8 space-y-4">
          {booking.items.map((item: any) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-800/50 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-bold text-green-400">
                  {item.court?.name || 'Pickleball Court'}
                </h3>
                <p className="text-sm font-semibold tracking-wide text-slate-400">
                  {formatDateLabel(item.startTime)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {formatTimeLabel(item.startTime)} - {formatTimeLabel(item.endTime)}
                </p>
              </div>
              <span className="text-lg font-black text-white">
                RM {formatMoney(item.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-slate-800 pt-6">
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Total
          </span>
          <span className="text-4xl font-extrabold text-white">
            RM <span className="text-green-400">{formatMoney(bookingAmount)}</span>
          </span>
        </div>
      </section>

      {isPaid ? (
        <section className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center shadow-xl">
          <h2 className="text-2xl font-black text-white">Payment Approved</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Your booking is paid and confirmed.
          </p>
          <button
            type="button"
            onClick={() => router.push('/bookings')}
            className="mt-6 rounded-xl bg-slate-800 px-8 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-slate-700"
          >
            View My Bookings
          </button>
        </section>
      ) : isExpired ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-xl">
          <h2 className="text-2xl font-black text-white">Booking Expired</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            This booking has expired. Please create a new booking to select
            available slots again.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/courts"
              className="rounded-xl bg-green-500 px-8 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-green-400"
            >
              Book Again
            </Link>
            <Link
              href="/bookings"
              className="rounded-xl border border-white/10 px-8 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:border-slate-500"
            >
              View Bookings
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-3xl md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-green-400">
                  Recommended
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Pay with Wallet
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Booking amount: {formatMoney(bookingAmount)} credits. Your
                  wallet balance: {walletQuery.isLoading ? 'checking...' : `${formatMoney(walletBalance)} credits`}.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:min-w-[240px]">
                {hasEnoughWalletBalance ? (
                  <button
                    type="button"
                    onClick={() => payWithWalletMutation.mutate()}
                    disabled={payWithWalletMutation.isPending}
                    className="rounded-xl bg-green-500 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payWithWalletMutation.isPending ? 'Paying...' : 'Pay with Wallet'}
                  </button>
                ) : (
                  <Link
                    href="/wallet/top-up"
                    className="rounded-xl bg-green-500 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400"
                  >
                    Top Up Now
                  </Link>
                )}
                {!hasEnoughWalletBalance && !walletQuery.isLoading && (
                  <p className="text-center text-xs font-semibold text-amber-300">
                    Insufficient balance. You need {formatMoney(bookingAmount - walletBalance)} more credits.
                  </p>
                )}
                {payWithWalletMutation.isError && (
                  <p className="text-center text-xs font-semibold text-red-300">
                    {getErrorMessage(payWithWalletMutation.error)}
                  </p>
                )}
              </div>
            </div>
          </section>

          {isPendingReview ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center shadow-xl">
              <h2 className="text-2xl font-black text-white">
                Verification Pending
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Your manual payment receipt has been received and is waiting for
                admin review.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-6 shadow-xl backdrop-blur-3xl md:p-8">
              <div className="mx-auto max-w-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Fallback
                </p>
                <h2 className="mt-2 text-xl font-black text-white">
                  Manual QR Payment
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Keep using the existing QR receipt flow if wallet payment is
                  not available yet.
                </p>
              </div>

              {!hasPaymentRecord || isFailed ? (
                <div className="mt-8 flex flex-col items-center gap-4">
                  {isFailed && (
                    <p className="max-w-lg rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
                      Your previous receipt was rejected. Please try again.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => initiateMutation.mutate()}
                    disabled={initiateMutation.isPending}
                    className="w-full max-w-xs rounded-xl bg-slate-800 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {initiateMutation.isPending
                      ? 'Preparing...'
                      : 'Use Manual QR'}
                  </button>
                  {initiateMutation.isError && (
                    <p className="text-sm font-semibold text-red-300">
                      {getErrorMessage(initiateMutation.error)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-green-500 bg-green-500/20 font-black text-green-400">
                      1
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                      Scan and Pay
                    </h3>
                    <div className="relative mx-auto my-5 flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border-4 border-slate-200 bg-white p-4">
                      <img
                        src="/tng-qr.jpg"
                        alt="TNG QR Code"
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="absolute inset-4 -z-10 flex items-center justify-center rounded-lg bg-slate-100 p-4 text-center text-sm font-bold text-slate-500">
                        Add tng-qr.jpg to the public directory.
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Pay exactly{' '}
                      <span className="font-bold text-green-400">
                        RM {formatMoney(bookingAmount)}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-blue-500 bg-blue-500/20 font-black text-blue-400">
                      2
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                      Upload Receipt
                    </h3>
                    <label className="mt-5 block cursor-pointer rounded-xl border-2 border-dashed border-white/20 p-8 transition-colors hover:border-green-400 hover:bg-slate-900/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileDrop}
                        className="hidden"
                      />
                      {proofBase64 ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={proofBase64}
                            alt="Proof preview"
                            className="mb-3 h-32 w-32 rounded-lg border-2 border-slate-500 object-cover"
                          />
                          <span className="max-w-[220px] truncate text-sm font-bold text-green-400">
                            {proofFile?.name}
                          </span>
                          <span className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">
                            Click to change
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-sm font-bold text-slate-300">
                            Browse for receipt image
                          </span>
                          <span className="text-xs text-slate-500">
                            JPG or PNG
                          </span>
                        </div>
                      )}
                    </label>

                    <button
                      type="button"
                      onClick={() => uploadProofMutation.mutate()}
                      disabled={uploadProofMutation.isPending || !proofBase64}
                      className="mt-6 w-full rounded-xl bg-green-500 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      {uploadProofMutation.isPending
                        ? 'Uploading...'
                        : 'Submit Receipt'}
                    </button>
                    {uploadProofMutation.isError && (
                      <p className="mt-3 text-sm font-semibold text-red-300">
                        {getErrorMessage(uploadProofMutation.error)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
