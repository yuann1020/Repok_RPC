'use client';

import { useState } from 'react';

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
}: PasswordInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
        {label}
      </label>
      <div
        className="flex items-center rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(2,9,23,0.7)',
          border: `1px solid ${focused ? 'rgba(74,222,128,0.55)' : 'rgba(51,65,85,0.6)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(74,222,128,0.1)' : 'none',
        }}
      >
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder:text-slate-700 font-medium outline-none"
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-green-400 focus:outline-none"
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="M10.58 10.58a2 2 0 102.84 2.84"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.88 5.09A10.94 10.94 0 0112 4.91c5.05 0 8.27 4.19 9.17 5.54.13.2.2.3.24.45-.03.14-.1.24-.24.44a17.5 17.5 0 01-3.3 3.59"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.53 6.53A17.37 17.37 0 002.83 11c-.13.2-.2.3-.23.44.03.15.1.25.23.45C3.73 13.23 6.95 17.42 12 17.42c1.36 0 2.6-.3 3.73-.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2.83 12c.9-1.35 4.12-5.54 9.17-5.54S20.27 10.65 21.17 12c-.9 1.35-4.12 5.54-9.17 5.54S3.73 13.35 2.83 12z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
