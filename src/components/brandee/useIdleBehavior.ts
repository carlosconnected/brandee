'use client';

import { useEffect, useState } from 'react';
import type { BrandeeState } from '@/types';
import { MICRO_BEHAVIORS, TIMINGS, type MicroBehavior } from './constants';

/**
 * While `state === 'idle'` AND no transition frame is showing, randomly fires
 * a micro-behavior every 8–15 seconds. Returns the active behavior name (or
 * null when nothing is playing) so BrandeeImage can apply the matching CSS
 * class. Pausing during transitions prevents the behaviors from conflicting
 * visually with the transition pose swap.
 */
export function useIdleBehavior(
  state: BrandeeState,
  transitionFrame: string | null
): MicroBehavior | null {
  const [behavior, setBehavior] = useState<MicroBehavior | null>(null);

  useEffect(() => {
    if (state !== 'idle' || transitionFrame !== null) {
      setBehavior(null);
      return;
    }

    let cancelled = false;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext() {
      const delay =
        TIMINGS.microBehaviorMin +
        Math.random() * (TIMINGS.microBehaviorMax - TIMINGS.microBehaviorMin);

      clearTimer = setTimeout(() => {
        if (cancelled) return;
        const pick = MICRO_BEHAVIORS[Math.floor(Math.random() * MICRO_BEHAVIORS.length)]!;
        setBehavior(pick.name);
        // Clear the behavior class after its duration so it can re-trigger later
        clearTimer = setTimeout(() => {
          if (cancelled) return;
          setBehavior(null);
          scheduleNext();
        }, pick.duration);
      }, delay);
    }

    scheduleNext();

    return () => {
      cancelled = true;
      if (clearTimer) clearTimeout(clearTimer);
      setBehavior(null);
    };
  }, [state, transitionFrame]);

  return behavior;
}
