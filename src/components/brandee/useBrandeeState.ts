'use client';

import { useCallback, useEffect, useReducer } from 'react';
import type { BrandeeState } from '@/types';
import { TIMINGS } from './constants';
import { markGreetedToday, shouldGreet } from './greetingHistory';

interface UseBrandeeStateReturn {
  state: BrandeeState;
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
      // Wake up if Brandee is dozing
      const wokeUp = s.current === 'sleeping' || s.current === 'bored';
      return {
        current: wokeUp ? 'idle' : s.current,
        activityTick: s.activityTick + 1,
      };
    }
  }
}

/**
 * Owns Brandee's state machine, idle escalation timers, and greeting auto-play.
 *
 *  greeting → idle           (after TIMINGS.greetingDuration, only when shouldGreet())
 *  idle → bored              (after TIMINGS.idleToBored, no activity)
 *  bored → sleeping          (after TIMINGS.boredToSleeping, no activity)
 *  celebrating → idle        (after TIMINGS.celebratingDuration)
 *  confused → idle           (after TIMINGS.confusedDuration)
 *
 * `reportActivity()` resets idle-escalation timers and wakes Brandee
 * up if she's bored or sleeping. `setState` and `reportActivity` are
 * stable references, safe to use as effect deps in consumers.
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

  // ── Greeting auto-play ────────────────────────────────────────────────────
  // Whenever state is `greeting`, mark today as greeted and schedule the
  // transition back to idle. The effect is safe to re-run (markGreetedToday
  // is idempotent; cleanup cancels any prior timer). Notably no ref-guard —
  // those don't reset across React Strict Mode's dev double-effect, which
  // would leave the state stuck at greeting forever.
  useEffect(() => {
    if (s.current !== 'greeting') return;
    markGreetedToday();
    const t = setTimeout(() => dispatch({ type: 'set', state: 'idle' }), TIMINGS.greetingDuration);
    return () => clearTimeout(t);
  }, [s.current]);

  // ── Idle escalation: idle → bored → sleeping ──────────────────────────────
  useEffect(() => {
    if (s.current === 'idle') {
      const t = setTimeout(() => dispatch({ type: 'set', state: 'bored' }), TIMINGS.idleToBored);
      return () => clearTimeout(t);
    }
    if (s.current === 'bored') {
      const t = setTimeout(() => dispatch({ type: 'set', state: 'sleeping' }), TIMINGS.boredToSleeping);
      return () => clearTimeout(t);
    }
  }, [s.current, s.activityTick]);

  // ── Auto-return to idle from timed states ─────────────────────────────────
  useEffect(() => {
    if (s.current === 'celebrating') {
      const t = setTimeout(() => dispatch({ type: 'set', state: 'idle' }), TIMINGS.celebratingDuration);
      return () => clearTimeout(t);
    }
    if (s.current === 'confused') {
      const t = setTimeout(() => dispatch({ type: 'set', state: 'idle' }), TIMINGS.confusedDuration);
      return () => clearTimeout(t);
    }
  }, [s.current]);

  // dispatch is guaranteed stable by useReducer — these wrappers are stable too.
  const setState = useCallback((next: BrandeeState) => {
    dispatch({ type: 'set', state: next });
  }, []);

  const reportActivity = useCallback(() => {
    dispatch({ type: 'activity' });
  }, []);

  return { state: s.current, setState, reportActivity };
}
