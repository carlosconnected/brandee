'use client';

import { useState, type FormEvent } from 'react';

interface LoginScreenProps {
  onSignIn: (name: string) => void;
}

const MAX_NAME_LENGTH = 50;

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSubmit) onSignIn(trimmed);
  }

  return (
    <div className="flex items-center justify-center h-full p-6 bg-base">
      <div className="w-full max-w-md bg-panel border border-divider rounded-2xl p-8 shadow-2xl">
        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <Butterfly />
          <div>
            <h1 className="text-3xl font-bold text-content leading-tight">Welcome to Brandee</h1>
            <p className="text-sm text-muted mt-2">Enter your name to start chatting.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              autoFocus
              placeholder="e.g. Carlos"
              className="bg-input border border-divider rounded-xl px-4 py-3 text-content placeholder:text-muted focus:border-brand outline-none transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="text-[11px] text-dim text-center mt-6 leading-relaxed">
          No password required. Your name is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}

function Butterfly() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-14 h-14">
      <defs>
        <linearGradient id="loginButterflyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d="M16 16 C 12 6, 4 6, 3 12 C 2 18, 8 22, 16 16 Z" fill="url(#loginButterflyGrad)" />
      <path d="M16 16 C 12 22, 4 26, 6 28 C 9 30, 14 24, 16 18 Z" fill="url(#loginButterflyGrad)" opacity="0.85" />
      <path d="M16 16 C 20 6, 28 6, 29 12 C 30 18, 24 22, 16 16 Z" fill="url(#loginButterflyGrad)" />
      <path d="M16 16 C 20 22, 28 26, 26 28 C 23 30, 18 24, 16 18 Z" fill="url(#loginButterflyGrad)" opacity="0.85" />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#1e0d40" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
