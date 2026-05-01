'use client';

import { useEffect } from 'react';
import type { BrandeeState } from '@/types';
import { speakText } from '@/lib/speech';
import {
  hasSpokenGreetingToday,
  markGreetingSpokenToday,
} from '@/components/brandee/greetingHistory';

interface UseGreetingSpeechOptions {
  state: BrandeeState;
  userName: string;
}

/**
 * Speaks "Hi {name}. How can I help you today?" the first time Brandee enters
 * the `greeting` state on a given day. The localStorage latch (cleared on
 * sign-out via `clearGreetingHistory`) makes it idempotent against React
 * Strict Mode's dev double-mount and any other accidental re-runs.
 *
 * Deliberately does NOT touch `setBrandeeState` — the visible greeting wave
 * is owned by the state machine. If we set state from here, the TTS `onEnd`
 * callback could fire later and clobber a reply's `speaking` state during
 * voice-mode conversations.
 */
export function useGreetingSpeech({ state, userName }: UseGreetingSpeechOptions) {
  useEffect(() => {
    if (state !== 'greeting') return;
    if (hasSpokenGreetingToday()) return;
    markGreetingSpokenToday();
    speakText(`Hi ${userName}. How can I help you today?`);
  }, [state, userName]);
}
