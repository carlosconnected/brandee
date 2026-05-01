'use client';

import { useEffect } from 'react';
import type { BrandeeState } from '@/types';
import { speakText } from '@/lib/speech';

interface UseGreetingSpeechOptions {
  state: BrandeeState;
  userName: string;
}

/**
 * Speaks "Hi {name}. How can I help you today?" the first time Brandee enters
 * the `greeting` state during this component's lifetime. By design this only
 * fires on a fresh sign-in / first-visit-of-the-day (see `greetingHistory.ts`).
 *
 * Deliberately does NOT touch `setBrandeeState` — the visible greeting wave
 * is owned by the state machine. If we set state from here, the TTS `onEnd`
 * callback could fire later and clobber a reply's `speaking` state during
 * voice-mode conversations.
 */
export function useGreetingSpeech({ state, userName }: UseGreetingSpeechOptions) {
  useEffect(() => {
    if (state !== 'greeting') return;
    speakText(`Hi ${userName}. How can I help you today?`);
  }, [state, userName]);
}
