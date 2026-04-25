'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AgentState } from '@/types';
import { AvatarCharacter } from './AvatarCharacter';
import { IndicatorLayer } from './IndicatorLayer';

const STATE_LABELS: Record<AgentState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

interface AvatarProps {
  state: AgentState;
}

export const Avatar = React.memo(function Avatar({ state }: AvatarProps) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full py-1 gap-1 lg:py-6 lg:gap-5">
      {/*
        Mobile:  height-driven — fills the 20vh card, width = h * (2/3)
        Desktop: width-driven — max 280px wide, height follows aspect ratio
      */}
      <div className="relative h-full aspect-[2/3] lg:h-auto lg:w-full lg:max-w-[280px]">
        <AvatarCharacter />
        <AnimatePresence mode="wait">
          <IndicatorLayer key={state} state={state} />
        </AnimatePresence>
      </div>

      {/* Desktop pill — in flex flow, right below the character, 3× the mobile size */}
      <div className="hidden lg:flex items-center bg-base/80 backdrop-blur-sm border border-divider rounded-full px-7 py-3">
        <span className="text-[30px] font-medium text-muted leading-none select-none">
          {STATE_LABELS[state]}
        </span>
      </div>

      {/* Mobile pill — absolute bottom-left, compact */}
      <div className="lg:hidden absolute bottom-2 left-2 flex items-center bg-base/80 backdrop-blur-sm border border-divider rounded-full px-2.5 py-1">
        <span className="text-[10px] font-medium text-muted leading-none select-none">
          {STATE_LABELS[state]}
        </span>
      </div>
    </div>
  );
});
