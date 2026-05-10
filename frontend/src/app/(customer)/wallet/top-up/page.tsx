'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CreateStripeTopUpCheckoutPayload,
  TOP_UP_PACKAGES,
  TopUpPackageCode,
  walletApi,
} from '@/lib/api/wallet.api';

const MIN_CUSTOM_TOP_UP_RM = 10;
const MAX_CUSTOM_TOP_UP_RM = 2000;

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  if (typeof message === 'object' && message?.message) return message.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || 'Unable to start Stripe Checkout. Please try again.';
}

function validateCustomAmount(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return 'Enter a custom amount.';
  if (!/^\d+$/.test(trimmed)) return 'Please enter a whole number.';

  const amount = Number(trimmed);
  if (amount < MIN_CUSTOM_TOP_UP_RM) return 'Minimum top-up is RM10.';
  if (amount > MAX_CUSTOM_TOP_UP_RM) return 'Maximum top-up is RM2000.';

  return '';
}

export default function WalletTopUpPage() {
  const [customAmount, setCustomAmount] = useState('');
  const customValidationError = useMemo(
    () => (customAmount ? validateCustomAmount(customAmount) : ''),
    [customAmount],
  );

  const checkoutMutation = useMutation({
    mutationFn: (payload: CreateStripeTopUpCheckoutPayload) =>
      walletApi.createStripeTopUpCheckout(payload),
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_top_up_order_id', data.topUpOrderId);
      }
      window.location.assign(data.checkoutUrl);
    },
  });

  const startCustomCheckout = () => {
    const validationError = validateCustomAmount(customAmount);
    if (validationError) return;

    checkoutMutation.mutate({ customAmount: Number(customAmount) });
  };

  const isCustomLoading =
    checkoutMutation.isPending &&
    'customAmount' in (checkoutMutation.variables || {});
  const hasCustomAmount = customAmount.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-green-400">
            Stripe Checkout
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Top Up Wallet
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
            Choose a package or enter a custom amount. Credits are added only
            after the Stripe webhook confirms successful payment.
          </p>
        </div>
        <Link
          href="/wallet"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:border-green-400/40 hover:text-green-300"
        >
          Back to Wallet
        </Link>
      </div>

      {checkoutMutation.isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
          {getErrorMessage(checkoutMutation.error)}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {TOP_UP_PACKAGES.map((pkg) => {
          const bonus = pkg.credits - pkg.amountRm;
          const isLoading =
            checkoutMutation.isPending &&
            checkoutMutation.variables &&
            'packageCode' in checkoutMutation.variables &&
            checkoutMutation.variables.packageCode === pkg.code;

          return (
            <button
              key={pkg.code}
              type="button"
              onClick={() =>
                checkoutMutation.mutate({
                  packageCode: pkg.code as TopUpPackageCode,
                })
              }
              disabled={checkoutMutation.isPending}
              className="group rounded-2xl border border-white/10 bg-slate-900/55 p-6 text-left shadow-xl backdrop-blur-3xl transition-all hover:border-green-400/40 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                    {pkg.label}
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-white">
                    RM {pkg.amountRm}
                  </h2>
                </div>
                {bonus > 0 && (
                  <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-300">
                    +{bonus} bonus
                  </span>
                )}
              </div>

              <div className="mt-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-green-300">
                    {pkg.credits}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    credits
                  </p>
                </div>
                <span className="rounded-xl bg-green-500 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-colors group-hover:bg-green-400">
                  {isLoading ? 'Opening...' : 'Checkout'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-3xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Custom Top-up
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Enter Your Amount
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Custom top-ups do not include bonus credits. RM1 equals 1 credit.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label
              htmlFor="custom-top-up"
              className="text-xs font-black uppercase tracking-[0.16em] text-slate-400"
            >
              Custom amount
            </label>
            <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 focus-within:border-green-400/50">
              <span className="flex items-center border-r border-white/10 px-4 text-sm font-black text-green-300">
                RM
              </span>
              <input
                id="custom-top-up"
                type="text"
                inputMode="numeric"
                placeholder="Minimum RM10"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-4 text-lg font-bold text-white outline-none placeholder:text-slate-600"
              />
            </div>
            {(customValidationError || customAmount) && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  customValidationError ? 'text-amber-300' : 'text-green-300'
                }`}
              >
                {customValidationError ||
                  `${Number(customAmount).toFixed(0)} credits, no bonus.`}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={startCustomCheckout}
          disabled={
            checkoutMutation.isPending ||
            !hasCustomAmount ||
            Boolean(customValidationError)
          }
          className="mt-6 w-full rounded-xl bg-green-500 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
        >
          {isCustomLoading ? 'Opening Stripe...' : 'Top Up Custom Amount'}
        </button>
      </section>
    </div>
  );
}
