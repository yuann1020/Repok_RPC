import Link from 'next/link';

export default function WalletTopUpCancelPage() {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-2xl font-black text-amber-300">
        !
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
        Payment cancelled
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
        Stripe Checkout was cancelled before payment completed. No wallet
        credits were added and no payment was captured.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/wallet/top-up"
          className="inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-green-400"
        >
          Choose Package
        </Link>
        <Link
          href="/wallet"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:border-green-400/40 hover:text-green-300"
        >
          Back to Wallet
        </Link>
      </div>
    </div>
  );
}
