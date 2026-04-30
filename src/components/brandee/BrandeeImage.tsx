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
  /** When set, this frame is rendered instead of the state's primary image. */
  transitionFrame?: string | null;
}

/**
 * Renders the active Brandee frame with three animation layers:
 *
 *   Outer wrapper  → wake-up bounce (one-shot when leaving sleeping)
 *   Breathe wrap   → continuous breathe (resting states only)
 *   Float wrap     → continuous float   (resting states only)
 *   AnimatePresence→ short cross-fade between every distinct image
 *                    (state-to-state OR state-to-transition-frame)
 *   Micro-behavior → idle-only blink/look/wiggle/etc, paused mid-transition
 */
export function BrandeeImage({ state, size, transitionFrame = null }: BrandeeImageProps) {
  const frames        = getFrames(state);
  const microBehavior = useIdleBehavior(state, transitionFrame);
  const [frameIndex, setFrameIndex] = useState(0);

  // Frame swapping for multi-frame states (greeting). No cross-fade between
  // frames within a state — only between distinct images.
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
      const t = setTimeout(() => setWakingUp(false), 300);
      prevStateRef.current = state;
      return () => clearTimeout(t);
    }
    prevStateRef.current = state;
  }, [state]);

  const isResting    = RESTING_STATES.has(state) && transitionFrame === null;
  const stateFrame   = frames[frameIndex] ?? frames[0]!;
  const currentFrame = transitionFrame ?? stateFrame;
  // Cross-fade key: changes whenever the visible image changes.
  const presenceKey  = transitionFrame ?? state;

  return (
    <div
      className={`brandee-wrapper relative ${wakingUp ? 'brandee-wake-up' : ''}`}
      style={{ width: size, height: size }}
    >
      <div className={`w-full h-full ${isResting ? 'brandee-breathe' : ''}`}>
        <div className={`relative w-full h-full ${isResting ? 'brandee-float' : ''}`}>
          {/*
            Overlapping cross-fade: both old and new images coexist during the
            transition (positioned absolute, stacked), so we never have a
            moment where the avatar is invisible. `initial={false}` skips the
            very first mount fade so the avatar appears immediately on load.
          */}
          <AnimatePresence initial={false}>
            <motion.div
              key={presenceKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: TIMINGS.crossFadeDuration / 1000, ease: 'linear' }}
              className={`absolute inset-0 w-full h-full ${microBehavior ? `brandee-${kebab(microBehavior)}` : ''}`}
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
