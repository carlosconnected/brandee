'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { BrandeeState } from '@/types';
import { TIMINGS, TRANSITIONS, TRANSITION_SEQUENCES, transitionKey } from './constants';
import { markGreetedToday, shouldGreet } from './greetingHistory';

interface UseBrandeeStateReturn {
  state: BrandeeState;
  transitionFrame: string | null;
  setState: (next: BrandeeState) => void;
  reportActivity: () => void;
}

interface ReducerState {
  current: BrandeeState;
  /** Bumps on every reportActivity() — used as an effect dep to reset idle timers. */
  activityTick: number;
}

type ReducerAction =
  | { type: 'set'; state: BrandeeState }
  | { type: 'activity' };

function reducer(s: ReducerState, a: ReducerAction): ReducerState {
  switch (a.type) {
    case 'set':
      return s.current === a.state ? s : { ...s, current: a.state };
    case 'activity': {
      const wokeUp = s.current === 'sleeping' || s.current === 'bored';
      return {
        current: wokeUp ? 'idle' : s.current,
        activityTick: s.activityTick + 1,
      };
    }
  }
}

/**
 * Owns Brandee's state machine, idle escalation, greeting auto-play, and
 * transition-frame sequencing.
 *
 *   greeting → idle           (after TIMINGS.greetingDuration, only when shouldGreet())
 *   idle → bored              (after TIMINGS.idleToBored, no activity)
 *   bored → sleeping          (after TIMINGS.boredToSleeping, no activity)
 *   celebrating → idle        (after TIMINGS.celebratingDuration)
 *   confused → idle           (after TIMINGS.confusedDuration)
 *
 * `setState` routes through transition logic — single-frame transitions hold
 * their pose for TIMINGS.singleTransitionHold ms, multi-frame sequences play
 * each frame for its declared hold. State pairs without a defined transition
 * just dispatch directly (relying on the BrandeeImage cross-fade).
 *
 * `reportActivity()` resets idle-escalation timers and wakes Brandee from
 * bored/sleeping. Both `setState` and `reportActivity` are stable references.
 */
export function useBrandeeState(): UseBrandeeStateReturn {
  const [s, dispatch] = useReducer(
    reducer,
    null,
    (): ReducerState => ({
      current: shouldGreet() ? 'greeting' : 'idle',
      activityTick: 0,
    })
  );

  const [transitionFrame, setTransitionFrame] = useState<string | null>(null);

  // Keep a live ref of the current state so the stable setState wrapper
  // can read it without being re-created on every change.
  const stateRef = useRef<BrandeeState>(s.current);
  useEffect(() => {
    stateRef.current = s.current;
  }, [s.current]);

  // Track in-flight transition timers so a new setState can cancel them.
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  function clearTransitionTimer() {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }

  const setState = useCallback((next: BrandeeState) => {
    const from = stateRef.current;
    if (from === next) return;

    clearTransitionTimer();

    const key = transitionKey(from, next);

    // Multi-frame sequence (e.g. sleeping → listening wake-up)
    const sequence = TRANSITION_SEQUENCES[key];
    if (sequence && sequence.length > 0) {
      let i = 0;
      const playNext = () => {
        if (i >= sequence.length) {
          setTransitionFrame(null);
          dispatch({ type: 'set', state: next });
          return;
        }
        const step = sequence[i]!;
        setTransitionFrame(step.frame);
        i++;
        transitionTimerRef.current = setTimeout(playNext, step.hold);
      };
      playNext();
      return;
    }

    // Single-frame transition
    const single = TRANSITIONS[key];
    if (single) {
      setTransitionFrame(single);
      transitionTimerRef.current = setTimeout(() => {
        setTransitionFrame(null);
        dispatch({ type: 'set', state: next });
      }, TIMINGS.singleTransitionHold);
      return;
    }

    // No transition defined — direct cross-fade
    setTransitionFrame(null);
    dispatch({ type: 'set', state: next });
  }, []);

  const reportActivity = useCallback(() => {
    dispatch({ type: 'activity' });
  }, []);

  // ── Greeting auto-play ────────────────────────────────────────────────────
  // Whenever state is `greeting`, mark today as greeted and schedule the
  // transition back to idle. No ref-guard — those don't survive React Strict
  // Mode's dev double-effect; cleanup naturally cancels prior timers.
  useEffect(() => {
    if (s.current !== 'greeting') return;
    markGreetedToday();
    const t = setTimeout(() => setState('idle'), TIMINGS.greetingDuration);
    return () => clearTimeout(t);
  }, [s.current, setState]);

  // ── Idle escalation: idle → bored → sleeping ──────────────────────────────
  // Activity tick included in deps so reportActivity() resets the timers.
  useEffect(() => {
    if (s.current === 'idle') {
      const t = setTimeout(() => setState('bored'), TIMINGS.idleToBored);
      return () => clearTimeout(t);
    }
    if (s.current === 'bored') {
      const t = setTimeout(() => setState('sleeping'), TIMINGS.boredToSleeping);
      return () => clearTimeout(t);
    }
  }, [s.current, s.activityTick, setState]);

  // ── Auto-return to idle from timed states ─────────────────────────────────
  useEffect(() => {
    if (s.current === 'celebrating') {
      const t = setTimeout(() => setState('idle'), TIMINGS.celebratingDuration);
      return () => clearTimeout(t);
    }
    if (s.current === 'confused') {
      const t = setTimeout(() => setState('idle'), TIMINGS.confusedDuration);
      return () => clearTimeout(t);
    }
  }, [s.current, setState]);

  return { state: s.current, transitionFrame, setState, reportActivity };
}
