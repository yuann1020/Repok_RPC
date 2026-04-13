'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authApi.resetPassword({ token, newPassword });
      setMessage(response.message);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-black text-white">Create new password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your new credentials below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="input-premium w-full px-4 py-3 text-sm font-medium"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="input-premium w-full px-4 py-3 text-sm font-medium"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-3 text-xs font-semibold text-green-300">
            {message} Redirecting to login...
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="mt-3 w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.18em] text-slate-900 transition-all shadow-[0_4px_20px_rgba(74,222,128,0.3)] hover:-translate-y-0.5 bg-green-400 hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Changing password...' : 'Update password'}
        </button>
      </form>

      <div>
        <Link
          href="/login"
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-500 p-8">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
