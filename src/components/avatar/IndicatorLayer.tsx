'use client';

import { motion } from 'framer-motion';
import type { AgentState } from '@/types';
import { SleepZs } from './indicators/SleepZs';
import { ListeningWaves } from './indicators/ListeningWaves';
import { ThinkingDots } from './indicators/ThinkingDots';
import { SpeakingLines } from './indicators/SpeakingLines';

interface IndicatorLayerProps {
  state: AgentState;
}

export function IndicatorLayer({ state }: IndicatorLayerProps) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {state === 'idle' && <SleepZs />}
      {state === 'listening' && <ListeningWaves />}
      {state === 'thinking' && <ThinkingDots />}
      {state === 'speaking' && <SpeakingLines />}
    </motion.div>
  );
}
