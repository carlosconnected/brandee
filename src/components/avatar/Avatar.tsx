'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AgentState } from '@/types';
import { AvatarCharacter } from './AvatarCharacter';
import { IndicatorLayer } from './IndicatorLayer';

const STATE_LABELS: Record<AgentState, string> = {
  idle: 'Resting...',
  listening: 'Listening',
  thinking: 'Thinking...',
  speaking: 'Responding',
};

interface AvatarProps {
  state: AgentState;
}

// React.memo prevents re-mounting the SVG character on every parent render
export const Avatar = React.memo(function Avatar({ state }: AvatarProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 px-4">
      {/* Container for character + overlays — aspect ratio matches viewBox 280/420 ≈ 2/3 */}
      <div className="relative w-full max-w-[280px] aspect-[2/3]">
        {/* Base SVG character — always mounted, never swapped */}
        <AvatarCharacter />

        {/* Animated overlay — swapped per state with AnimatePresence */}
        <AnimatePresence mode="wait">
          <IndicatorLayer key={state} state={state} />
        </AnimatePresence>
      </div>

      {/* State label */}
      <span className="text-xs font-medium tracking-[0.18em] uppercase text-muted select-none">
        {STATE_LABELS[state]}
      </span>
    </div>
  );
});
