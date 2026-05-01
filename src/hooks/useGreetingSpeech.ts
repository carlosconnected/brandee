'use client';

import { useEffect } from 'react';
import type { BrandeeState } from '@/types';
import { speakText } from '@/lib/speech';

interface UseGreetingSpeechOptions {
  state: BrandeeState;
  userName: string;
}

/**
 * Speaks the greeting ("Hi {name}. How can I help you today?") whenever
 * Brandee enters the `greeting` state — which by design happens on the
 * first sign-in of each day (see `greetingHistory.ts`).
 *
 * No unmount-cleanup that cancels speech: in dev Strict Mode the simulated
 * unmount/remount would otherwise cancel the greeting between the two
 * effect runs and nothing would be audible. Sign-out cancels speech
 * explicitly from `handleSignOut` in page.tsx instead.
 */
export function useGreetingSpeech({ state, userName }: UseGreetingSpeechOptions) {
  useEffect(() => {
    if (state !== 'greeting') return;
    speakText(`Hi ${userName}. How can I help you today?`);
  }, [state, userName]);
}
