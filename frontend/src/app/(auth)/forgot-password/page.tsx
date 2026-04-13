'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white">Reset password</h2>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;ll send a recovery link to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-premium w-full px-4 py-3 text-sm font-medium"
            placeholder="ceo@example.com"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-3 text-xs font-semibold text-green-300">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.18em] text-slate-900 transition-all shadow-[0_4px_20px_rgba(74,222,128,0.3)] hover:-translate-y-0.5 bg-green-400 hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition hover:text-white"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
