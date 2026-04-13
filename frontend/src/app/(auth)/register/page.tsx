'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { PickleballLoader } from '@/components/ui/PickleballLoader';
import { PasswordInput } from '@/components/ui/PasswordInput';

function InputField({
  label, type = 'text', placeholder, value, onChange, autoComplete,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-700 font-medium outline-none transition-all duration-200"
        style={{
          background: 'rgba(2,9,23,0.7)',
          border: `1px solid ${focused ? 'rgba(74,222,128,0.55)' : 'rgba(51,65,85,0.6)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(74,222,128,0.1)' : 'none',
        }}
      />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const normalizedEmail = email.trim().toLowerCase();

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ fullName, email: normalizedEmail, password, phoneNumber }),
    onSuccess: () => router.push('/login'),
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Registration failed. Please verify your details.';
      setErrorMsg(Array.isArray(message) ? message[0] : message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !normalizedEmail || !password || !phoneNumber) {
      setErrorMsg('All fields are required.');
      return;
    }
    setErrorMsg('');
    registerMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">Join to book premium pickleball courts</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-semibold text-red-400"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {errorMsg}
          </div>
        )}

        <InputField
          label="Full Name"
          type="text"
          placeholder="Ahmad Razif"
          value={fullName}
          onChange={setFullName}
          autoComplete="name"
        />
        <InputField
          label="Email"
          type="email"
          placeholder="you@repok.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <PasswordInput
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <InputField
          label="Phone Number"
          type="tel"
          placeholder="+60 12-345 6789"
          value={phoneNumber}
          onChange={setPhoneNumber}
          autoComplete="tel"
        />

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="mt-3 w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.18em] text-slate-900 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: registerMutation.isPending
              ? 'rgba(74,222,128,0.5)'
              : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            boxShadow: registerMutation.isPending ? 'none' : '0 4px 20px rgba(74,222,128,0.3)',
          }}
          onMouseEnter={e => { if (!registerMutation.isPending) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {registerMutation.isPending
            ? <><PickleballLoader size="sm" /><span>Creating account...</span></>
            : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-green-400 font-bold hover:text-green-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
