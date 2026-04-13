'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/store/auth-store';
import { PickleballLoader } from '@/components/ui/PickleballLoader';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GoogleLogin } from '@react-oauth/google';

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
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">
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
        className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium outline-none transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${focused ? 'rgba(74,222,128,0.55)' : 'var(--input-border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(74,222,128,0.1)' : 'none',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const normalizedEmail = email.trim().toLowerCase();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSuccess = (data: any) => {
    // Handle Remember Me persistence
    if (rememberMe) {
      localStorage.setItem('remembered_email', normalizedEmail);
    } else {
      localStorage.removeItem('remembered_email');
    }

    const token = data.access_token;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''),
    );
    const claims = JSON.parse(jsonPayload);
    const user = { userId: claims.userId, email: claims.email, role: claims.role };
    setAuth(token, user);
    router.push(user.role === 'ADMIN' ? '/admin' : '/courts');
  };

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email: normalizedEmail, password, rememberMe }),
    onSuccess: handleLoginSuccess,
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Invalid credentials. Please try again.');
    },
  });

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => authApi.googleSignIn(idToken),
    onSuccess: handleLoginSuccess,
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Google sign-in failed.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedEmail || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    setErrorMsg('');
    loginMutation.mutate();
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
          Player <span className="text-green-500">Login</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 font-medium uppercase tracking-widest">Sign in to your account</p>
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
          label="Email Address"
          type="email"
          placeholder="player@repok.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between px-0.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all peer-checked:bg-green-500 peer-checked:border-green-500 shadow-sm" />
                <svg
                  className="absolute w-3 h-3 text-white transition-opacity opacity-0 peer-checked:opacity-100 left-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-slate-400 transition-colors">
                Remember Me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 hover:text-green-500 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-3 w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.18em] text-slate-900 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-xl shadow-green-500/10"
          style={{
            background: loginMutation.isPending
              ? 'rgba(74,222,128,0.5)'
              : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
          }}
        >
          {loginMutation.isPending ? (
            <div className="flex items-center gap-2">
              <PickleballLoader size="sm" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Secure Login</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          )}
        </button>
      </form>

      {googleClientId && (
        <>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white dark:bg-[#020617] px-3 text-slate-400 dark:text-slate-600">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  googleMutation.mutate(credentialResponse.credential);
                }
              }}
              onError={() => {
                setErrorMsg('Google Sign-In failed.');
              }}
              useOneTap
              theme="filled_black"
              shape="pill"
              width="100%"
            />
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-slate-500 font-bold uppercase tracking-widest">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-green-500 hover:text-green-400 transition-colors ml-1">
          Create One
        </Link>
      </p>
    </div>
  );
}
