'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { walletApi, WalletTransaction } from '@/lib/api/wallet.api';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCredits = (value: number) => value.toFixed(2);

function transactionTone(transaction: WalletTransaction) {
  if (transaction.status !== 'SUCCESS') {
    return 'text-amber-300';
  }

  return transaction.amount >= 0 ? 'text-green-300' : 'text-red-300';
}

export default function WalletPage() {
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: walletApi.getTransactions,
  });

  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data || [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Wallet
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-400">
            Use Repok credits for faster court checkout.
          </p>
        </div>
        <Link
          href="/wallet/top-up"
          className="inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400"
        >
          Top Up Credits
        </Link>
      </div>

      <section className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
            Available Balance
          </p>
          {walletQuery.isLoading ? (
            <div className="mt-6 h-12 w-48 rounded-xl skeleton" />
          ) : (
            <div className="mt-5 flex items-end gap-3">
              <span className="text-5xl font-black text-white">
                {formatCredits(wallet?.balance || 0)}
              </span>
              <span className="pb-2 text-sm font-black uppercase tracking-[0.18em] text-green-400">
                credits
              </span>
            </div>
          )}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            RM1 equals 1 credit. Booking payments deduct the same number of
            credits as the booking amount in RM.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
            Top-Up Packages
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>RM50</span>
              <span className="font-bold text-white">50 credits</span>
            </div>
            <div className="flex justify-between">
              <span>RM100</span>
              <span className="font-bold text-white">100 credits</span>
            </div>
            <div className="flex justify-between">
              <span>RM200</span>
              <span className="font-bold text-green-300">210 credits</span>
            </div>
            <div className="flex justify-between">
              <span>RM500</span>
              <span className="font-bold text-green-300">550 credits</span>
            </div>
            <div className="border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-500">
              Custom top-ups start at RM10 and give 1 credit per RM with no
              bonus credits.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl backdrop-blur-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">
            Recent Transactions
          </h2>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            <div className="h-14 rounded-xl skeleton" />
            <div className="h-14 rounded-xl skeleton" />
            <div className="h-14 rounded-xl skeleton" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-slate-300">
              No wallet transactions yet.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Your top-ups and booking deductions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-white">
                    {transaction.description || transaction.type.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(transaction.createdAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-lg font-black ${transactionTone(transaction)}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCredits(transaction.amount)}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Balance {formatCredits(transaction.balanceAfter)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
