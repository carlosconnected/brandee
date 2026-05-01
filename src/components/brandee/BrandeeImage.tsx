'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import type { BrandeeState } from '@/types';
import { frameUrl, getFrames, TIMINGS } from './constants';
import { useIdleBehavior } from './useIdleBehavior';

interface BrandeeImageProps {
  state: BrandeeState;
  size: number;
  /** When set, this frame is rendered instead of the state's primary image. */
  transitionFrame?: string | null;
}

/**
 * Renders the active Brandee frame with two animation layers:
 *
 *   Outer wrapper  → wake-up bounce (one-shot when leaving sleeping)
 *   AnimatePresence→ short cross-fade between every distinct image
 *                    (state-to-state OR state-to-transition-frame)
 *   Micro-behavior → idle-only blink/look/wiggle/etc, paused mid-transition
 *
 * Continuous breathe/float motion was removed because it conflicts with
 * the desk-overlay composition — Brandee's body shifting up and down breaks
 * her alignment with the desk top.
 */
export function BrandeeImage({ state, size, transitionFrame = null }: BrandeeImageProps) {
  const frames        = getFrames(state);
  const microBehavior = useIdleBehavior(state, transitionFrame);
  const [frameIndex, setFrameIndex] = useState(0);

  // Frame swapping for multi-frame states. Each frame has its own `hold` so
  // states can express different rhythms — e.g. greeting alternates every
  // 250ms (a wave) while idle holds eyes-open 5500ms then eyes-closed 500ms
  // (a natural blink).
  useEffect(() => {
    setFrameIndex(0);
    if (frames.length <= 1) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;

    function tick() {
      if (cancelled) return;
      i = (i + 1) % frames.length;
      setFrameIndex(i);
      timer = setTimeout(tick, frames[i]!.hold);
    }

    timer = setTimeout(tick, frames[0]!.hold);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state, frames]);

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

  const stateFrame   = frames[frameIndex]?.frame ?? frames[0]!.frame;
  const currentFrame = transitionFrame ?? stateFrame;
  // Cross-fade key — only changes on state changes or transition frames.
  // In-state frame swaps (greeting wave, idle blink) update the Image src
  // directly without triggering AnimatePresence, so they snap instantly.
  const presenceKey  = transitionFrame ?? state;

  return (
    <div
      className={`brandee-wrapper relative ${wakingUp ? 'brandee-wake-up' : ''}`}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full">
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
  );
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
