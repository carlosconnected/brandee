'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import type { BrandeeState } from '@/types';
import { frameUrl, getFrames, RESTING_STATES, TIMINGS } from './constants';
import { useIdleBehavior } from './useIdleBehavior';

interface BrandeeImageProps {
  state: BrandeeState;
  size: number;
}

/**
 * Renders the active Brandee frame with three animation layers:
 *
 *   Outer wrapper  → wake-up bounce (one-shot when leaving sleeping)
 *   Breathe wrap   → continuous breathe (resting states only)
 *   Float wrap     → continuous float   (resting states only)
 *   AnimatePresence→ cross-fade between states (keyed on state)
 *   Micro-behavior → idle-only blink/look/wiggle/etc
 */
export function BrandeeImage({ state, size }: BrandeeImageProps) {
  const frames        = getFrames(state);
  const microBehavior = useIdleBehavior(state);
  const [frameIndex, setFrameIndex] = useState(0);

  // Frame swapping for multi-frame states (greeting). No cross-fade between
  // frames within a state — only between states.
  useEffect(() => {
    setFrameIndex(0);
    if (frames.length <= 1) return;

    const id = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, TIMINGS.greetingFrameSwap);
    return () => clearInterval(id);
  }, [state, frames.length]);

  // Wake-up bounce — fires once when transitioning out of `sleeping`
  const prevStateRef = useRef<BrandeeState>(state);
  const [wakingUp, setWakingUp] = useState(false);
  useEffect(() => {
    if (prevStateRef.current === 'sleeping' && state !== 'sleeping') {
      setWakingUp(true);
      const t = setTimeout(() => setWakingUp(false), TIMINGS.wakeUpBounceDuration);
      prevStateRef.current = state;
      return () => clearTimeout(t);
    }
    prevStateRef.current = state;
  }, [state]);

  const isResting = RESTING_STATES.has(state);
  const currentFrame = frames[frameIndex] ?? frames[0]!;

  return (
    <div
      className={`brandee-wrapper relative ${wakingUp ? 'brandee-wake-up' : ''}`}
      style={{ width: size, height: size }}
    >
      <div className={`w-full h-full ${isResting ? 'brandee-breathe' : ''}`}>
        <div className={`w-full h-full ${isResting ? 'brandee-float' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{    opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`w-full h-full ${microBehavior ? `brandee-${kebab(microBehavior)}` : ''}`}
            >
              <Image
                src={frameUrl(currentFrame)}
                alt={`Brandee — ${state}`}
                width={size}
                height={size}
                priority
                draggable={false}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
