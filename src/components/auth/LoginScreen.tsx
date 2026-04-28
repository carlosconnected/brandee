'use client';

import { useState, type FormEvent } from 'react';
import { ButterflyIcon } from '@/components/icons';

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
          <ButterflyIcon className="w-14 h-14" />
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

