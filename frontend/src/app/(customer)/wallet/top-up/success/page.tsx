'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '@/lib/api/wallet.api';

function TopUpSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [lookupId, setLookupId] = useState(sessionId);

  useEffect(() => {
    if (sessionId) {
      setLookupId(sessionId);
      return;
    }

    const savedOrderId = localStorage.getItem('last_top_up_order_id');
    if (savedOrderId) {
      setLookupId(savedOrderId);
    }
  }, [sessionId]);

  const orderQuery = useQuery({
    queryKey: ['wallet-top-up', lookupId],
    queryFn: () => walletApi.getTopUpOrder(lookupId),
    enabled: Boolean(lookupId),
    refetchInterval: 3000,
    retry: 1,
  });

  const order = orderQuery.data;
  const isPaid = order?.status === 'PAID';
  const isTerminalFailure =
    order?.status === 'FAILED' ||
    order?.status === 'CANCELLED' ||
    order?.status === 'EXPIRED';

  return (
    <div className="mx-auto flex min-h-[58vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border ${
          isPaid
            ? 'border-green-400/40 bg-green-400/10 text-green-300'
            : isTerminalFailure
              ? 'border-red-400/40 bg-red-400/10 text-red-300'
              : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
        }`}
      >
        <span className="text-2xl font-black">
          {isPaid ? 'OK' : isTerminalFailure ? '!' : '...'}
        </span>
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
        {isPaid
          ? 'Payment received'
          : isTerminalFailure
            ? 'Payment not completed'
            : 'Payment processing'}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
        {isPaid
          ? 'Stripe confirmed your payment and your wallet has been credited.'
          : 'This page does not credit your wallet directly. Your credits appear after the backend receives and verifies the Stripe webhook.'}
      </p>

      <div className="mt-8 w-full rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-slate-500">Status</span>
          <span className="font-black text-white">
            {orderQuery.isLoading ? 'Checking...' : order?.status || 'Unknown'}
          </span>
        </div>
        {order && (
          <>
            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Package</span>
              <span className="font-bold text-slate-200">
                {order.isCustom ? 'Custom top-up' : order.packageCode}
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-200">
                RM {Number(order.amountRm).toFixed(0)}
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Credits</span>
              <span className="font-bold text-green-300">{order.credits}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/wallet"
          className="inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-green-400"
        >
          View Wallet
        </Link>
        <Link
          href="/wallet/top-up"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:border-green-400/40 hover:text-green-300"
        >
          Top Up Again
        </Link>
      </div>
    </div>
  );
}

export default function WalletTopUpSuccessPage() {
  return (
    <Suspense fallback={null}>
      <TopUpSuccessContent />
    </Suspense>
  );
}
